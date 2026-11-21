# skills

My personal collection of agent skills. Each skill lives in its own folder under `skills/` with a `SKILL.md`.

## Skills

- [state-prototyping](./skills/state-prototyping/SKILL.md): Build an editable UI prototype with selectable, realistic application states for visual or interaction review before production implementation. Stack-agnostic; the optional review shell starter is React, and other stacks port it.

## Install

Symlink a skill into the harness skill directory, so a `git pull` keeps it current:

```bash
ln -s "$PWD/skills/state-prototyping" ~/.claude/skills/state-prototyping
```

## Checks

```bash
npm run check-frontmatter
```
