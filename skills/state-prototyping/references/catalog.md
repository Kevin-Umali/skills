# Optional catalog: skills and MCP servers

Suggestions, not requirements. Offer the few that fit, let the user pick or choose none, and load nothing by default. The user may name their own; treat those the same way. Sources are each publisher's website or GitHub, as last checked, and not an endorsement. Confirm a helper is installed or connected before relying on it, and read it before using it.

## Skills

| Skill | Use for | Source |
| --- | --- | --- |
| `tactile-design` | Layered, quiet product UI: hierarchy, forms, menus, light and dark | [kosta4a/tactile-design](https://github.com/kosta4a/tactile-design) |
| `interaction-design` | Microinteractions, feedback states | [wshobson/agents](https://github.com/wshobson/agents) (`plugins/ui-design/skills/interaction-design`) |
| `better-interface` (ranked review), `better-accessibility`, `better-colors`, `better-layout`, `better-typography`, `better-ui` (surfaces, icons, motion), `better-writing` (labels, errors, empty states) | Whole-interface review, then one domain each | [jakubkrehel/skills](https://github.com/jakubkrehel/skills) |
| `emil-design-eng`, `animate`, `animate-expo` (React Native), `animation-vocabulary`, `find-animation-opportunities`, `improve-animations`, `review-animations` | Motion craft, naming, audits | [emilkowalski/skills](https://github.com/emilkowalski/skills) |
| `prototype`, `pick-ui-library` | Only on an explicit request for alternatives behind a picker, or a UI library choice | [emilkowalski/skills](https://github.com/emilkowalski/skills) |
| `transitions-dev`, `transitions-polish`, `transitions-ui-generation` | Ready-made web transitions, tuning, explicit generation-style reveals | [transitions.dev](https://transitions.dev), [Jakubantalik/transitions.dev](https://github.com/Jakubantalik/transitions.dev) |
| `shadcn` | Projects already on shadcn | [ui.shadcn.com](https://ui.shadcn.com), [shadcn-ui/ui](https://github.com/shadcn-ui/ui) |
| `ui-review` | Critique of a screen, flow or prototype | [design.how](https://design.how) |
| `unslop-ui` | Refining generic-looking UI (name may differ from upstream `unslop`) | [heydamir/unslop](https://github.com/heydamir/unslop) |

## MCP servers

Use only when chosen. Their components belong to the prototype: keep each licence with its code and follow the server's setup. Never swap an existing product's own components for them, and a lookup does not authorize a redesign.

| MCP | Use for | Source |
| --- | --- | --- |
| `devlibs` | Search and read open-source UI components, install plans per library (`search_components`, `get_component`, `get_install_plan`, `get_library_setup`, `list_libraries`) | [devlibraries.com](https://devlibraries.com), endpoint `https://mcp.devlibraries.com/mcp` |
| `ruixen-mcp` | Ruixen UI registry (`searchRegistryItems`, `listRegistryItems`, `getRegistryItem`) | [ruixen.com](https://ruixen.com), [ruixenui/mcp.ruixen.com](https://github.com/ruixenui/mcp.ruixen.com), npm `@ruixen/mcp` |

Endpoints and package names come from the publishers' pages and package metadata. Confirm current setup there before connecting.

## Missing helpers

Explain its role and ask before adding it. Adding a skill or connecting an MCP changes the user's configuration, so never do either silently and never invent a source, package or command. Verify the upstream and its instructions first; if you cannot, say so and ask for a trusted source. A missing helper never blocks the work.
