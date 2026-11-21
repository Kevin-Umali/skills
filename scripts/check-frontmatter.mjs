// Checks that every skills/<name>/SKILL.md has frontmatter with a matching name and a description.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../skills/", import.meta.url).pathname;
let failed = false;

for (const dir of readdirSync(root, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const file = join(root, dir.name, "SKILL.md");
  const fail = (msg) => {
    console.error(`${dir.name}: ${msg}`);
    failed = true;
  };
  if (!existsSync(file)) {
    fail("missing SKILL.md");
    continue;
  }
  const match = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    fail("missing frontmatter");
    continue;
  }
  const field = (key) => match[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1].trim();
  if (field("name") !== dir.name) fail(`name must equal folder name (got "${field("name")}")`);
  if (!field("description")) fail("missing description");
}

if (failed) process.exit(1);
console.log("All skills have valid frontmatter.");
