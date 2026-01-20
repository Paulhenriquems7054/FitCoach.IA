# 📋 Como Configurar Planos das Academias

## ⚠️ Erro Comum

Se você viu este erro:
```
ERROR: 22P02: invalid input syntax for type uuid: "<id_da_academia>"
```

Isso significa que você tentou executar o SQL de exemplo sem substituir o placeholder `<id_da_academia>` por um UUID real.

---

## 🚀 Passo a Passo

### **PASSO 1: Listar Academias Existentes**

Execute no **Supabase SQL Editor**:

```sql
SELECT 
  id,
  name,
  email,
  plan_type,
  plan_name,
  max_licenses,
  status
FROM public.companies
ORDER BY created_at DESC;
```

**Resultado esperado:**
```
id                                   | name           | email              | plan_type            | ...
-------------------------------------|----------------|--------------------|----------------------|----
a1b2c3d4-e5f6-7890-abcd-ef1234567890| Academia X     | x@academia.com     | academy_starter      | ...
```

### **PASSO 2: Copiar UUID da Academia**

Copie o **id** (UUID) da academia que você quer configurar.

**Exemplo:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### **PASSO 3: Configurar Plano**

Execute o UPDATE substituindo `<UUID_DA_ACADEMIA>` pelo UUID real:

```sql
-- Exemplo: Configurar plano FitCoach50
UPDATE public.companies
SET 
  plano = 'FitCoach50',
  alunos_max = 50,
  limite_texto = 1000,
  limite_imagem = 100,
  limite_voz = 450
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; -- ⚠️ Use o UUID real!
```

---

## 📊 Valores Sugeridos por Plano

### **FitCoach50** (até 50 alunos)
```sql
UPDATE public.companies
SET 
  plano = 'FitCoach50',
  alunos_max = 50,
  limite_texto = 1000,   -- 1000 mensagens/mês por aluno
  limite_imagem = 100,   -- 100 análises/mês por aluno
  limite_voz = 450       -- 450 min/mês por aluno (15 min/dia * 30)
WHERE id = '<UUID_DA_ACADEMIA>';
```

### **FitCoach100** (até 100 alunos)
```sql
UPDATE public.companies
SET 
  plano = 'FitCoach100',
  alunos_max = 100,
  limite_texto = 1000,
  limite_imagem = 100,
  limite_voz = 450
WHERE id = '<UUID_DA_ACADEMIA>';
```

### **FitCoach200** (até 200 alunos)
```sql
UPDATE public.companies
SET 
  plano = 'FitCoach200',
  alunos_max = 200,
  limite_texto = 2000,
  limite_imagem = 200,
  limite_voz = 600
WHERE id = '<UUID_DA_ACADEMIA>';
```

### **FitCoach400** (até 400 alunos)
```sql
UPDATE public.companies
SET 
  plano = 'FitCoach400',
  alunos_max = 400,
  limite_texto = 3000,
  limite_imagem = 300,
  limite_voz = 900
WHERE id = '<UUID_DA_ACADEMIA>';
```

### **FitCoach500** (até 500 alunos)
```sql
UPDATE public.companies
SET 
  plano = 'FitCoach500',
  alunos_max = 500,
  limite_texto = 5000,
  limite_imagem = 500,
  limite_voz = 1200
WHERE id = '<UUID_DA_ACADEMIA>';
```

---

## ⚡ Configuração Automática (Múltiplas Academias)

Se você já tem `plan_type` configurado, pode mapear automaticamente:

```sql
-- Mapear academy_starter_mini → FitCoach50
UPDATE public.companies
SET 
  plano = 'FitCoach50',
  alunos_max = 50,
  limite_texto = 1000,
  limite_imagem = 100,
  limite_voz = 450
WHERE plan_type = 'academy_starter_mini' 
  AND plano IS NULL;

-- Mapear academy_starter → FitCoach100
UPDATE public.companies
SET 
  plano = 'FitCoach100',
  alunos_max = 100,
  limite_texto = 1000,
  limite_imagem = 100,
  limite_voz = 450
WHERE plan_type = 'academy_starter' 
  AND plano IS NULL;

-- Mapear academy_growth → FitCoach200
UPDATE public.companies
SET 
  plano = 'FitCoach200',
  alunos_max = 200,
  limite_texto = 2000,
  limite_imagem = 200,
  limite_voz = 600
WHERE plan_type = 'academy_growth' 
  AND plano IS NULL;

-- Mapear academy_pro → FitCoach400
UPDATE public.companies
SET 
  plano = 'FitCoach400',
  alunos_max = 400,
  limite_texto = 3000,
  limite_imagem = 300,
  limite_voz = 900
WHERE plan_type = 'academy_pro' 
  AND plano IS NULL;
```

---

## ✅ Verificar Configuração

Execute para verificar se está tudo correto:

```sql
SELECT 
  id,
  name,
  email,
  plano,
  alunos_max,
  limite_texto,
  limite_imagem,
  limite_voz,
  status
FROM public.companies
WHERE plano IS NOT NULL
ORDER BY plano, name;
```

---

## 🔗 Usar o Script Completo

Consulte o arquivo **`supabase/CONFIGURAR_PLANOS_ACADEMIAS.sql`** para um script completo com todas as opções.

---

## ❓ Dúvidas

**Q: Não tenho academias na tabela `companies`?**
A: Crie uma academia primeiro ou verifique se você está usando outra tabela.

**Q: Como saber qual plano usar?**
A: Use FitCoach50 como padrão inicial. Ajuste conforme o número de alunos e necessidades.

**Q: Posso mudar os limites depois?**
A: Sim! Basta executar um novo UPDATE com os valores desejados.

---

**Arquivo:** `supabase/CONFIGURAR_PLANOS_ACADEMIAS.sql`
