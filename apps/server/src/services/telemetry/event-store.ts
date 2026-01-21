import { EventEmitter } from 'events';
import { ClaudeEvent, ApiStats, ToolStats } from './types.js';

const MAX_EVENTS_PER_SPRITE = 500;

export class EventStore extends EventEmitter {
  private events: Map<string, ClaudeEvent[]> = new Map();

  /**
   * Add a new event for a sprite
   */
  addEvent(
    spriteName: string,
    eventType: ClaudeEvent['eventType'],
    attributes: Record<string, any> = {},
    timestamp?: string
  ): void {
    if (!this.events.has(spriteName)) {
      this.events.set(spriteName, []);
    }

    const spriteEvents = this.events.get(spriteName)!;

    const event: ClaudeEvent = {
      timestamp: timestamp || new Date().toISOString(),
      eventType,
      spriteName,
      attributes,
    };

    spriteEvents.push(event);

    // Enforce limit (FIFO)
    if (spriteEvents.length > MAX_EVENTS_PER_SPRITE) {
      spriteEvents.shift();
    }

    this.emit('event', event);
  }

  /**
   * Get events for a sprite with optional filtering
   */
  getEvents(
    spriteName: string,
    limit: number = 100,
    eventTypes?: ClaudeEvent['eventType'][]
  ): ClaudeEvent[] {
    const spriteEvents = this.events.get(spriteName) || [];

    let filtered = spriteEvents;
    if (eventTypes && eventTypes.length > 0) {
      filtered = filtered.filter((e) => eventTypes.includes(e.eventType));
    }

    // Return most recent events
    return filtered.slice(-limit);
  }

  /**
   * Get events within the last N minutes
   */
  getTimeline(spriteName: string, minutes: number): ClaudeEvent[] {
    const spriteEvents = this.events.get(spriteName) || [];
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    return spriteEvents.filter((e) => e.timestamp >= cutoff);
  }

  /**
   * Aggregate API usage statistics
   */
  getApiStats(spriteName: string): ApiStats {
    const events = this.events.get(spriteName) || [];
    const stats: ApiStats = {
      totalRequests: 0,
      errors: 0,
      totalDurationMs: 0,
    };

    for (const event of events) {
      if (event.eventType === 'api_request') {
        stats.totalRequests++;
        if (event.attributes.durationMs) {
          stats.totalDurationMs += event.attributes.durationMs;
        }
      } else if (event.eventType === 'api_error') {
        stats.errors++;
      }
    }

    return stats;
  }

  /**
   * Aggregate Tool usage statistics
   */
  getToolStats(spriteName: string): ToolStats {
    const events = this.events.get(spriteName) || [];
    const stats: ToolStats = {};

    for (const event of events) {
      if (event.eventType === 'tool_decision' || event.eventType === 'tool_result') {
        const toolName = event.attributes.toolName;
        if (toolName) {
          if (!stats[toolName]) {
            stats[toolName] = { uses: 0, errors: 0 };
          }

          if (event.eventType === 'tool_decision') {
            stats[toolName].uses++;
          }

          if (event.attributes.error) {
            stats[toolName].errors++;
          }
        }
      }
    }

    return stats;
  }
}
