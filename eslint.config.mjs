import { defineConfig } from '@trenaryja/config/eslint'

export default [
	...defineConfig(),
	{
		// cad.ts drives openscad/rsvg/magick subprocesses one model and one view at a
		// time — sequential by design, like a provisioning script — so await-in-loop is the idiom.
		files: ['cad.ts'],
		rules: { 'no-await-in-loop': 'off' },
	},
	{
		// Parametric geometry generators: binary-STL mesh parsing, boundary-loop chaining,
		// RDP simplification, shoelace winding, multi-body construction. Algorithmic density
		// is inherent to the domain — splitting these coherent passes would only obscure them.
		files: ['src/**/model.ts'],
		rules: { complexity: 'off', 'max-statements': 'off', 'max-lines-per-function': 'off' },
	},
]
