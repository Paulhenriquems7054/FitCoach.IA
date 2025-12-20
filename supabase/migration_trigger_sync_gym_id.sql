-- ============================================================================
-- Migration: Trigger para atualizar gym_id automaticamente
-- Data: 2025-01-27
-- Prioridade: MÉDIA
-- ============================================================================
-- 
-- PROBLEMA: gym_id precisa ser sincronizado manualmente quando user_id muda
--
-- SOLUÇÃO: Criar trigger que atualiza gym_id automaticamente baseado no user_id
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_gym_id_from_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é INSERT ou user_id mudou ou gym_id não está definido, buscar do user
    IF TG_OP = 'INSERT' OR 
       (TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id)) OR 
       NEW.gym_id IS NULL THEN
        SELECT gym_id INTO NEW.gym_id
        FROM public.users
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas de dados
DROP TRIGGER IF EXISTS sync_weight_history_gym_id ON public.weight_history;
CREATE TRIGGER sync_weight_history_gym_id
    BEFORE INSERT OR UPDATE ON public.weight_history
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

DROP TRIGGER IF EXISTS sync_wellness_plans_gym_id ON public.wellness_plans;
CREATE TRIGGER sync_wellness_plans_gym_id
    BEFORE INSERT OR UPDATE ON public.wellness_plans
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

DROP TRIGGER IF EXISTS sync_completed_workouts_gym_id ON public.completed_workouts;
CREATE TRIGGER sync_completed_workouts_gym_id
    BEFORE INSERT OR UPDATE ON public.completed_workouts
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

DROP TRIGGER IF EXISTS sync_meal_plans_gym_id ON public.meal_plans;
CREATE TRIGGER sync_meal_plans_gym_id
    BEFORE INSERT OR UPDATE ON public.meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

DROP TRIGGER IF EXISTS sync_meal_analyses_gym_id ON public.meal_analyses;
CREATE TRIGGER sync_meal_analyses_gym_id
    BEFORE INSERT OR UPDATE ON public.meal_analyses
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

DROP TRIGGER IF EXISTS sync_recipes_gym_id ON public.recipes;
CREATE TRIGGER sync_recipes_gym_id
    BEFORE INSERT OR UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

DROP TRIGGER IF EXISTS sync_chat_messages_gym_id ON public.chat_messages;
CREATE TRIGGER sync_chat_messages_gym_id
    BEFORE INSERT OR UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

COMMENT ON FUNCTION sync_gym_id_from_user() IS 
'Sincroniza gym_id automaticamente baseado no user_id da tabela users. 
Garante que gym_id sempre esteja atualizado quando um registro é criado ou atualizado.';

