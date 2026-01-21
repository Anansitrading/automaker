import { createLogger } from '@automaker/utils';

const logger = createLogger('TelemetryStore');

export interface MetricTags {
  [key: string]: string | number | boolean;
}

/**
 * TelemetryStore - A simple store for recording application metrics.
 * Currently prints to log, but can be extended to send to an external collector (e.g., OTEL).
 */
export class TelemetryStore {
  private static instance: TelemetryStore;

  private constructor() {}

  public static getInstance(): TelemetryStore {
    if (!TelemetryStore.instance) {
      TelemetryStore.instance = new TelemetryStore();
    }
    return TelemetryStore.instance;
  }

  /**
   * Record a gauge metric (value at a point in time)
   */
  public recordGauge(name: string, value: number, tags: MetricTags = {}): void {
    logger.debug(`[Metric:GAUGE] ${name}: ${value}`, tags);
  }

  /**
   * Record a counter metric (cumulative count)
   */
  public recordCounter(name: string, value: number = 1, tags: MetricTags = {}): void {
    logger.debug(`[Metric:COUNTER] ${name}: +${value}`, tags);
  }

  /**
   * Record a histogram metric (distribution of values, e.g., duration)
   */
  public recordHistogram(name: string, value: number, tags: MetricTags = {}): void {
    logger.debug(`[Metric:HISTOGRAM] ${name}: ${value}`, tags);
  }

  /**
   * Record an error event
   */
  public recordError(name: string, error: Error, tags: MetricTags = {}): void {
    logger.error(`[Metric:ERROR] ${name}: ${error.message}`, { ...tags, stack: error.stack });
  }
}
