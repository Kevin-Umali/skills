# skills

My personal agent skills, in the `SKILL.md` format that Claude Code, Codex and other agents read.

## Install

```bash
npx skills add Kevin-Umali/skills
```

It lists the skills, then asks which agents to install them to. Useful options:

```bash
npx skills add Kevin-Umali/skills --list                      # see what is available
npx skills add Kevin-Umali/skills --skill state-prototyping   # one skill
npx skills add Kevin-Umali/skills -g                          # user-level instead of project-level
npx skills update                                             # pull the latest
npx skills remove state-prototyping
```

Prefer no tooling? Clone the repo and symlink a skill into your agent's skills folder, so `git pull` keeps it current:

```bash
ln -s "$PWD/skills/state-prototyping" ~/.claude/skills/state-prototyping
```

## Skills

### [state-prototyping](./skills/state-prototyping/SKILL.md)

Build an editable UI prototype with selectable, realistic application states, and review it before building it for real. Invoke it with `/state-prototyping` in Claude Code or `$state-prototyping` in Codex.

- Real states (loading, empty, error, success, conflict) from fictional fixtures, with no live calls.
- A review shell around them: searchable states, width and theme switching, and Before and After side by side.
- Optional highlights that outline what changed, list each change as `height 48px → 36px`, and give the reason.
- Starters for plain HTML and for React on one shared core, plus scripts that set up and check a prototype.
- It asks first: design references, helper skills and MCP servers, Before and After, and highlights.

## Develop

```bash
npm run check-frontmatter
```

Each skill is a folder under `skills/` with a `SKILL.md`. Conventions for editing are in [AGENTS.md](./AGENTS.md). Changes are listed in [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)
