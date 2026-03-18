// eslint.config.mjs
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import eslintConfigPrettier from 'eslint-config-prettier';

// This is the base configuration for all TypeScript files
const tsBaseConfig = tseslint.config({
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.recommended],
    plugins: {
        '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            project: true, // Automatically find tsconfig.json
            tsconfigRootDir: import.meta.dirname,
        },
    },
});

// This is the specific configuration for React files in the frontend
const reactConfig = {
    files: ['packages/frontend/**/*.{ts,tsx}'],
    plugins: {
        react: pluginReact,
    },
    languageOptions: {
        globals: {
            ...globals.browser,
        },
    },
    rules: {
        ...pluginReact.configs.recommended.rules,
        ...pluginReact.configs['jsx-runtime'].rules, // <-- This is the magic for the new JSX transform
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};

// Custom naming convention rules for ContentBuilder to enforce symmetric naming
const contentBuilderNamingConfig = {
    files: ['packages/frontend/src/app/(studio)/designer/components/ContentBuilder/ui/**/*.tsx'],
    rules: {
        '@typescript-eslint/naming-convention': [
            'warn',
            {
                // Enforce PascalCase for component names
                selector: 'variable',
                format: ['PascalCase'],
                filter: {
                    match: true,
                    regex: '^(const|let)\\s+[A-Z].*React\\.FC', // Only for React components
                },
                trailingUnderscore: 'forbid',
            },
        ],
    },
};

// The final export combines all configs
export default [
    {
        // Global ignores for the entire project
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/generated/**',
            '**/coverage/**'
        ],
    },
    // Apply the base TypeScript config to all relevant files
    ...tsBaseConfig,
    // Apply the React-specific config on top for frontend files
    reactConfig,
    // Apply ContentBuilder-specific naming conventions
    contentBuilderNamingConfig,
    // IMPORTANT: This must be the LAST configuration. It turns off any ESLint rules that conflict with Prettier.
    eslintConfigPrettier,
];