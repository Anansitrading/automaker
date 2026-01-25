import { EventEmitter } from 'events';
import client from 'prom-client';
import { createLogger } from '@automaker/utils';
import { SpriteTelemetry } from './types.js';

const logger = createLogger('TelemetryStore');

export interface MetricTags {
  [key: string]: string | number | boolean;
}

export class TelemetryStore extends EventEmitter {
  private static instance: TelemetryStore;
  private register: client.Registry;
  private store: Map<string, SpriteTelemetry> = new Map();

  // Prometheus Metrics
  private sandboxesTotal: client.Counter;
  private sandboxesActive: client.Gauge;
  private checkpointsTotal: client.Counter;
  private checkpointDuration: client.Histogram;
  private execDuration: client.Histogram;

  constructor() {
    super();
    this.register = new client.Registry();

    this.sandboxesTotal = new client.Counter({
      name: 'automaker_sandboxes_total',
      help: 'Total sandboxes created',
      registers: [this.register],
    });

    this.sandboxesActive = new client.Gauge({
      name: 'automaker_sandboxes_active',
      help: 'Currently active sandboxes',
      registers: [this.register],
    });

    this.checkpointsTotal = new client.Counter({
      name: 'automaker_checkpoints_total',
      help: 'Total checkpoints created',
      registers: [this.register],
    });

    this.checkpointDuration = new client.Histogram({
      name: 'automaker_checkpoint_duration_seconds',
      help: 'Checkpoint creation duration',
      registers: [this.register],
    });

    this.execDuration = new client.Histogram({
      name: 'automaker_exec_duration_seconds',
      help: 'Command execution duration',
      registers: [this.register],
    });
  }

  public static getInstance(): TelemetryStore {
    if (!TelemetryStore.instance) {
      TelemetryStore.instance = new TelemetryStore();
    }
    return TelemetryStore.instance;
  }

  public async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Record a gauge metric (value at a point in time)
   */
  public recordGauge(name: string, value: number, tags: MetricTags = {}): void {
    logger.debug(`[Metric:GAUGE] ${name}: ${value}`, tags);

    if (name === 'sandboxes.active') {
      this.sandboxesActive.set(value);
    }
  }

  /**
   * Record a counter metric (cumulative count)
   */
  public recordCounter(name: string, value: number = 1, tags: MetricTags = {}): void {
    logger.debug(`[Metric:COUNTER] ${name}: +${value}`, tags);

    if (name === 'sprites.created') {
      this.sandboxesTotal.inc(value);
      this.sandboxesActive.inc(value);
    } else if (name === 'sprites.deleted' || name === 'sprites.shutdown') {
      this.sandboxesActive.dec(value);
    } else if (name === 'sprites.woken') {
      this.sandboxesActive.inc(value);
    } else if (name === 'sprites.checkpoint.created') {
      this.checkpointsTotal.inc(value);
    }
  }

  /**
   * Record a histogram metric (distribution of values, e.g., duration)
   */
  public recordHistogram(name: string, value: number, tags: MetricTags = {}): void {
    logger.debug(`[Metric:HISTOGRAM] ${name}: ${value}`, tags);

    const seconds = value / 1000;

    if (name === 'sprites.checkpoint.duration') {
      this.checkpointDuration.observe(seconds);
    } else if (name === 'sprites.exec.duration') {
      this.execDuration.observe(seconds);
    } else if (name === 'sprites.list.duration') {
      // Optional: add metric for list duration if needed
    } else if (name === 'sprites.create.duration') {
      // Optional: add metric
    } else if (name === 'sprites.restore.duration') {
      // Optional
    }
  }

  /**
   * Record an error event
   */
  public recordError(name: string, error: Error, tags: MetricTags = {}): void {
    logger.error(`[Metric:ERROR] ${name}: ${error.message}`, { ...tags, stack: error.stack });
  }

  private getInitialState(spriteName: string): SpriteTelemetry {
    return {
      spriteName,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      costUsd: 0,
      sessions: 0,
      commits: 0,
      pullRequests: 0,
      linesAdded: 0,
      linesRemoved: 0,
      status: 'active',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get telemetry for a specific sprite
   */
  get(spriteName: string): SpriteTelemetry {
    return this.store.get(spriteName) || this.getInitialState(spriteName);
  }

  /**
   * Get all sprites telemetry
   */
  getAll(): SpriteTelemetry[] {
    return Array.from(this.store.values());
  }

  /**
   * Handle incoming metric updates
   */
  handleMetric(
    spriteName: string,
    metricName: string,
    value: number,
    attributes: Record<string, any> = {}
  ): void {
    let telemetry = this.store.get(spriteName);
    if (!telemetry) {
      telemetry = this.getInitialState(spriteName);
      this.store.set(spriteName, telemetry);
    }

    telemetry.lastUpdated = new Date().toISOString();
    telemetry.status = 'active';

    switch (metricName) {
      case 'claude_code.token.usage':
        const type = attributes['type'];
        if (type === 'input') telemetry.inputTokens += value;
        else if (type === 'output') telemetry.outputTokens += value;
        else if (type === 'cacheread' || type === 'cache_read') telemetry.cacheReadTokens += value;
        else if (type === 'cachecreation' || type === 'cache_creation')
          telemetry.cacheCreationTokens += value;
        break;

      case 'claude_code.cost.usage':
        telemetry.costUsd += value;
        break;

      case 'claude_code.session.count':
        telemetry.sessions += value;
        break;

      case 'claude_code.commit.count':
        telemetry.commits += value;
        break;

      case 'claude_code.pull_request.count':
        telemetry.pullRequests += value;
        break;

      case 'claude_code.lines_of_code.count':
        const locType = attributes['type'];
        if (locType === 'added') telemetry.linesAdded += value;
        else if (locType === 'removed') telemetry.linesRemoved += value;
        break;
    }

    this.emit('update', telemetry);
  }
}
