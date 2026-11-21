Each skill is a folder under `skills/<skill-name>/` containing a `SKILL.md`. The folder name must equal the `name` in the frontmatter, and the frontmatter must have a `description`.

Supporting files live beside `SKILL.md` in `references/`, `assets/` and `agents/`, and are linked from `SKILL.md` with relative paths.

When you add, rename or remove a skill, update the Skills list in `README.md` (skill name linked to its `SKILL.md`) and add an entry to `CHANGELOG.md`, bumping the version in `package.json`.

Run `npm run check-frontmatter` after touching any `SKILL.md`.

Skills must work without any one framework. Put stack-specific code in a clearly named asset folder (for example `assets/<thing>/react/`) and keep it optional.

Never put machine-specific details in a skill: absolute paths, usernames, home directories or lockfile locations.
