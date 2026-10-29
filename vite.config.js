import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],publicDir:'public',build:{target:'es2020',assetsInlineLimit:2048,sourcemap:false},server:{host:'0.0.0.0',strictPort:true}});
