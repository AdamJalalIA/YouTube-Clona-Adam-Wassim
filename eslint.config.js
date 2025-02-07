import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint'; // TypeScript

export default tseslint.config(
  { ignores: ['dist'] },
  {
    // étendre les configurations recommandées pour JavaScript et TypeScript
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    
    // appliquer ces règles uniquement aux fichiers TypeScript et TSX
    files: ['**/*.{ts,tsx}'],
    
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn', // avertir si un composant exporte autre chose que lui-même
        { allowConstantExport: true },
      ],
    },
  }
);
