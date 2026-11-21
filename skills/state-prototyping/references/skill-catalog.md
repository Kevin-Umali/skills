# Optional skill catalog

Suggestions, not requirements. These are skills that can help a prototype review. Offer the few that fit the task and let the user pick, or use none. Do not load any by default, and do not load everything. Read the relevant `SKILL.md` before applying a skill, and do not claim to have applied one that is unavailable or unread.

Sources are the publishers' repositories as last known. They are not proof of current contents or an endorsement. Check that a skill is actually installed in the current environment before relying on it.

| Skill | When useful |
| --- | --- |
| `better-interface` | Broad ranked interface review. |
| `better-accessibility` | Keyboard, focus, names and accessible interactions. |
| `better-colors` | Color system and contrast. |
| `better-layout` | Grouping, responsive layout and reading order. |
| `better-typography` | Type scale, rendering and wrapping. |
| `better-ui` | Surface, icon and motion polish. |
| `better-writing` | Labels, errors, empty states and UI voice. |

Source: [jakubkrehel/skills](https://github.com/jakubkrehel/skills), each under `skills/<name>/SKILL.md`.

| Skill | When useful |
| --- | --- |
| `emil-design-eng` | Component craft and motion decisions. |
| `animate` | Designing and implementing animation. |
| `animate-expo` | React Native or Expo animation. |
| `animation-vocabulary` | Naming a described animation. |
| `find-animation-opportunities` | Read-only search for suitable motion. |
| `improve-animations` | Read-only motion audit and implementation plans. |
| `review-animations` | Reviewing existing animation craft. |
| `prototype` | Explicit request for multiple alternatives behind a picker. |
| `pick-ui-library` | Explicit request to choose a UI library. |

Source: [emilkowalski/skill](https://github.com/emilkowalski/skill), each under `skills/<name>/SKILL.md`.

| Skill | When useful | Source |
| --- | --- | --- |
| `transitions-dev` | Implementing relevant web transitions. | [transitions.dev](https://github.com/Jakubantalik/transitions.dev), `skills/transitions-dev/SKILL.md` |
| `transitions-polish` | Tuning existing transitions. | Same repository, `skills/transitions-polish/SKILL.md` |
| `transitions-ui-generation` | Explicit generation-style UI reveal. | Same repository, `skills/transitions-ui-generation/SKILL.md` |
| `shadcn` | Existing shadcn components and design system. | [shadcn-ui/ui](https://github.com/shadcn-ui/ui), `skills/shadcn/SKILL.md` |
| `ui-review` | Critique of a screen, flow or prototype. | [design.how distribution](https://design.how/.well-known/agent-skills/ui-review.tar.gz) |
| `unslop-ui` | Requested visual refinement of generic-looking UI. | Attributed to [heydamir/unslop](https://github.com/heydamir/unslop/tree/main/skills/unslop). The name may differ from upstream `unslop`; current upstream not reverified. |

## Missing skills

When a relevant skill is missing and needed, explain its role and ask the user whether to install it. Never silently install one, and never invent a source or command.

Before proposing an installation, verify the current primary upstream and its installation instructions. Use the installer your environment provides for a verified GitHub repository and skill directory, or follow the publisher's own distribution method. If you cannot verify the source or method, say so and ask the user for a trusted source. Installation needs the user's authorization. A missing optional skill never blocks independent prototype work.
