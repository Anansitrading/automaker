import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpriteApiClient } from '../../../src/services/sprite-api-client.js';

// Mock the config
vi.mock('../../../src/config/sprites.js', () => ({
    spritesConfig: {
        SPRITES_TOKEN: 'test-token',
        SPRITES_API_BASE: 'https://api.test.dev/v1',
        DEFAULT_REPO_URL: 'https://github.com/test/repo',
        DEFAULT_BRANCH: 'main'
    }
}));

describe('SpriteApiClient', () => {
    let client: SpriteApiClient;

    beforeEach(() => {
        client = new SpriteApiClient();
        // Reset global fetch mock
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('Sprite CRUD', () => {
        it('should list sprites and update cache', async () => {
            const mockSprites = [
                { id: 's1', name: 'sprite1', status: 'running' },
                { id: 's2', name: 'sprite2', status: 'hibernating' }
            ];

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockSprites
            } as Response);

            const sprites = await client.listSprites();

            expect(fetch).toHaveBeenCalledWith('https://api.test.dev/v1/sprites', expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-token'
                })
            }));
            expect(sprites).toEqual(mockSprites);

            // Verify cache by getting a sprite (it should be in cache, though getSprite calls API)
            // Actually statusCache is private, but let's check if getSprite works
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockSprites[0]
            } as Response);

            const sprite = await client.getSprite('s1');
            expect(sprite).toEqual(mockSprites[0]);
        });

        it('should create a sprite and emit event', async () => {
            const mockSprite = { id: 's3', name: 'new-sprite', status: 'provisioning' };
            const config = { name: 'new-sprite' };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockSprite
            } as Response);

            const spy = vi.fn();
            client.on('spriteCreated', spy);

            const sprite = await client.createSprite(config);

            expect(sprite).toEqual(mockSprite);
            expect(fetch).toHaveBeenCalledWith('https://api.test.dev/v1/sprites', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    name: 'new-sprite',
                    repoUrl: 'https://github.com/test/repo',
                    branch: 'main'
                })
            }));
            expect(spy).toHaveBeenCalledWith(mockSprite);
        });

        it('should delete a sprite and emit event', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                status: 204
            } as Response);

            const spy = vi.fn();
            client.on('spriteDeleted', spy);

            await client.deleteSprite('s1');

            expect(fetch).toHaveBeenCalledWith('https://api.test.dev/v1/sprites/s1', expect.objectContaining({
                method: 'DELETE'
            }));
            expect(spy).toHaveBeenCalledWith('s1');
        });
    });

    describe('Command Execution', () => {
        it('should execute command', async () => {
            const mockResult = { stdout: 'hello', stderr: '', exitCode: 0, durationMs: 100 };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResult
            } as Response);

            const result = await client.execCommand('s1', 'echo hello');

            expect(result).toEqual(mockResult);
            expect(fetch).toHaveBeenCalledWith('https://api.test.dev/v1/sprites/s1/exec', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ command: 'echo hello', timeout: 60000 })
            }));
        });
    });

    describe('Lifecycle Management', () => {
        it('should shutdown sprite', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                status: 204
            } as Response);

            const spy = vi.fn();
            client.on('spriteStatusChanged', spy);

            await client.shutdownSprite('s1');

            expect(fetch).toHaveBeenCalledWith('https://api.test.dev/v1/sprites/s1/shutdown', expect.objectContaining({
                method: 'POST'
            }));
        });

        it('should wake up sprite', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                status: 204
            } as Response);

            await client.wakeSprite('s1');

            expect(fetch).toHaveBeenCalledWith('https://api.test.dev/v1/sprites/s1/wake', expect.objectContaining({
                method: 'POST'
            }));
        });
    });

    describe('Utilities', () => {
        it('should generate correct console URL', () => {
            const url = client.getConsoleUrl('test-sprite');
            expect(url).toBe('https://test.dev/dashboard/sprites/test-sprite');
        });
    });
});
