// Optional Vite plugin: lets mirror files keep the imports they will have in production.
// An import from a file under mirror/ resolves as if the importer sat at its project path, then prefers the mirror copy
// of the result when one exists. Production files never see the mirror, and a Before frame importing it is an error.
// stubs swap a production module (a data hook a Before view calls) for a fixture module, for every importer outside mirror/.
import { existsSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

const PLUGIN_NAME = 'state-prototype-mirror';
const QUERY_PATTERN = /[?#].*$/;

const isInside = (directory, file) => {
  const fromDirectory = relative(directory, file);
  return fromDirectory !== '' && !fromDirectory.startsWith('..') && !isAbsolute(fromDirectory);
};

const isFile = (file) => existsSync(file) && statSync(file).isFile();

/**
 * @param {object} options
 * @param {string} options.prototype the prototype folder (holds mirror/ and before/), relative to root or absolute
 * @param {string} [options.root] the project root; defaults to the working directory Vite runs in
 * @param {Record<string, string>} [options.stubs] { 'src/billing/useBilling.ts': 'fixtures/use-billing.ts' }:
 *   project path to fixture path, relative to the prototype
 */
export const mirrorPlugin = ({ prototype, root = process.cwd(), stubs = {} }) => {
  const projectRoot = resolve(root);
  const prototypeDirectory = resolve(projectRoot, prototype);
  const mirrorDirectory = join(prototypeDirectory, 'mirror');
  const beforeDirectory = join(prototypeDirectory, 'before');

  const toProjectPath = (mirrorFile) => join(projectRoot, relative(mirrorDirectory, mirrorFile));
  const toMirrorPath = (projectFile) => join(mirrorDirectory, relative(projectRoot, projectFile));
  const isProjectSource = (file) => isInside(projectRoot, file) && !isInside(prototypeDirectory, file) && !file.split(sep).includes('node_modules');
  const stubByFile = new Map(Object.entries(stubs).map(([projectPath, fixturePath]) => [resolve(projectRoot, projectPath), resolve(prototypeDirectory, fixturePath)]));
  const fixtureFiles = new Set(stubByFile.values());

  const applyStub = (resolved) => {
    const stub = resolved && stubByFile.get(resolved.id.replace(QUERY_PATTERN, ''));
    return stub ? { id: stub } : resolved;
  };

  return {
    name: PLUGIN_NAME,
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer) return null;
      const importerPath = importer.replace(QUERY_PATTERN, '');

      if (isInside(beforeDirectory, importerPath)) {
        const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
        if (resolved && isInside(mirrorDirectory, resolved.id.replace(QUERY_PATTERN, ''))) {
          this.error(`${PLUGIN_NAME}: ${relative(projectRoot, importerPath)} imports ${source} from mirror/. Before renders production only.`);
        }
        return applyStub(resolved);
      }

      if (!isInside(mirrorDirectory, importerPath)) {
        if (!stubByFile.size || fixtureFiles.has(importerPath)) return null;
        return applyStub(await this.resolve(source, importer, { ...options, skipSelf: true }));
      }
      const resolved = await this.resolve(source, toProjectPath(importerPath), { ...options, skipSelf: true });
      const resolveMirrorOnlyFile = () => this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved) return resolveMirrorOnlyFile();
      if (resolved.external) return resolved;
      const [resolvedPath, query = ''] = [resolved.id.replace(QUERY_PATTERN, ''), resolved.id.match(QUERY_PATTERN)?.[0]];
      if (!isProjectSource(resolvedPath)) return resolved;
      const mirrorCopy = toMirrorPath(resolvedPath);
      return isFile(mirrorCopy) ? { ...resolved, id: `${mirrorCopy}${query}` } : resolved;
    },
  };
};

export default mirrorPlugin;
