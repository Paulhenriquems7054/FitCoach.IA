# Servidor da Academia - FitCoach.IA

## 📋 Visão Geral

O servidor da academia é uma API REST local que permite sincronização de dados entre o desktop da academia (servidor) e os dispositivos móveis dos alunos (clientes).

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install express cors
```

### 2. Iniciar o Servidor

```bash
npm run server
```

Ou diretamente:

```bash
node server/gym-server.js
```

### 3. Configurar no App

1. Abra o app no desktop da academia
2. Vá em **Configurações** → **Servidor da Academia**
3. Informe a URL do servidor (ex: `http://192.168.1.100:3001`)
4. Clique em **Testar & Salvar**

### 4. Conectar Dispositivos Móveis

1. No dispositivo móvel do aluno, abra o app
2. Vá em **Configurações** → **Servidor da Academia**
3. Informe a mesma URL do servidor
4. Clique em **Testar & Salvar**

## 📡 Endpoints Disponíveis

### Health Check
```
GET /api/health
```
Verifica se o servidor está funcionando.

### Informações do Servidor
```
GET /api/info
```
Retorna informações sobre o servidor, incluindo endereços IP locais.

### Status de Bloqueio do Aluno
```
GET /api/students/:username/status
```
Retorna o status de bloqueio de um aluno específico.

**Resposta:**
```json
{
  "accessBlocked": false,
  "blockedAt": null,
  "blockedBy": null,
  "blockedReason": null
}
```

### Dados Completos do Aluno
```
GET /api/students/:username
```
Retorna todos os dados de um aluno (sem senha).

### Lista de Alunos Bloqueados
```
GET /api/students/blocked
```
Retorna lista de todos os alunos bloqueados.

## 🔧 Configuração

### Porta Padrão
O servidor roda na porta **3001** por padrão. Para alterar:

```bash
PORT=3002 node server/gym-server.js
```

### Host
Por padrão, o servidor aceita conexões de qualquer IP (`0.0.0.0`). Para restringir:

```bash
HOST=localhost node server/gym-server.js
```

## 📁 Estrutura de Dados

O servidor armazena dados em `data/gym-db.json`:

```json
{
  "users": [
    {
      "username": "aluno-joao",
      "nome": "João Silva",
      "gymRole": "student",
      "accessBlocked": false,
      ...
    }
  ],
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

## 🔒 Segurança

- O servidor é apenas para uso em rede local
- Não expor na internet pública sem proteção adequada
- Senhas não são retornadas nas respostas da API
- Recomenda-se usar HTTPS em produção

## 🐛 Troubleshooting

### Servidor não inicia
- Verifique se a porta 3001 está disponível
- Verifique se as dependências estão instaladas

### Dispositivos não conseguem conectar
- Verifique se o desktop e dispositivos estão na mesma rede
- Verifique o firewall do Windows/Mac
- Use o IP local correto (não `localhost`)

### Status não sincroniza
- Verifique se o servidor está rodando
- Verifique a URL configurada no app
- Verifique os logs do servidor

## 📝 Notas

- O servidor precisa ter acesso ao banco de dados IndexedDB do desktop
- Atualmente, o servidor usa um arquivo JSON como fallback
- Para produção, considere usar uma biblioteca como Dexie.js para ler IndexedDB diretamente

