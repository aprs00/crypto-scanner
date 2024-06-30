module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
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
    env: {
        browser: true,
        amd: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended', // Make sure this is always the last element in the array.
    ],
    plugins: ['simple-import-sort', 'prettier', 'perfectionist'],
    rules: {
        "@typescript-eslint/no-explicit-any": 'off',
        'prettier/prettier': ['error', {}, {usePrettierrc: true}],
        'react/react-in-jsx-scope': 'off',
        'jsx-a11y/accessible-emoji': 'off',
        'react/prop-types': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'jsx-a11y/anchor-is-valid': [
            'error',
            {
                components: ['Link'],
                specialLink: ['hrefLeft', 'hrefRight'],
                aspects: ['invalidHref', 'preferButton'],
            },
        ],
        "react/jsx-sort-props": [
            2,
            {
                "callbacksLast": true,
                "shorthandFirst": false,
                "shorthandLast": true,
                "ignoreCase": true,
                "noSortAlphabetically": false
            }
        ],
        "perfectionist/sort-objects": [
            "error",
            {
                "type": "natural",
                "order": "asc"
            }
        ]

    },
};
