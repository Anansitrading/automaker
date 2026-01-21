---
description: How to manage git worktrees in Automaker (IDENTIFIER: automaker-worktree-workflow)
---

# Git Worktree Workflow

This workflow describes how to safely use git worktrees for feature development in Automaker.

1. **Check existing worktrees**:
   ```bash
   git worktree list
   ```

2. **Create a new worktree for a feature**:
   ```bash
   git worktree add ../automaker-feature-<name> -b feature/<name>
   ```

3. **Navigate to the worktree**:
   - `cd ../automaker-feature-<name>`

4. **Remove worktree after completion**:
   ```bash
   git worktree remove ../automaker-feature-<name>
   git branch -d feature/<name>
   ```

// turbo
5. **Verify current setup**:
   git status
