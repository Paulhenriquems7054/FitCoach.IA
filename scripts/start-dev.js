#!/usr/bin/env node

// Script para iniciar o servidor Vite usando npx com a versão correta
const { spawn } = require('child_process');
const path = require('path');

// Usar npx com a versão específica do Vite
const args = ['vite@5.4.21', '--host', '0.0.0.0', '--port', '3000', ...process.argv.slice(2)];

const viteProcess = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    // Forçar o uso do node_modules local
    NODE_PATH: path.join(__dirname, '..', 'node_modules')
  }
});

viteProcess.on('close', (code) => {
  process.exit(code || 0);
});

viteProcess.on('error', (err) => {
  console.error('Erro ao executar Vite:', err);
  process.exit(1);
});

