import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // This tells Vitest where to look by default
    include: ['test/**/*.unit.test.js'],
    
    // This allows you to use 'test', 'expect', etc. without importing them 
    // in every single file if you prefer (optional)
    globals: true, 
    
    // Environment 'node' is fast for math, 'jsdom' is for browser-like tests
    environment: 'node' 
  }
})