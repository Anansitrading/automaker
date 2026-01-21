import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '@automaker/utils';
import { TelemetryStore } from './telemetry-store.js';
import { EventStore } from './event-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = createLogger('OtelReceiver');

const PROTO_PATH_METRICS = path.join(
  __dirname,
  'protos/opentelemetry/proto/collector/metrics/v1/metrics_service.proto'
);
const PROTO_PATH_LOGS = path.join(
  __dirname,
  'protos/opentelemetry/proto/collector/logs/v1/logs_service.proto'
);

export class OtelReceiver {
  private server: grpc.Server;
  private telemetryStore: TelemetryStore;
  private eventStore: EventStore;
  private port: number;

  constructor(telemetryStore: TelemetryStore, eventStore: EventStore, port: number = 4317) {
    this.telemetryStore = telemetryStore;
    this.eventStore = eventStore;
    this.port = port;
    this.server = new grpc.Server();
  }

  public async start(): Promise<void> {
    await this.loadProtos();

    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        `0.0.0.0:${this.port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            logger.error('Failed to bind gRPC server', error);
            reject(error);
            return;
          }
          logger.info(`OtelReceiver listening on port ${port}`);
          this.server.start();
          resolve();
        }
      );
    });
  }

  public stop(): void {
    this.server.forceShutdown();
    logger.info('OtelReceiver stopped');
  }

  private async loadProtos() {
    const options = {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [path.join(__dirname, 'protos')],
    };

    // Load Metrics Service
    const metricsPackageDef = await protoLoader.load(PROTO_PATH_METRICS, options);
    const metricsProto = grpc.loadPackageDefinition(metricsPackageDef) as any;
    const metricsService =
      metricsProto.opentelemetry.proto.collector.metrics.v1.MetricsService.service;

    this.server.addService(metricsService, {
      Export: this.exportMetrics.bind(this),
    });

    // Load Logs Service
    const logsPackageDef = await protoLoader.load(PROTO_PATH_LOGS, options);
    const logsProto = grpc.loadPackageDefinition(logsPackageDef) as any;
    const logsService = logsProto.opentelemetry.proto.collector.logs.v1.LogsService.service;

    this.server.addService(logsService, {
      Export: this.exportLogs.bind(this),
    });
  }

  private exportMetrics(call: any, callback: any) {
    try {
      const resourceMetrics = call.request.resource_metrics || [];

      for (const rm of resourceMetrics) {
        const spriteName = this.extractSpriteName(rm.resource);
        if (!spriteName) continue;

        for (const sm of rm.scope_metrics || []) {
          for (const metric of sm.metrics || []) {
            this.processMetric(spriteName, metric);
          }
        }
      }

      callback(null, { partial_success: null });
    } catch (err: any) {
      logger.error('Error processing metrics export', err);
      callback(err);
    }
  }

  private processMetric(spriteName: string, metric: any) {
    const name = metric.name;
    const data = metric.data || metric.gauge || metric.sum || metric.histogram; // Simplification

    // We only care about specific types for now, mostly Sum/Gauge
    let dataPoints = [];
    if (metric.sum) dataPoints = metric.sum.data_points;
    else if (metric.gauge) dataPoints = metric.gauge.data_points;
    // Histogram handling skipped for simplicity unless needed

    if (!dataPoints) return;

    for (const dp of dataPoints) {
      const value = dp.as_double || parseInt(dp.as_int) || 0;
      const attributes = this.parseAttributes(dp.attributes);

      this.telemetryStore.handleMetric(spriteName, name, value, attributes);
    }
  }

  private exportLogs(call: any, callback: any) {
    try {
      const resourceLogs = call.request.resource_logs || [];

      for (const rl of resourceLogs) {
        const spriteName = this.extractSpriteName(rl.resource);
        if (!spriteName) continue;

        for (const sl of rl.scope_logs || []) {
          for (const log of sl.log_records || []) {
            this.processLog(spriteName, log);
          }
        }
      }

      callback(null, { partial_success: null });
    } catch (err: any) {
      logger.error('Error processing logs export', err);
      callback(err);
    }
  }

  private processLog(spriteName: string, log: any) {
    const body = log.body?.string_value || JSON.stringify(log.body);
    const attributes = this.parseAttributes(log.attributes);
    // Timestamp: prioritize time_unix_nano, then observed_time_unix_nano
    const timestampNano = log.time_unix_nano || log.observed_time_unix_nano;
    // Convert nano string to ISO string. Only approximates ms precision.
    const timestampMs = parseInt(timestampNano.substring(0, timestampNano.length - 6));
    const timestamp = new Date(timestampMs).toISOString();

    // Mapping log entry to ClaudeEvent
    // Assuming the log body or attributes contain the 'eventType'
    // If not, we might treat it as a generic log or infer from structure.
    // For now, let's assume attributes['event_type'] exists or similar,
    // OR we just treat everything as a generic log if not specified.

    // Default to 'tool_result' or 'api_request' based on what we find?
    // Actually, the requirements say: "Parse event logs and forward to EventStore"
    // And "Event Types: user_prompt, api_request..."
    // We assume the sender (Claude) sets an attribute `event_type`.

    const eventType = attributes['event_type'] || 'api_request'; // Defaulting/Fallback

    this.eventStore.addEvent(
      spriteName,
      eventType as any,
      {
        ...attributes,
        body,
      },
      timestamp
    );
  }

  private extractSpriteName(resource: any): string | null {
    if (!resource || !resource.attributes) return null;
    const attrs = this.parseAttributes(resource.attributes);
    // Look for service.instance.id or service.name with suffix
    // Requirement says: "Extract sprite name from service.instance.id"
    if (attrs['service.instance.id']) {
      return attrs['service.instance.id'];
    }
    // Fallback?
    if (attrs['service.name'] && attrs['service.name'].startsWith('claude-')) {
      return attrs['service.name'].replace('claude-', '');
    }
    return null;
  }

  private parseAttributes(attributes: any[]): Record<string, any> {
    const result: Record<string, any> = {};
    if (!attributes) return result;

    for (const attr of attributes) {
      const key = attr.key;
      const value = attr.value;

      if (value.string_value !== undefined) result[key] = value.string_value;
      else if (value.int_value !== undefined) result[key] = parseInt(value.int_value);
      else if (value.bool_value !== undefined) result[key] = value.bool_value;
      else if (value.double_value !== undefined) result[key] = value.double_value;
      // bytes, array, kvlist skipped for now
    }
    return result;
  }
}
