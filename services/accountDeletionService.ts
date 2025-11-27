/**
 * Serviço para deletar conta do usuário
 * Remove permanentemente todos os dados do usuário
 */

import { getSupabaseClient } from './supabaseService';
import { getUser, deleteUser as deleteUserFromDB } from './databaseService';
import { logger } from '../utils/logger';

/**
 * Deleta permanentemente a conta do usuário
 * Remove dados do Supabase e IndexedDB
 */
export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const supabase = getSupabaseClient();
        const userId = user.id;

        // 1. Deletar histórico de chat
        const { error: chatError } = await supabase
            .from('chat_messages')
            .delete()
            .eq('user_id', userId);

        if (chatError) {
            logger.warn('Erro ao deletar histórico de chat', 'accountDeletionService', chatError);
            // Continuar mesmo se falhar
        }

        // 2. Deletar outros dados relacionados
        const tablesToClean = [
            'weight_history',
            'wellness_plans',
            'completed_workouts',
            'meal_plans',
            'meal_analyses',
            'recipes',
        ];

        for (const table of tablesToClean) {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('user_id', userId);
            
            if (error) {
                logger.warn(`Erro ao deletar dados de ${table}`, 'accountDeletionService', error);
            }
        }

        // 3. Deletar assinaturas e pagamentos
        const { error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .delete()
            .eq('user_id', userId);

        if (subscriptionError) {
            logger.warn('Erro ao deletar assinaturas', 'accountDeletionService', subscriptionError);
        }

        const { error: paymentError } = await supabase
            .from('payments')
            .delete()
            .eq('user_id', userId);

        if (paymentError) {
            logger.warn('Erro ao deletar pagamentos', 'accountDeletionService', paymentError);
        }

        // 4. Deletar usuário da tabela users
        const { error: userError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (userError) {
            logger.error('Erro ao deletar usuário do Supabase', 'accountDeletionService', userError);
            return { success: false, error: 'Erro ao deletar conta no servidor' };
        }

        // 5. Deletar do IndexedDB local
        try {
            await deleteUserFromDB();
        } catch (dbError) {
            logger.warn('Erro ao deletar do IndexedDB', 'accountDeletionService', dbError);
            // Continuar mesmo se falhar
        }

        // 6. Limpar localStorage
        try {
            localStorage.clear();
        } catch (storageError) {
            logger.warn('Erro ao limpar localStorage', 'accountDeletionService', storageError);
        }

        // 7. Deletar do Supabase Auth (se possível)
        try {
            const { error: authError } = await supabase.auth.admin.deleteUser(userId);
            if (authError) {
                logger.warn('Erro ao deletar do Auth', 'accountDeletionService', authError);
                // Continuar mesmo se falhar (pode não ter permissão)
            }
        } catch (authError) {
            logger.warn('Erro ao deletar do Auth', 'accountDeletionService', authError);
        }

        logger.info('Conta deletada com sucesso', 'accountDeletionService');
        return { success: true };
    } catch (error) {
        logger.error('Erro ao deletar conta', 'accountDeletionService', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido ao deletar conta' 
        };
    }
}

/**
 * Anonimiza os dados do usuário sem deletar a conta
 * Remove informações pessoais identificáveis mas mantém a conta ativa
 */
export async function anonymizeUserData(user: any): Promise<{ success: boolean; error?: string }> {
    try {
        if (!user || !user.id) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const supabase = getSupabaseClient();
        const userId = user.id;

        // Anonimizar dados pessoais na tabela users
        const { error: updateError } = await supabase
            .from('users')
            .update({
                nome: 'Usuário Anônimo',
                email: `anon_${userId.substring(0, 8)}@anon.fitcoach.ia`,
                is_anonymized: true,
            })
            .eq('id', userId);

        if (updateError) {
            logger.error('Erro ao anonimizar dados do usuário', 'accountDeletionService', updateError);
            return { success: false, error: 'Erro ao anonimizar dados no servidor' };
        }

        // Deletar histórico de chat (dados sensíveis)
        const { error: chatError } = await supabase
            .from('chat_messages')
            .delete()
            .eq('user_id', userId);

        if (chatError) {
            logger.warn('Erro ao deletar histórico de chat durante anonimização', 'accountDeletionService', chatError);
        }

        logger.info('Dados anonimizados com sucesso', 'accountDeletionService');
        return { success: true };
    } catch (error) {
        logger.error('Erro ao anonimizar dados', 'accountDeletionService', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido ao anonimizar dados' 
        };
    }
}
