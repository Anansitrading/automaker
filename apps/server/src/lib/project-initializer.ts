import * as path from 'path';
import * as fs from 'fs';
import { ensureAutomakerDir } from '@automaker/platform';
import { createLogger } from '@automaker/utils';

const logger = createLogger('ProjectInitializer');

/**
 * Ensures that the project has the necessary .automaker structure and files.
 * This is called when opening a project or updating settings to guarantee
 * validity, especially for test environments.
 */
export async function ensureProjectInitialized(projectPath: string): Promise<void> {
  try {
    // 1. Ensure basic structure
    await ensureAutomakerDir(projectPath);

    const automakerDir = path.join(projectPath, '.automaker');
    const featuresDir = path.join(automakerDir, 'features');
    const contextDir = path.join(automakerDir, 'context');
    const categoriesPath = path.join(automakerDir, 'categories.json');

    if (!fs.existsSync(featuresDir)) {
      fs.mkdirSync(featuresDir, { recursive: true });
    }

    if (!fs.existsSync(contextDir)) {
      fs.mkdirSync(contextDir, { recursive: true });
    }

    if (!fs.existsSync(categoriesPath)) {
      fs.writeFileSync(categoriesPath, JSON.stringify({ categories: [] }, null, 2));
    }
  } catch (error) {
    logger.error('Failed to initialize project structure:', error);
    throw error;
  }
}
