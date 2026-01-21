import { EventEmitter } from 'events';
import { SpriteTelemetry } from './types.js';

export class TelemetryStore extends EventEmitter {
  private store: Map<string, SpriteTelemetry> = new Map();

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
