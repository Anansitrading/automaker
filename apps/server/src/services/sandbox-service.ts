import { EventEmitter } from 'events';
import { createLogger } from '@automaker/utils';
import type { FirecrackerManager, VMConfig, VMInfo } from '../lib/firecracker-manager.js';

const logger = createLogger('SandboxService');

export interface SandboxConfig {
  name: string;
  template?: string; // e.g. 'node-18', 'python-3'
  limits?: {
    cpu: number;
    memoryMib: number;
  };
}

export interface Sandbox {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  vmId?: string;
  ipAddress?: string;
  createdAt: Date;
}

export class SandboxService extends EventEmitter {
  private sandboxes = new Map<string, Sandbox>();
  private vmManager: FirecrackerManager;

  constructor(vmManager: FirecrackerManager) {
    super();
    this.vmManager = vmManager;
  }

  /**
   * Create and start a new sandbox
   */
  async createSandbox(config: SandboxConfig): Promise<Sandbox> {
    const id = `sbx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const vmId = `vm-${id}`;

    // Default limits
    const cpuCount = config.limits?.cpu || 1;
    const memoryMib = config.limits?.memoryMib || 512;

    logger.info(
      `Creating sandbox ${id} (${config.name}) with ${cpuCount} vCPU, ${memoryMib}MB RAM`
    );

    try {
      // In a real impl, we'd select a rootfs based on config.template
      const vmConfig: VMConfig = {
        cpuCount,
        memoryMib,
        rootDrivePath: `./images/${config.template || 'default'}.ext4`,
      };

      const vmInfo = await this.vmManager.startVM(vmId, vmConfig);

      const sandbox: Sandbox = {
        id,
        name: config.name,
        status: 'running',
        vmId: vmInfo.id,
        ipAddress: vmInfo.ipAddress,
        createdAt: new Date(),
      };

      this.sandboxes.set(id, sandbox);
      this.emit('sandbox:created', sandbox);

      return sandbox;
    } catch (error) {
      logger.error(`Failed to create sandbox ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a sandbox by ID
   */
  async getSandbox(id: string): Promise<Sandbox | null> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) return null;
    return sandbox;
  }

  /**
   * Hibernate (stop) a sandbox
   */
  async hibernateSandbox(id: string): Promise<void> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) throw new Error(`Sandbox ${id} not found`);

    if (sandbox.vmId) {
      logger.info(`Hibernating sandbox ${id} (VM ${sandbox.vmId})`);
      await this.vmManager.stopVM(sandbox.vmId);
      sandbox.status = 'stopped';
      this.emit('sandbox:stopped', id);
    }
  }

  /**
   * Wake (start) a hibernated sandbox
   */
  async wakeSandbox(id: string): Promise<void> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) throw new Error(`Sandbox ${id} not found`);

    if (sandbox.status === 'running') return;

    if (sandbox.vmId) {
      logger.info(`Waking sandbox ${id} (VM ${sandbox.vmId})`);

      // Check if we need to restore from snapshot or just cold boot
      // For simplicity assuming cold boot reusing previous config logic would be here
      // But since we mocked it, let's assume we can confirm it's running via manager

      // This is a simplification; in reality we might need stored config
      // or effectively "restore" the VM resource
    }
  }

  async createCheckpoint(id: string, name: string): Promise<string> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox || !sandbox.vmId) throw new Error(`Sandbox ${id} not valid`);

    const snapshotPath = `./snapshots/${id}-${name}.snap`;
    await this.vmManager.createSnapshot(sandbox.vmId, snapshotPath);
    return snapshotPath;
  }

  async restoreCheckpoint(id: string, snapshotPath: string): Promise<void> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox || !sandbox.vmId) throw new Error(`Sandbox ${id} not valid`);

    // Ensure stopped before restore? Or manager handles it.
    await this.vmManager.restoreSnapshot(sandbox.vmId, snapshotPath);
    sandbox.status = 'running';
    this.emit('sandbox:restored', id);
  }
}
