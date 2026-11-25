import { existsSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { MIRROR_FOLDER, MOVE_KINDS, hashFile, isInside, listFiles, toPosix } from './prototype-files.mjs';

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.scss', '.sass', '.less', '.vue', '.svelte', '.astro', '.html']);
const THEMES = ['light', 'dark'];
const COMMENT_LINE = /^\s*(?:\/\/|\/?\*|<!--)/;
const FRAME_BRANCH_WHY = 'frame check: the After is the production version and needs no runtime switch';

const PATCH_PATTERNS = [
  { pattern: /!important/, why: 'override CSS: change the rule itself' },
  { pattern: /data-prototype|prototype-variant/i, why: 'variant selector: the mirror file already is the After' },
  { pattern: /\.state-prototype|['"`](?:\.{1,2}\/)+(?:[^'"`]*\/)?mirror\//, why: 'path into the prototype: write the import as production will' },
  { pattern: /['"`][^'"`\n]*\/fixtures?\/[^'"`\n]*['"`]/, why: 'fixture import: pass a view model and callbacks as props' },
  { pattern: /location\.(?:pathname|href|search)[^\n]*\b(?:before|after)\b/i, why: FRAME_BRANCH_WHY },
  { pattern: /\b(?:isBefore|isAfter|isPrototype|IS_PROTOTYPE|prototypeVariant|PROTOTYPE_VARIANT)\b/, why: FRAME_BRANCH_WHY },
];
const NUMBER_IN_PROSE = /\b\d+(?:\.\d+)?(?:px|rem|em|ms|%)(?![\w-])|#[0-9a-f]{6}\b|#[0-9a-f]{3}\b(?![\w-])/i;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

const checkValues = ({ values, areaIds, stateIds, errors }) => {
  if (!Array.isArray(values)) {
    errors.push('spec.js: `values` must be an array.');
    return;
  }
  values.forEach((value, index) => {
    const name = `spec.js: values[${index}]`;
    if (!areaIds.includes(value.area)) errors.push(`${name} has unknown area "${value.area}". Areas: ${areaIds.join(', ') || 'none'}.`);
    if (!isNonEmptyString(value.selector)) errors.push(`${name} needs a selector string.`);
    const expected = Object.entries(value.expected ?? {});
    if (!expected.length) errors.push(`${name} needs "expected": { cssProperty: renderedValue }.`);
    expected.filter(([, rendered]) => !['string', 'number'].includes(typeof rendered)).forEach(([property]) => errors.push(`${name}.expected["${property}"] must be a rendered value like "14px".`));
    if (value.states !== undefined && !Array.isArray(value.states)) errors.push(`${name}.states must be an array of state ids.`);
    (value.states ?? []).filter((id) => !stateIds.includes(id)).forEach((id) => errors.push(`${name}.states has unknown state "${id}".`));
    if (value.themes !== undefined && (!Array.isArray(value.themes) || value.themes.some((theme) => !THEMES.includes(theme)))) errors.push(`${name}.themes must be an array of ${THEMES.join(' or ')}.`);
  });
};

const checkDifferences = ({ differences, errors }) => {
  if (!Array.isArray(differences)) {
    errors.push('spec.js: `differences` must be an array.');
    return;
  }
  differences.forEach((difference, index) => {
    const name = `spec.js: differences[${index}]`;
    if (!isNonEmptyString(difference.selector)) errors.push(`${name} needs a selector string.`);
    if (!isNonEmptyString(difference.why)) errors.push(`${name} needs a "why" saying why production keeps it.`);
    if (difference.props !== undefined && !Array.isArray(difference.props)) errors.push(`${name}.props must be an array of property names.`);
  });
};

const checkMoves = ({ moves, prototypeDirectory, projectRoot, errors, warnings }) => {
  if (!Array.isArray(moves)) {
    errors.push('spec.js: `moves` must be an array.');
    return [];
  }
  const stale = [];
  moves.forEach((move, index) => {
    const name = `spec.js: moves[${index}]`;
    if (!isNonEmptyString(move.from) || !move.from.startsWith(`${MIRROR_FOLDER}/`)) errors.push(`${name}.from must be a path under ${MIRROR_FOLDER}/.`);
    else if (!existsSync(join(prototypeDirectory, move.from))) errors.push(`${name}.from ${move.from} does not exist.`);
    if (!isNonEmptyString(move.to) || !isInside(projectRoot, join(projectRoot, move.to)) || isInside(prototypeDirectory, join(projectRoot, move.to))) {
      errors.push(`${name}.to must be a path inside the project and outside the prototype.`);
      return;
    }
    if (isNonEmptyString(move.from) && move.from !== `${MIRROR_FOLDER}/${move.to}`) warnings.push(`${name}: ${move.from} is not at its project path ${move.to}. Mirror files keep their project path.`);
    if (!MOVE_KINDS.includes(move.kind)) errors.push(`${name}.kind must be one of: ${MOVE_KINDS.join(', ')}.`);
    if (move.kind === 'container' && !isNonEmptyString(move.hook)) errors.push(`${name} is a container and needs "hook": the hook that builds its view model.`);

    const productionFile = join(projectRoot, move.to);
    const productionExists = existsSync(productionFile);
    if (productionExists && !move.base) errors.push(`${name}: ${move.to} exists in production, so the move needs "base" (mirror-file.mjs prints it).`);
    if (!productionExists && move.base) warnings.push(`${name}: ${move.to} is gone from production. Find where it moved before applying.`);
    if (productionExists && move.base && hashFile(productionFile) !== move.base) {
      stale.push(move.to);
      warnings.push(`${name}: ${move.to} changed since it was mirrored. Merge the change into ${move.from}, then update "base".`);
    }
  });
  moves.map((move) => move.to).filter((to, index, all) => to && all.indexOf(to) !== index).forEach((to) => errors.push(`spec.js: two moves target ${to}.`));
  return stale;
};

const findPatchLines = (file, productionFile) => {
  const productionLines = new Set(productionFile && existsSync(productionFile) ? readFileSync(productionFile, 'utf8').split('\n').map((line) => line.trim()) : []);
  return readFileSync(file, 'utf8').split('\n').flatMap((line, index) => {
    if (productionLines.has(line.trim())) return [];
    const match = PATCH_PATTERNS.find(({ pattern }) => pattern.test(line));
    return match ? [{ line: index + 1, why: match.why }] : [];
  });
};

const checkMirror = ({ prototypeDirectory, projectRoot, moves, errors, warnings }) => {
  const mirrorDirectory = join(prototypeDirectory, MIRROR_FOLDER);
  const mirrorFiles = listFiles(mirrorDirectory).map((file) => toPosix(relative(prototypeDirectory, file)));
  const movedFiles = new Set((Array.isArray(moves) ? moves : []).map((move) => move.from));
  mirrorFiles.filter((file) => !movedFiles.has(file)).forEach((file) => warnings.push(`${file} has no move in spec.js, so it won't reach production.`));
  mirrorFiles.filter((file) => SOURCE_EXTENSIONS.has(extname(file))).forEach((file) => {
    const productionFile = join(projectRoot, file.slice(MIRROR_FOLDER.length + 1));
    findPatchLines(join(prototypeDirectory, file), productionFile).forEach(({ line, why }) => errors.push(`${file}:${line}: ${why}.`));
  });

  listFiles(join(prototypeDirectory, 'before'))
    .filter((file) => SOURCE_EXTENSIONS.has(extname(file)))
    .forEach((file) => {
      readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
        if (COMMENT_LINE.test(line)) return;
        if (/['"`][^'"`]*\bmirror\//.test(line)) errors.push(`${toPosix(relative(prototypeDirectory, file))}:${index + 1}: Before imports mirror/; it must import production only.`);
      });
    });
  return mirrorFiles.length;
};

const checkNotesForNumbers = ({ notes, reasons, warnings }) => {
  const lines = [...(notes.shared ?? []), ...Object.values(notes.areas ?? {}).flat(), ...Object.values(notes.states ?? {}).flat(), ...reasons.map((reason) => reason.why ?? '')];
  const withNumbers = lines.filter((line) => typeof line === 'string' && NUMBER_IN_PROSE.test(line));
  if (withNumbers.length) warnings.push(`notes.js has numbers in ${withNumbers.length} line(s), for example "${withNumbers[0]}". Move them to spec.js values.`);
};

export const checkSpec = ({ spec, notes, reasons, areaIds, stateIds, prototypeDirectory, projectRoot, errors, warnings }) => {
  checkNotesForNumbers({ notes, reasons, warnings });
  if (!spec) {
    warnings.push('spec.js not found. Rerun init-prototype.mjs to add it.');
    return { values: 0, differences: 0, moves: 0, mirrorFiles: 0, staleMirrors: [] };
  }
  if (!existsSync(projectRoot)) errors.push(`spec.js: projectRoot resolves to ${projectRoot}, which does not exist.`);
  const { values = [], differences = [], moves = [] } = spec;
  checkValues({ values, areaIds, stateIds, errors });
  checkDifferences({ differences, errors });
  const staleMirrors = checkMoves({ moves, prototypeDirectory, projectRoot, errors, warnings });
  const mirrorFiles = checkMirror({ prototypeDirectory, projectRoot, moves, errors, warnings });
  return { values: values.length, differences: differences.length, moves: moves.length, mirrorFiles, staleMirrors };
};
