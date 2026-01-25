import { createLogger } from '@automaker/utils';
import client from 'prom-client';

const logger = createLogger('TelemetryStore');

export interface MetricTags {
  [key: string]: string | number | boolean;
}

/**
 * TelemetryStore - A simple store for recording application metrics.
 * Now extended to send specific metrics to Prometheus.
 */
export class TelemetryStore {
  private static instance: TelemetryStore;
  private register: client.Registry;

  // Prometheus Metrics
  private sandboxesTotal: client.Counter;
  private sandboxesActive: client.Gauge;
  private checkpointsTotal: client.Counter;
  private checkpointDuration: client.Histogram;
  private execDuration: client.Histogram;

  private constructor() {
    this.register = new client.Registry();

    // Add default metrics (optional, maybe too noisy for this specific request, keeping it clean for now or adding if requested)
    // client.collectDefaultMetrics({ register: this.register });

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
      // internal name mapping
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

    // Value coming in is likely ms, simple conversion if needed or just record
    // Prometheus standard is seconds usually, but we need to check how it's emitted.
    // Assuming input is ms from the services.
    const seconds = value / 1000;

    if (name === 'sprites.checkpoint.duration') {
      this.checkpointDuration.observe(seconds);
    } else if (name === 'sprites.exec.duration') {
      this.execDuration.observe(seconds);
    }
  }

  /**
   * Record an error event
   */
  public recordError(name: string, error: Error, tags: MetricTags = {}): void {
    logger.error(`[Metric:ERROR] ${name}: ${error.message}`, { ...tags, stack: error.stack });
  }
}
