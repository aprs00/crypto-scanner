import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import perfectionist from 'eslint-plugin-perfectionist';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';

export default [
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        ignores: ['node_modules/**', 'dist/**', 'build/**'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            parser: typescriptParser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                browser: true,
                amd: true,
                node: true,
                console: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                window: 'readonly',
                WebSocket: 'readonly',
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
            'import/resolver': {
                node: {
                    paths: ['src'],
                    extensions: ['.js', '.jsx', '.ts', '.tsx', '.cjs'],
                },
            },
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
            react,
            'jsx-a11y': jsxA11y,
            prettier,
            perfectionist,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...typescriptEslint.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            ...prettier.configs.recommended.rules,

            'no-undef': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'prettier/prettier': ['error', {}, {usePrettierrc: true}],
            'react/react-in-jsx-scope': 'off',
            'jsx-a11y/accessible-emoji': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            'perfectionist/sort-imports': 'error',
            'perfectionist/sort-exports': 'error',
            'perfectionist/sort-jsx-props': 'error',
            'jsx-a11y/anchor-is-valid': [
                'error',
                {
                    components: ['Link'],
                    specialLink: ['hrefLeft', 'hrefRight'],
                    aspects: ['invalidHref', 'preferButton'],
                },
            ],
        },
    },
];
