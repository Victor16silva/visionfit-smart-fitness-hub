import { defineConfig } from 'vite';
import path from 'node:path';
import { cpSync } from 'node:fs';

export default defineConfig(({ mode }) => ({
  root: path.resolve(__dirname, 'ATHEV-CELULAR/ATHEV'),
  envDir: __dirname,
  plugins: [{ name: 'athev-assets', closeBundle() {
    cpSync(path.resolve(__dirname, 'public'), path.resolve(__dirname, 'dist'), { recursive: true });
    cpSync(path.resolve(__dirname, 'ATHEV-CELULAR/ATHEV/assets'), path.resolve(__dirname, 'dist/assets'), { recursive: true });
  } }],
  server: { host: '127.0.0.1', port: 8000, strictPort: true },
  build: { outDir: path.resolve(__dirname, 'dist'), emptyOutDir: true },
}));
