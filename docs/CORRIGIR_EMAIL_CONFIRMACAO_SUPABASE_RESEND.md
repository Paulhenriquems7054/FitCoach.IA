# Correção: "Error sending confirmation email" (Supabase Auth + Resend)

O erro **"Error sending confirmation email"** vem do **Supabase Auth**, ao tentar enviar o e-mail de confirmação de cadastro usando o **SMTP** que você configurou no painel (Resend). Não vem da Edge Function `send-email`.

---

## O que você já tem configurado

- **Supabase → E-mails:** SMTP personalizado habilitado  
- **Remetente:** `no-reply@phmsdev.com.br`  
- **Nome:** fit-coach-ia  
- **Host:** smtp.resend.com | **Porta:** 465  
- **Usuário:** resend | **Senha:** (configurada)

Para o envio funcionar, falta garantir **domínio verificado no Resend** e **senha SMTP = API Key**.

---

## Checklist de correção (em ordem)

### 1. Domínio verificado no Resend

O remetente `no-reply@phmsdev.com.br` usa o domínio **phmsdev.com.br**. No Resend, **só é possível enviar com esse remetente se o domínio estiver verificado**.

1. Acesse [Resend → Domains](https://resend.com/domains).  
2. Adicione o domínio **phmsdev.com.br** (se ainda não existir).  
3. Siga as instruções para adicionar os registros DNS (SPF, DKIM, etc.) no provedor do domínio.  
4. Aguarde o status **Verified** no Resend.

Se o domínio não estiver verificado, o Resend pode rejeitar o envio e o Supabase devolve "Error sending confirmation email".

---

### 2. Senha SMTP = API Key do Resend

No Resend, a **senha do SMTP é a sua API Key** (a mesma que você usa nas Edge Functions), não uma senha separada.

1. Acesse [Resend → API Keys](https://resend.com/api-keys).  
2. Copie a API Key (formato `re_xxxxxxxxxx`).  
3. No **Supabase** → **Project Settings** → **Auth** → **SMTP**:  
   - Em **Senha**, cole **exatamente** essa API Key.  
   - Salve.

Se a senha estiver diferente da API Key, a conexão SMTP falha e o Supabase retorna o mesmo erro.

---

### 3. Porta e host

Sua configuração está de acordo com a documentação do Resend:

- **Host:** `smtp.resend.com`  
- **Porta:** `465`  
- **Usuário:** `resend`  

Não é necessário alterar isso.

---

### 4. Verificar logs no Resend

Depois de ajustar domínio e senha:

1. Faça um novo cadastro de teste no app.  
2. Acesse [Resend → Emails](https://resend.com/emails).  
3. Veja se aparece uma tentativa de envio e qual o status (enviado, falha, etc.).  
4. Se houver falha, o Resend mostra o motivo (ex.: domínio não verificado, autenticação inválida).

---

### 5. Opção temporária: desabilitar confirmação de e-mail (só para testes)

Enquanto o SMTP não estiver 100% (por exemplo, domínio ainda em verificação), você pode **desabilitar** a confirmação de e-mail para o cadastro funcionar sem depender do envio:

1. **Supabase** → **Authentication** → **Settings** → **Email Auth**.  
2. Desabilite **"Enable email confirmations"**.  
3. Salve.

Com isso, o usuário é criado e pode fazer login logo após o cadastro, **sem** receber e-mail de confirmação. Quando o Resend estiver ok, reative a confirmação.

---

## Resumo

| Item                         | O que fazer |
|-----------------------------|-------------|
| Domínio no Resend           | Verificar **phmsdev.com.br** em [Resend → Domains](https://resend.com/domains) e completar DNS até ficar **Verified**. |
| Senha SMTP no Supabase       | Usar a **API Key** do Resend (`re_...`) no campo **Senha** do SMTP. |
| Teste após correção         | Novo cadastro + conferir [Resend → Emails](https://resend.com/emails) e caixa de entrada (e spam). |
| Enquanto não funcionar SMTP | Opcional: desabilitar "Enable email confirmations" no Auth para testes. |

Referência Resend SMTP: [Send emails with SMTP - Resend](https://resend.com/docs/send-with-smtp).
