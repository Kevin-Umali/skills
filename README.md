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

Prototype a screen or flow with realistic states (loading, empty, error, success) to review before building it. Changes are written as real project code, so the approved prototype moves into the codebase instead of being rebuilt. Invoke it with `/state-prototyping` in Claude Code or `$state-prototyping` in Codex.

- Real states from fictional fixtures, with no live calls.
- A review shell: searchable states, width and theme switching, and the current screen beside the proposed one.
- Optional highlights that outline what changed, list each change as `height 48px → 36px`, and give the reason.
- Proposed changes are copies of the project's own files, kept in the prototype until approval and written in its styling, tokens and components.
- The numbers each change must render live in one `spec.js` and are measured in the page, not read from class names.
- On approval the files move into the project, and a parity check confirms the shipped screen matches the prototype.
- Starters for plain HTML and React on one shared core, scripts to set up, check and measure a prototype, and an optional Vite plugin.
- It asks first: design references, helper skills and MCP servers, a side-by-side comparison, and highlights.

## Develop

```bash
npm run check-frontmatter
```

Each skill is a folder under `skills/` with a `SKILL.md`. Conventions for editing are in [AGENTS.md](./AGENTS.md). Changes are listed in [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)
