import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: globals.node,
        },
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
            globals: globals.node,
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            playwright,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...playwright.configs['flat/recommended'].rules,
            'playwright/no-wait-for-timeout': 'error',
            'playwright/no-conditional-in-test': 'warn',
            'playwright/no-networkidle': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            'no-restricted-syntax': [
                'error',
                {
                    selector: "CallExpression[callee.property.name='locator'] Literal[value=/^(xpath=|\\/\\/)/]",
                    message:
                        'XPath selectors are not allowed. Use getByRole/getByLabel/getByPlaceholder/getByText/getByTestId.',
                },
            ],
        },
    },
    {
        files: ['tests/app/**/*.spec.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@playwright/test',
                            message:
                                "Import 'test'/'expect' from 'fixtures/pom/test-options' instead of '@playwright/test' directly.",
                        },
                    ],
                },
            ],
        },
    },
    {
        ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', '.auth/**', 'dist/**'],
    },
    prettier,
];
