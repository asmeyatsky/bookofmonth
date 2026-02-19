import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { transformSync } from 'esbuild';

// Transform JSX in .js files from node_modules that ship untranspiled JSX
// (e.g. react-native-image-zoom-viewer, react-native-vector-icons)
function jsxInNodeModules() {
  return {
    name: 'jsx-in-node-modules',
    enforce: 'pre',
    transform(code, id) {
      if (
        id.includes('node_modules') &&
        id.endsWith('.js') &&
        (code.includes('<') && /<[A-Za-z_]/.test(code))
      ) {
        try {
          const result = transformSync(code, {
            loader: 'jsx',
            jsx: 'transform',
            target: 'es2020',
          });
          return { code: result.code, map: result.map || null };
        } catch {
          // Not actually JSX, let it pass through
        }
      }
    },
  };
}

const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  define: {
    global: 'globalThis',
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  plugins: [
    jsxInNodeModules(),
    react({
      babel: {
        plugins: ['react-native-web'],
      },
    }),
  ],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },
  optimizeDeps: {
    include: [
      'react-native-web',
      '@react-navigation/native',
      '@react-navigation/stack',
      '@react-navigation/bottom-tabs',
      'react-native-screens',
      'react-native-safe-area-context',
      'react-native-gesture-handler',
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      resolveExtensions: ['.web.js', '.js', '.ts', '.tsx'],
    },
  },
  build: {
    outDir: basePath !== '/' ? `dist/${basePath.replace(/^\/|\/$/g, '')}` : 'dist',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 3003,
  },
});
