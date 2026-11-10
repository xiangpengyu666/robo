import {defineConfig} from 'vite';

// Phase one serves official content as static files, with no API middleware.
export default defineConfig({build:{rollupOptions:{input:{home:'index.html',explore:'robo-1.html',hub:'hub.html'}}}});
