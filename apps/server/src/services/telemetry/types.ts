export interface SpriteTelemetry {
  spriteName: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  costUsd: number;
  sessions: number;
  commits: number;
  pullRequests: number;
  linesAdded: number;
  linesRemoved: number;
  model?: string;
  lastUpdated?: string;
  status: 'active' | 'no_data';
}

export interface ClaudeEvent {
  timestamp: string;
  eventType: 'user_prompt' | 'api_request' | 'api_error' | 'tool_result' | 'tool_decision';
  spriteName: string;
  attributes: Record<string, any>;
}

export interface ApiStats {
  // Placeholder for future API statistics
  [key: string]: any;
}

export interface ToolStats {
  // Placeholder for future tool usage statistics
  [key: string]: any;
}
