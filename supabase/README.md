# Supabase - Protocolos Conecta ADM

Este projeto usa uma Edge Function para criar protocolos, gerar PDF, salvar no Storage e enviar o PDF automaticamente por e-mail para o CA e para o aluno.

## 1. Criar recursos no Supabase

No terminal, depois de instalar e logar no Supabase CLI:

```powershell
supabase link --project-ref SEU_PROJECT_REF
supabase db push
supabase functions deploy protocolo
```

## 2. Variaveis obrigatorias

Cadastre estes secrets no Supabase:

```powershell
supabase secrets set RESEND_API_KEY="SUA_CHAVE_RESEND"
supabase secrets set CA_EMAIL="emaildoca@exemplo.com"
supabase secrets set FROM_EMAIL="Conecta ADM <protocolos@seudominio.com>"
supabase secrets set PROTOCOL_STORAGE_BUCKET="protocolos"
```

O Supabase ja fornece automaticamente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` para a Edge Function.

## 3. Configurar o site

Edite `site-config.js`:

```js
window.CONECTA_CONFIG = {
  protocolEndpoint: "https://SEU-PROJETO.supabase.co/functions/v1/protocolo",
  supabaseAnonKey: "SUA_SUPABASE_ANON_KEY",
};
```

Depois envie a alteracao para o GitHub Pages.

## 4. Fluxo

- `Dúvida`: continua abrindo o WhatsApp com a mensagem pronta.
- `Protocolo geral`: envia para a Edge Function.
- A função gera o PDF, salva no Storage, envia e-mail automaticamente e retorna o numero do processo.
- A consulta por matricula ou numero do processo chama a mesma Edge Function.
