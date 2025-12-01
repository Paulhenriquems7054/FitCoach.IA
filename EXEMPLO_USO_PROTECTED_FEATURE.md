# 📝 Exemplo de Uso - ProtectedFeature

Este documento mostra exemplos práticos de como usar o componente `ProtectedFeature` no app.

## ✅ Exemplo Implementado: AnalyzerPage

A página `pages/AnalyzerPage.tsx` já foi atualizada para usar `ProtectedFeature`:

```typescript
import { ProtectedFeature } from '../components/ProtectedFeature';
import { useSubscription } from '../hooks/useSubscription';

const AnalyzerPage: React.FC = () => {
  const { getRemainingVoiceMinutes } = useSubscription();
  
  return (
    <ProtectedFeature feature="photoAnalysis">
      {/* Todo o conteúdo de análise de fotos */}
      <ImageUploader />
      <Button>Analisar com IA</Button>
      {/* ... */}
    </ProtectedFeature>
  );
};
```

## 📋 Exemplo Completo: Tela de Análise de Foto com Chat de Voz

```typescript
// Exemplo: Tela de Análise de Foto
import { ProtectedFeature } from '../components/ProtectedFeature';
import { useSubscription } from '../hooks/useSubscription';
import { Button } from '../components/ui/Button';

function PhotoAnalysisScreen() {
  const { isPremium, getRemainingVoiceMinutes } = useSubscription();

  return (
    <div>
      {/* Proteção da análise de fotos */}
      <ProtectedFeature feature="photoAnalysis">
        <CameraComponent />
        <AnalysisResults />
      </ProtectedFeature>

      {/* Proteção do chat de voz com fallback customizado */}
      <ProtectedFeature 
        feature="voiceChat"
        fallback={
          <div>
            <p>Você não tem minutos de voz disponíveis</p>
            <Button onClick={() => { window.location.hash = '#/premium'; }}>
              Recarregar
            </Button>
          </div>
        }
      >
        <VoiceChatComponent 
          remainingMinutes={getRemainingVoiceMinutes()}
        />
      </ProtectedFeature>
    </div>
  );
}
```

## 🎯 Features Disponíveis

O `ProtectedFeature` suporta as seguintes features:

- `'photoAnalysis'` - Análise de fotos de comida
- `'workoutAnalysis'` - Análise de treinos
- `'customWorkouts'` - Treinos personalizados
- `'textChat'` - Chat de texto
- `'voiceChat'` - Consultoria de voz

## 💡 Casos de Uso

### 1. Proteção Simples (sem fallback)

```typescript
<ProtectedFeature feature="photoAnalysis">
  <ImageUploader />
  <AnalysisButton />
</ProtectedFeature>
```

### 2. Com Fallback Customizado

```typescript
<ProtectedFeature 
  feature="voiceChat"
  fallback={
    <div className="text-center p-8">
      <p className="mb-4">Você não tem minutos de voz disponíveis</p>
      <Button onClick={() => { window.location.hash = '#/premium'; }}>
        Recarregar Minutos
      </Button>
    </div>
  }
>
  <VoiceChatComponent />
</ProtectedFeature>
```

### 3. Sem Prompt de Upgrade

```typescript
<ProtectedFeature 
  feature="textChat"
  showUpgradePrompt={false}
  fallback={<p>Acesso negado</p>}
>
  <ChatComponent />
</ProtectedFeature>
```

## 🔗 Integração com useSubscription

O `ProtectedFeature` usa internamente o hook `useSubscription`, mas você também pode usar diretamente:

```typescript
import { useSubscription } from '../hooks/useSubscription';

function MyComponent() {
  const { 
    isPremium,
    canAccessFeature,
    hasVoiceMinutesAvailable,
    getRemainingVoiceMinutes,
    refresh 
  } = useSubscription();

  // Verificar acesso programaticamente
  if (canAccessFeature('voiceChat')) {
    // Fazer algo
  }

  // Obter minutos restantes
  const minutes = getRemainingVoiceMinutes();
  
  return (
    <div>
      {hasVoiceMinutesAvailable() && (
        <VoiceButton />
      )}
    </div>
  );
}
```

## 📍 Onde Integrar

### Páginas que devem usar ProtectedFeature:

1. ✅ **AnalyzerPage** - Análise de fotos (já implementado)
2. ⏳ **AnalysisPage** - Análise de treinos
3. ⏳ **GeneratorPage** - Gerador de treinos personalizados
4. ⏳ **ChatbotPopup** - Chat de texto e voz
5. ⏳ **WellnessPlanPage** - Planos de treino

### Exemplo de Integração no Chat de Voz:

```typescript
// Em chatbot/components/ChatbotPopup.tsx
import { ProtectedFeature } from '../../components/ProtectedFeature';
import { useSubscription } from '../../hooks/useSubscription';

const ChatbotPopup: React.FC = () => {
  const { getRemainingVoiceMinutes } = useSubscription();
  
  return (
    <ProtectedFeature 
      feature="voiceChat"
      fallback={
        <div className="p-4 text-center">
          <p>Você não tem minutos de voz disponíveis</p>
          <Button onClick={() => { window.location.hash = '#/premium'; }}>
            Recarregar Minutos
          </Button>
        </div>
      }
    >
      {/* Componente de chat de voz */}
      <VoiceChatInterface 
        remainingMinutes={getRemainingVoiceMinutes()}
      />
    </ProtectedFeature>
  );
};
```

## ✅ Checklist de Integração

- [x] AnalyzerPage - Análise de fotos
- [ ] AnalysisPage - Análise de treinos
- [ ] GeneratorPage - Treinos personalizados
- [ ] ChatbotPopup - Chat de texto e voz
- [ ] WellnessPlanPage - Planos de treino

---

**Nota:** O componente `ProtectedFeature` verifica automaticamente o status da assinatura usando cache de 5 minutos, então não há necessidade de verificar manualmente antes de usar.

