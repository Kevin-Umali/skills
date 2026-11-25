# Contributing

This is a personal collection. Pull requests are not open. If you spot a bug in a skill, open an issue with the steps that show the problem, kept short.

## Releases

Add changes to `CHANGELOG.md` under `## Unreleased` as you go. Do not bump `package.json` per edit. To release, rename `## Unreleased` to the new version, bump `version` in `package.json` and both plugin manifests once (`npm run check-plugin` confirms they match), and push to main. The release workflow creates the `v<version>` tag and GitHub release from that changelog section, and does nothing if the tag already exists. Preview the notes with `npm run release-notes -- <version>`.
