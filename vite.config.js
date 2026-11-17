import {fileURLToPath} from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import dashboardEditor from './scripts/dashboard-editor.js';

const src = (path) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

// Set VITE_BASE when the site is served from a sub-path: ./deploy.sh does.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  // dashboardEditor: the dev server's save endpoints for the dashboard's editor.
  plugins: [react(), tailwindcss(), dashboardEditor()],
  resolve: {
    alias: [
      // `import … from '@/components/ui/button'` (components.json).
      {find: /^@\//, replacement: src('')},
      // The components import `cn` from the cn package; this gives them the
      // copy that knows the IGL theme's names (src/lib/cn.js). Exactly `cn`,
      // so that file's own `cn/config` import still reaches the package.
      {find: /^cn$/, replacement: src('lib/cn.js')},
    ],
  },
});
