# Plano de Bem-Estar - Documentação Técnica

## Visão Geral

O módulo **Plano de Bem-Estar** é um sistema inteligente que gera planos personalizados de treino e suplementação usando IA. O sistema funciona de forma híbrida: online quando possível (usando Gemini API) e offline com templates pré-definidos.

## Estrutura de Arquivos

```
components/wellness/
  ├── WorkoutDayCard.tsx      # Componente para exibir um dia de treino
  ├── SupplementCard.tsx       # Componente para exibir suplemento
  └── WellnessTipsCard.tsx     # Componente para dicas inteligentes

services/
  ├── geminiService.ts         # Geração de plano com IA (online)
  └── wellnessOfflineService.ts # Templates offline

pages/
  └── WellnessPlanPage.tsx     # Página principal

types.ts                       # Definições de tipos TypeScript
```

## Tipos e Interfaces

### Exercise
```typescript
interface Exercise {
    name: string;           // Nome do exercício
    reps?: string;          // Repetições (ex: "3x12", "4x10-15")
    sets?: string;          // Séries
    tips?: string;          // Dica de execução
    calories?: number;      // Calorias estimadas
    rest?: string;          // Tempo de descanso (ex: "60s")
}
```

### WorkoutDay
```typescript
interface WorkoutDay {
    dia_semana: string;                    // "Segunda-feira", etc.
    foco_treino: string;                   // "Corpo Inteiro", "Pernas", etc.
    exercicios: string[] | Exercise[];     // Suporta ambos os formatos
    duracao_estimada?: string;             // "45-60 minutos"
    intensidade?: 'baixa' | 'moderada' | 'alta';
    observacoes?: string;
}
```

### Supplement
```typescript
interface Supplement {
    nome: string;
    dosagem_sugerida: string;    // "25g", "5g"
    melhor_horario: string;      // "Pós-treino", "Manhã"
    justificativa: string;
    beneficios?: string[];        // Lista de benefícios
    contraindicacoes?: string;   // Avisos
}
```

### WellnessTips
```typescript
interface WellnessTips {
    hidratacao?: string;      // Dica sobre hidratação
    horario_treino?: string;  // Melhor horário para treinar
    descanso?: string;        // Dicas de descanso
    sono?: string;            // Dicas de sono
    nutricao?: string;        // Dica nutricional
}
```

## Como Funciona

### 1. Geração de Plano Online (IA)

Quando o app está online e tem API key configurada:

```typescript
const plan = await generateWellnessPlan(user);
```

A função `generateWellnessPlan` em `services/geminiService.ts`:
- Calcula IMC do usuário
- Determina nível de condicionamento baseado em `disciplineScore`
- Analisa tendência de peso do histórico
- Cria prompt personalizado com todos os dados
- Chama Gemini API com schema estruturado
- Retorna plano completo

**Onde editar o prompt:**
- Arquivo: `services/geminiService.ts`
- Função: `generateWellnessPlan`
- Linha: ~609-666

### 2. Geração de Plano Offline

Quando offline ou sem API key:

```typescript
const plan = generateWellnessPlanOffline(user);
```

A função em `services/wellnessOfflineService.ts`:
- Seleciona template baseado no objetivo (perder peso, ganhar massa, manter)
- Ajusta intensidade baseado em IMC e nível
- Retorna plano pré-definido mas personalizado

**Onde atualizar templates:**
- Arquivo: `services/wellnessOfflineService.ts`
- Funções: `getWeightLossPlan`, `getMuscleGainPlan`, `getMaintenancePlan`

## Personalização

### Adicionar Novos Exercícios

1. **Modo Online**: A IA gera automaticamente baseado no prompt
2. **Modo Offline**: Edite `services/wellnessOfflineService.ts`:

```typescript
exercicios: [
    { 
        name: 'Novo Exercício', 
        reps: '3x12', 
        rest: '60s', 
        calories: 50,
        tips: 'Dica de execução'
    },
    // ...
]
```

