# Git Worktrees Skill

# IDENTIFIER: automaker-worktree-skill

## Description

This skill enables the agent to manage isolated development environments using Git Worktrees, which is the preferred way to work in the Automaker repository.

## Instructions

- Always use `git worktree list` before creating new ones to avoid path conflicts.
- Prefer naming worktrees with the prefix `../automaker-worktree-`.
- Ensure you are in the root of the repository before running worktree commands.
- Use the `git-worktree` workflow for step-by-step execution.
