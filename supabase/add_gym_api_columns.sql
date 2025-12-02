-- Script para adicionar colunas de controle de API do Gemini na tabela gyms
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas para controle de API por academia
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT,
ADD COLUMN IF NOT EXISTS gemini_api_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gemini_api_last_used TIMESTAMP,
ADD COLUMN IF NOT EXISTS gemini_api_usage_count INTEGER DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN gyms.gemini_api_key IS 'Chave de API do Gemini específica desta academia (opcional). Se NULL, usa a chave global configurada no sistema.';
COMMENT ON COLUMN gyms.gemini_api_enabled IS 'Se a academia está autorizada a usar a API do Gemini. Se false, a API será bloqueada para esta academia.';
COMMENT ON COLUMN gyms.gemini_api_last_used IS 'Última vez que a API foi usada por esta academia (para estatísticas).';
COMMENT ON COLUMN gyms.gemini_api_usage_count IS 'Contador de uso da API (pode ser resetado mensalmente pelo desenvolvedor).';

-- Criar índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_gyms_gemini_api_enabled ON gyms(gemini_api_enabled) WHERE gemini_api_enabled = true;

-- Verificar se as colunas foram criadas
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'gyms' 
    AND column_name IN ('gemini_api_key', 'gemini_api_enabled', 'gemini_api_last_used', 'gemini_api_usage_count')
ORDER BY column_name;

