import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
const copySuppliedArt = {
  name: 'copy-supplied-nation-art',
  closeBundle() {
    const source = path.resolve('assets');
    const destination = path.resolve('dist/assets');
    if (fs.existsSync(source)) fs.cpSync(source, destination, { recursive: true });
  },
};
export default defineConfig({ plugins: [react(), copySuppliedArt], base: './', build: { target: 'es2020', assetsInlineLimit: 4096 }, server: { host: '0.0.0.0' } });
