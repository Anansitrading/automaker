/**
 * FirecrackerManager
 *
 * Manages the low-level lifecycle of Firecracker microVMs.
 */

export interface VMConfig {
  cpuCount: number;
  memoryMib: number;
  kernelArgs?: string;
  rootDrivePath: string;
  tapDevice?: string;
}

export interface VMInfo {
  id: string;
  state: 'Running' | 'Paused' | 'Off';
  ipAddress?: string;
  pid?: number;
}

export interface FirecrackerManager {
  /**
   * Start a new VM instance
   */
  startVM(id: string, config: VMConfig): Promise<VMInfo>;

  /**
   * Stop a VM instance
   */
  stopVM(id: string): Promise<void>;

  /**
   * Get VM status
   */
  getVM(id: string): Promise<VMInfo | null>;

  /**
   * Create a snapshot of a running VM
   */
  createSnapshot(id: string, snapshotPath: string): Promise<void>;

  /**
   * Restore a VM from a snapshot
   */
  restoreSnapshot(id: string, snapshotPath: string): Promise<VMInfo>;
}
