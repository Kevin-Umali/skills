# Changelog

## 0.1.3

- `state-prototyping`: the opening questions now start with what to prototype when the request is vague (for example only `/state-prototyping table`), allow at most four questions per tool call, and default the shell stack from `detect-context`.
- Single-preview mode and a highlights switch, set by `init-prototype --no-comparison` and `--no-highlights` instead of editing the copied shell. With no comparison the Compare group, Before frame, highlights and legend are gone.
- `init-prototype` also writes placeholder `before/frame.html` and `after/frame.html` pages that read `state`, `theme` and `reset`.
- `check-prototype` no longer asks for `before/frame.html` in single-preview mode. Fixed the `hidden` attribute being overridden by flex in the shell CSS.
- Skill text now says to serve the shell over HTTP, record unencoded substates in `limits`, and scale the work to the task.
- Found by running the original and current skill on the same task. In that trial the fixed skill used fewer tokens and tool calls than either earlier run.

## 0.1.2

- `state-prototyping`: opening questions use the harness's question tool and cover design references, helpers, Before and After, and highlights.
- Catalog now lists skills and MCP servers (`devlibs`, `ruixen-mcp`), each with a website or GitHub source, plus `tactile-design` and `interaction-design`.
- Review shell: a fixed window with previews filling the content area, a compact top bar, a floating Previous/Next navigator, a collapsible sidebar and a docked Changes inspector.
- Highlights (optional): outlines and badges over changed elements, a measured `property  old → new` list with agent-written reasons, and JSON and Markdown output. Selecting a change outlines only it. Works in every comparison mode.
- Vanilla and React starters share a framework-free `core/` and behave the same.
- Scripts: `init-prototype`, `check-prototype`, `detect-context`.
- Skill text cut roughly in half. User, developer and agent experience are a lens, not UI.
- Made stack-agnostic, removed machine-specific paths, replaced the career example with a billing one.

## 0.1.1

- `state-prototyping`: made stack-agnostic (React starter moved to `assets/review-shell/react/`), removed machine-specific paths from the skill catalog, replaced the career example with a generic billing worked example.

## 0.1.0

- Added `state-prototyping`.