### Adicionar Novos Suplementos

1. **Modo Online**: A IA sugere baseado no objetivo
2. **Modo Offline**: Edite as funções de plano em `wellnessOfflineService.ts`:

```typescript
recomendacoes_suplementos: [
    {
        nome: 'Novo Suplemento',
        dosagem_sugerida: 'Xg',
        melhor_horario: 'Horário',
        justificativa: 'Por que é recomendado',
        beneficios: ['Benefício 1', 'Benefício 2'],
        contraindicacoes: 'Avisos se houver'
    },
    // ...
]
```

### Modificar Prompts da IA

Edite `services/geminiService.ts`, função `generateWellnessPlan`:

```typescript
const prompt = `
    Você é um personal trainer...
    
    // Adicione instruções específicas aqui
    - Instrução 1
    - Instrução 2
    
    // ...
`;
```

## Funcionalidades

### Progresso de Treinos

O sistema rastreia quais treinos foram concluídos:
- Armazenado em `localStorage` com chave `nutria.wellness.completed`
- Exibido como barra de progresso na interface
- Resetado ao gerar novo plano

### Persistência

- Plano gerado: `localStorage` → `nutria.wellness.plan`
- Treinos concluídos: `localStorage` → `nutria.wellness.completed`

### Fallback Automático

Se a API falhar ou estiver offline:
1. Tenta usar API online
2. Se falhar → usa `generateWellnessPlanOffline`
3. Sempre retorna um plano válido

## Expansão

### Adicionar Novos Objetivos

1. Adicione novo `Goal` em `types.ts`
2. Crie função em `wellnessOfflineService.ts`:
   ```typescript
   function getNewGoalPlan(user: User, nivel: string, imc: number): WellnessPlan {
       // Implementação
   }
   ```
3. Atualize `generateWellnessPlanOffline` para incluir novo caso

### Melhorar Análise de Dados

Edite `generateWellnessPlan` em `geminiService.ts` para incluir:
- Análise de histórico de treinos
- Preferências do usuário
- Restrições físicas
- Disponibilidade semanal

### Adicionar Edição Manual

Crie componente de edição:
```typescript
// components/wellness/EditWorkoutDay.tsx
export const EditWorkoutDay: React.FC<{...}> = ({...}) => {
    // Interface para editar exercícios manualmente
};
```

## Troubleshooting

### Plano não está sendo gerado
1. Verifique se API key está configurada em Settings
2. Verifique console para erros
3. Teste modo offline (desconecte internet)

### Exercícios não aparecem com detalhes
- Verifique se a IA retornou formato `Exercise[]` ou `string[]`
- O componente `WorkoutDayCard` suporta ambos

### Progresso não está sendo salvo
- Verifique `localStorage` no DevTools
- Certifique-se de que não há bloqueio de cookies/localStorage

## Exemplos de Uso

### Gerar novo plano
```typescript
const plan = await generateWellnessPlan(user);
```

### Marcar treino como concluído
```typescript
handleCompleteWorkout(dayIndex);
```

### Carregar plano salvo
```typescript
const saved = localStorage.getItem('nutria.wellness.plan');
const plan = JSON.parse(saved) as WellnessPlan;
```

## Próximos Passos Sugeridos

1. ✅ Componentes de exibição criados
2. ✅ Geração com IA implementada
3. ✅ Fallback offline funcionando
4. ✅ Progresso de treinos
5. ⏳ Edição manual de treinos
6. ⏳ Histórico de planos anteriores
7. ⏳ Compartilhamento de planos
8. ⏳ Integração com calendário

## Notas Importantes

- O sistema é **híbrido**: funciona online e offline
- Templates offline são **personalizados** baseados em IMC, nível e objetivo
- A IA online é **mais flexível** e adapta-se melhor ao perfil
- Progresso é **persistido localmente** (não sincroniza entre dispositivos)
- Planos podem ser **regenerados** a qualquer momento

