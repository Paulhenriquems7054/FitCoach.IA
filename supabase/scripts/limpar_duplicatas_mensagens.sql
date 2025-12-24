-- ============================================================================
-- Script: Limpar Mensagens Duplicadas
-- Data: 2025-01-27
-- ============================================================================
-- 
-- Remove mensagens duplicadas mantendo apenas a mais antiga de cada grupo
-- ============================================================================

-- Método 1: Usar ROW_NUMBER() para identificar duplicatas
WITH mensagens_duplicadas AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY 
                user_id,
                message_data->>'message',
                created_at
            ORDER BY created_at ASC
        ) as rn
    FROM public.chat_messages
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com')
)
DELETE FROM public.chat_messages
WHERE id IN (
    SELECT id 
    FROM mensagens_duplicadas 
    WHERE rn > 1
);

-- Verificar resultado
SELECT 
    'Limpeza de Duplicatas' as categoria,
    COUNT(*) as total_mensagens_restantes,
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ Limpeza concluída (3 mensagens únicas)'
        ELSE '⚠️ Ainda há duplicatas ou dados faltando'
    END as status
FROM public.chat_messages
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com');

