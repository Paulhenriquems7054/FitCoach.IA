# Banco de Dados Local - Nutri.IA

## 📋 Visão Geral

O Nutri.IA utiliza **IndexedDB** como banco de dados local para armazenar todos os dados do aplicativo. Isso substitui o uso de `localStorage` por um sistema mais robusto, estruturado e escalável.

## 🗄️ Estrutura do Banco de Dados

### Nome do Banco
- **Nome**: `NutriIA_DB`
- **Versão**: `1`

### Object Stores (Tabelas)

#### 1. **users**
Armazena dados do usuário principal.

**Estrutura**:
```typescript
{
  id?: number;
  nome: string;
  idade: number;
  genero: 'Masculino' | 'Feminino';
  peso: number;
  altura: number;
  objetivo: Goal;
  points: number;
  disciplineScore: number;
  completedChallengeIds: string[];
  isAnonymized: boolean;
  weightHistory: { date: string; weight: number }[];
  role: 'user' | 'professional';
  subscription: 'free' | 'premium';
  updatedAt?: string;
}
```

**Índices**:
- `nome` (não único)

#### 2. **wellnessPlans**
Armazena planos de bem-estar gerados pela IA.

**Estrutura**:
```typescript
{
  id?: number;
  plan: WellnessPlan;
  createdAt: string;
  updatedAt: string;
}
```

**Índices**:
- `createdAt` (não único)

#### 3. **completedWorkouts**
Armazena treinos concluídos pelo usuário.

**Estrutura**:
```typescript
{
  id?: number;
  dayIndex: number;
  completedAt: string;
  planId?: number;
}
```

**Índices**:
- `dayIndex` (não único)
- `completedAt` (não único)

#### 4. **mealPlans**
Armazena planos alimentares gerados.

**Estrutura**:
```typescript
{
  id?: number;
  plan: MealPlan;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Índices**:
- `userId` (não único)
- `createdAt` (não único)

#### 5. **mealAnalyses**
Armazena análises de refeições feitas pela IA.

**Estrutura**:
```typescript
{
  id?: number;
  analysis: MealAnalysisResponse;
  imageData?: string;
  createdAt: string;
}
```

**Índices**:
- `createdAt` (não único)

#### 6. **recipes**
Armazena receitas salvas pelo usuário.

**Estrutura**:
```typescript
{
  id?: number;
  recipe: Recipe;
  createdAt: string;
  favorited: boolean;
}
```

**Índices**:
- `createdAt` (não único)
- `favorited` (não único)

#### 7. **chatMessages**
Armazena mensagens do chat com a IA.

**Estrutura**:
```typescript
{
  id?: number;
  message: ChatMessage;
  createdAt: string;
}
```

**Índices**:
- `createdAt` (não único)

#### 8. **weightHistory**
Armazena histórico de peso do usuário.

**Estrutura**:
```typescript
{
  id?: number;
  date: string;
  weight: number;
  createdAt: string;
}
```

**Índices**:
- `date` (único)
- `createdAt` (não único)

#### 9. **appSettings**
Armazena configurações gerais do aplicativo.

**Estrutura**:
```typescript
{
  key: string;
  value: any;
  updatedAt: string;
}
```

**Índices**:
- `updatedAt` (não único)

## 🔧 Uso do Serviço

### Inicialização

O banco de dados é inicializado automaticamente quando o app carrega através do componente `DatabaseInitializer`.

```typescript
import { initDatabase, migrateFromLocalStorage } from './services/databaseService';

// Inicializar banco
await initDatabase();

// Migrar dados do localStorage (executado automaticamente)
await migrateFromLocalStorage();
```

### Operações CRUD

#### Usuário

```typescript
import { saveUser, getUser } from './services/databaseService';

// Salvar usuário
await saveUser(user);

// Carregar usuário
const user = await getUser();
```

#### Plano de Bem-Estar

```typescript
import { saveWellnessPlan, getWellnessPlan, deleteWellnessPlan } from './services/databaseService';

// Salvar plano
const planId = await saveWellnessPlan(plan);

// Carregar plano
const plan = await getWellnessPlan();

// Deletar plano
await deleteWellnessPlan();
```

#### Treinos Concluídos

```typescript
import { saveCompletedWorkout, getCompletedWorkouts, clearCompletedWorkouts } from './services/databaseService';

// Salvar treino concluído
await saveCompletedWorkout(dayIndex);

// Carregar todos os treinos concluídos
const completed = await getCompletedWorkouts(); // Retorna Set<number>

// Limpar todos
await clearCompletedWorkouts();
```

#### Configurações do App

```typescript
import { saveAppSetting, getAppSetting } from './services/databaseService';

// Salvar configuração
await saveAppSetting('theme_setting', 'dark');
await saveAppSetting('language', 'pt');
await saveAppSetting('api_mode', 'free');

// Carregar configuração
const theme = await getAppSetting<string>('theme_setting', 'dark');
const language = await getAppSetting<string>('language', 'pt');
```

## 🔄 Migração do localStorage

A migração é executada automaticamente na primeira inicialização do banco de dados. Os seguintes dados são migrados:

- ✅ Dados do usuário (`nutri.user`)
- ✅ Plano de bem-estar (`nutria.wellness.plan`)
- ✅ Treinos concluídos (`nutria.wellness.completed`)
- ✅ Idioma (`language`)
- ✅ Tema (`theme_setting`)
- ✅ Último check-in de peso (`lastWeightCheckin`)
- ✅ Configurações de API

## 🛠️ Funções Utilitárias

### Limpar Todos os Dados

```typescript
import { clearAllData } from './services/databaseService';

// Limpar todos os dados (use com cuidado!)
await clearAllData();
```

## 📝 Notas Importantes

1. **Fallback para localStorage**: O sistema mantém fallback para `localStorage` caso o IndexedDB não esteja disponível ou falhe.

2. **Migração Automática**: A migração do `localStorage` para IndexedDB acontece automaticamente na primeira inicialização.

3. **Performance**: IndexedDB é assíncrono e não bloqueia a UI, oferecendo melhor performance que `localStorage`.

4. **Capacidade**: IndexedDB pode armazenar muito mais dados que `localStorage` (que tem limite de ~5-10MB).

5. **Estrutura**: Os dados são armazenados de forma estruturada, facilitando consultas e filtros.

## 🔍 Inspecionar o Banco de Dados

### Chrome DevTools

1. Abra as DevTools (F12)
2. Vá para a aba **Application**
3. No menu lateral, expanda **IndexedDB**
4. Selecione `NutriIA_DB`
5. Explore os object stores e seus dados

### Firefox DevTools

1. Abra as DevTools (F12)
2. Vá para a aba **Storage**
3. Expanda **IndexedDB**
4. Selecione `NutriIA_DB`
5. Explore os object stores

## 🚨 Troubleshooting

### Banco de Dados não Inicializa

- Verifique se o navegador suporta IndexedDB
- Verifique o console para erros
- Tente limpar os dados do site e recarregar

### Dados não Aparecem

- Verifique se a migração foi executada
- Verifique o console para erros de migração
- Os dados antigos do `localStorage` são preservados como fallback

### Erro de Quota

- IndexedDB tem limites de armazenamento baseados no navegador
- Limpe dados antigos usando `clearAllData()` se necessário

