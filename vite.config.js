import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'./',build:{target:'es2020',assetsInlineLimit:4096},server:{host:'0.0.0.0'}});
