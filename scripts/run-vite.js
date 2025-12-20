#!/usr/bin/env node

// Script wrapper para executar o Vite quando não está instalado localmente
const { spawn } = require('child_process');
const path = require('path');

// Tentar usar npx para executar o vite
const vitePath = path.join(__dirname, '..', 'node_modules', '.bin', 'vite');
const npxVite = spawn('npx', ['vite', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

npxVite.on('close', (code) => {
  process.exit(code || 0);
});

npxVite.on('error', (err) => {
  console.error('Erro ao executar Vite:', err);
  process.exit(1);
});

