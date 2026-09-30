import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    wasm(), 
    react(),
    nodePolyfills({
      include: ['events', 'buffer', 'assert', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  build: { target: "esnext" },
  test: { environment: "jsdom", globals: true },
});
