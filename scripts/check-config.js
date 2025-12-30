#!/usr/bin/env node

/**
 * Script de Verificação de Configuração
 * Verifica se todas as variáveis de ambiente necessárias estão configuradas
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REQUIRED_VARS = [
  'VITE_GEMINI_API_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

const OPTIONAL_VARS = [
  'VITE_SENTRY_DSN',
  'VITE_ANALYTICS_ID',
  'VITE_AI_BACKEND_URL',
];

function checkEnvFile() {
  const envPath = join(__dirname, '..', '.env.local');
  const envExamplePath = join(__dirname, '..', 'env.example');
  
  let envVars = {};
  
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  } catch (error) {
    console.error('❌ Arquivo .env.local não encontrado!');
    console.log(`\n📝 Crie o arquivo .env.local baseado em env.example:`);
    console.log(`   cp env.example .env.local\n`);
    return false;
  }

  console.log('\n🔍 Verificando configuração...\n');

  let allOk = true;
  let hasOptional = false;

  // Verificar variáveis obrigatórias
  console.log('📋 Variáveis Obrigatórias:');
  REQUIRED_VARS.forEach(varName => {
    const value = envVars[varName];
    if (value && value !== `sua_${varName.toLowerCase().replace('vite_', '').replace(/_/g, '_')}_aqui`) {
      console.log(`  ✅ ${varName}: Configurada`);
    } else {
      console.log(`  ❌ ${varName}: NÃO CONFIGURADA`);
      allOk = false;
    }
  });

  // Verificar variáveis opcionais
  console.log('\n📋 Variáveis Opcionais:');
  OPTIONAL_VARS.forEach(varName => {
    const value = envVars[varName];
    if (value && !value.includes('seu') && !value.includes('aqui')) {
      console.log(`  ✅ ${varName}: Configurada`);
      hasOptional = true;
    } else {
      console.log(`  ⚠️  ${varName}: Não configurada (opcional)`);
    }
  });

  console.log('\n' + '='.repeat(50));

  if (allOk) {
    console.log('✅ Todas as variáveis obrigatórias estão configuradas!');
    if (hasOptional) {
      console.log('✅ Algumas variáveis opcionais também estão configuradas!');
    }
    console.log('\n🚀 Você está pronto para executar o app!\n');
    return true;
  } else {
    console.log('❌ Algumas variáveis obrigatórias estão faltando!');
    console.log('\n📖 Consulte a documentação:');
    console.log('   - docs/CONFIGURAR_SUPABASE.md');
    console.log('   - docs/CONFIGURAR_PRODUCAO.md');
    console.log('   - env.example\n');
    return false;
  }
}

// Executar verificação
const success = checkEnvFile();
process.exit(success ? 0 : 1);

