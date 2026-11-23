# Perspectives: user, developer, agent

A lens for deciding and reviewing. It adds no panel or data. Fold findings into decisions, the Before/After/Why table, the reasons (user first) and the report. A finding that fits all three equally is too vague. Ask while exploring, when choosing between options, and before reporting; name the perspective behind each notable decision and say what you could not verify.

**User** (the product's user, and the reviewer using the shell)
- Is the next step obvious, and does anything compete with it?
- Does the screen say what is happening and what to do, in plain words?
- What happens to typed input on failure? Can they recover without starting over?
- Does anything jump between states?
- Keyboard, screen reader, small screen, reduced motion?
- Can the reviewer see the real screen at a usable size without zooming?

**Developer** (builds it for real or adapts the starter)
- How much is plain markup and tokens versus framework?
- What is fake, and how small is the swap to the real thing?
- Which values are hand-measured or hard-coded and will break?
- Which states need a product or backend decision?
- Does it fit the existing components and tokens? Is the change small and reversible?
- Is the code readable: small files, plain names, shared logic in one place?

**Agent** (operates the UI, tests it, or implements from the prototype)
- Is every control findable by role and accessible name, not position or color?
- Is each outcome text (status, alert) readable without vision?
- Does pending or disabled say wait, not retry? Does an error give a recovery action?
- Are states reproducible: stable ids in the URL, deterministic fixtures?
- Can the changes be read as data (JSON, Markdown) instead of pixels?
