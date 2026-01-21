export const spritesConfig = {
  SPRITES_TOKEN: process.env.SPRITES_TOKEN,
  SPRITES_API_BASE: process.env.SPRITES_API_BASE || 'https://api.sprites.dev/v1',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  LINEAR_API_KEY: process.env.LINEAR_API_KEY,
  CLAUDE_OAUTH_TOKEN: process.env.CLAUDE_OAUTH_TOKEN,
  DEFAULT_REPO_URL: process.env.DEFAULT_REPO_URL,
  DEFAULT_BRANCH: process.env.DEFAULT_BRANCH || 'main',
  GIT_USER_NAME: process.env.GIT_USER_NAME || 'Automaker Agent',
  GIT_USER_EMAIL: process.env.GIT_USER_EMAIL || 'agent@automaker.dev',
  OTEL_RECEIVER_PORT: parseInt(process.env.OTEL_RECEIVER_PORT || '4317'),
  OTEL_RECEIVER_HOST: process.env.OTEL_RECEIVER_HOST || '0.0.0.0',
};
