Each skill is a folder under `skills/<skill-name>/` containing a `SKILL.md`. The folder name must equal the `name` in the frontmatter, and the frontmatter must have a `description`.

Supporting files live beside `SKILL.md` in `references/`, `assets/` and `agents/`, and are linked from `SKILL.md` with relative paths.

When you add, rename or remove a skill, update the Skills list in `README.md` (skill name linked to its `SKILL.md`). Add changes to `CHANGELOG.md` under `## Unreleased` as you go. Bump `package.json` once per release, never per edit. To release, rename `## Unreleased` to the new version, bump `version` in `package.json`, `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` (`npm run check-plugin` confirms they match), and push to main: the release workflow tags `v<version>` and publishes the GitHub release from that changelog section.

Run `npm run check-frontmatter` after touching any `SKILL.md`.

Skills must work without any one framework. Put stack-specific code in a clearly named asset folder (for example `assets/<thing>/react/`) and keep it optional.

Never put machine-specific details in a skill: absolute paths, usernames, home directories or lockfile locations.

Code in `assets/` is meant to be read and adapted. Prefer `const` arrow functions, name module-level constants in `SCREAMING_SNAKE_CASE`, use descriptive names (no single letters), and keep every file under 500 lines. Logic shared by more than one starter lives in that skill's `core/`, never copied.

When a skill ships starters for more than one stack, they must behave the same. Run the same checks on each before saying they are aligned.
