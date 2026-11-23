import { buildIconSvg } from '../../core/icons.js';

// The icon artwork comes from core/icons.js, so both starters draw the same icons.
export const Icon = ({ name }: { name: string }) => <span data-icon={name} dangerouslySetInnerHTML={{ __html: buildIconSvg(name) }} />;
