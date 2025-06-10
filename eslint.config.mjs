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
    // IMPORTANT: This must be the LAST configuration. It turns off any ESLint rules that conflict with Prettier.
    eslintConfigPrettier,
];