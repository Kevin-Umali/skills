import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CHANGELOG_PATH = fileURLToPath(new URL('../CHANGELOG.md', import.meta.url))
const HEADING_PREFIX = '## '

const extractSection = (changelog, version) => {
  const lines = changelog.split('\n')
  const startIndex = lines.findIndex((line) => line.trim() === `${HEADING_PREFIX}${version}`)
  if (startIndex === -1) return null
  const rest = lines.slice(startIndex + 1)
  const nextHeading = rest.findIndex((line) => line.startsWith(HEADING_PREFIX))
  const body = nextHeading === -1 ? rest : rest.slice(0, nextHeading)
  return body.join('\n').trim()
}

const main = () => {
  const version = process.argv[2]
  if (!version) {
    console.error('Usage: node scripts/release-notes.mjs <version>')
    process.exit(1)
  }
  const body = extractSection(readFileSync(CHANGELOG_PATH, 'utf8'), version)
  if (!body) {
    console.error(`No "## ${version}" section with content found in CHANGELOG.md`)
    process.exit(1)
  }
  console.log(body)
}

main()
