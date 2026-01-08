import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
			'semi': ['error', 'never'],
		},
	},
	{
		ignores: ['node_modules/', 'out/', '*.js'],
	}
];