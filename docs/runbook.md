# AutoMaker Runbook

This runbook documents operational procedures for managing AutoMaker, specifically focusing on the Sandbox (Sprites) environment.

## Sandbox Management

AutoMaker uses "Sprites" (sandboxes) to isolate agent execution.

### Configuration

Sandbox usage is controlled by the `sandboxEnabled` global setting.
Default: `true`.

To disable sandboxes globally (kill-switch):

1.  Open `settings.json` (available via Settings UI).
2.  Set `sandboxEnabled` to `false`.
3.  Restart the server / reload the application.

**Effect:**

- New agents will strictly use host-based execution.
- Existing sessions that were using a sandbox will fallback to host-based execution upon resume.
- No **new** sandboxes will be provisioned.
- Existing sandboxes remain running but detached (unless manually cleaned up).

### Rollback Procedure (Issues with Sandboxes)

If you encounter critical issues with the sandbox environment (e.g., connection failures, severe latency, data loss risks), follow these steps to rollback to local execution:

1.  **Enable Kill-Switch**:
    Follow the "Configuration" steps above to set `sandboxEnabled: false`.

2.  **Verify Local Execution**:
    Start a new chat session. Verify (via logs or behavior) that it is executing commands on the local host machine, not in a container.

3.  **(Optional) Recover Data from Sandboxes**:
    If you have valuable data inside a sandbox that you can no longer access via the agent, use the `console` WebSocket endpoint or `exec` API to retrieve it, or create a checkpoint.

### Checkpoints & Exports

Before destroying a sandbox or abandoning it, you can create a checkpoint to save its state.

**Via API/Service:**
Currently, checkpoints are managed via the `SpriteService` internal API.
There is no direct UI button for "Export Checkpoint" yet, but it happens automatically during certain lifecycle events or can be triggered via dev tools.

**Manual Checkpoint (Dev/Admin):**
To manually trigger a checkpoint (requires access to server console/code):

```typescript
await spriteService.createCheckpoint(spriteId, 'manual-backup-before-destroy');
```

**Exporting Data:**
To export data files from a running sandbox:

1.  Connect via the WebSocket Console: `/api/sandboxes/:name/console`
2.  Use `cat` or `tar` to dump files.
3.  Alternatively, use the `read_file` tool capabilities if the agent is still responsive.

### Emergency Cleanup

If sandboxes are stuck or consuming excessive resources:

1.  Shut down the AutoMaker server.
2.  Log in to the Sprites.dev dashboard (if applicable) or use the API manually to list and delete sprites.
3.  **Note**: Deleting a sprite is destructive and irreversible. Ensure you have checkpoints if needed.
