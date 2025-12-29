-- Função para buscar user_id pelo email (busca em auth.users)
-- Esta função é usada pelo webhook da Cakto para encontrar o usuário

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS TABLE(id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id
  FROM auth.users au
  WHERE au.email = user_email
  LIMIT 1;
END;
$$;

-- Dar permissão para a função ser executada
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO service_role;

-- Comentário
COMMENT ON FUNCTION public.get_user_id_by_email IS 'Busca o ID do usuário pelo email em auth.users. Usado pelo webhook da Cakto.';

