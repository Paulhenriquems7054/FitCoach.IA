/**
 * Cliente Supabase para uso em hooks e componentes
 * Re-exporta o cliente do supabaseService
 */

import { getSupabaseClient } from './supabaseService';

export const supabase = getSupabaseClient();
