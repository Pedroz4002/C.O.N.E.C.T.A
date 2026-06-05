# Supabase - Protocolos Conecta ADM

Este projeto usa uma Edge Function para criar protocolos, gerar PDF, salvar no Storage e enviar o PDF automaticamente por e-mail para o CA e para o aluno.

## 1. Criar recursos no Supabase

O projeto usado pelo site e:

```text
tcmdsdllbnlvqynkmawy
```

## 2. Arquivos locais de segredo

Copie os exemplos e preencha os valores reais. Esses arquivos sao ignorados pelo Git.

```powershell
Copy-Item scripts/supabase.local.example.ps1 scripts/supabase.local.ps1
Copy-Item supabase/.env.example supabase/.env.local
```

Em `scripts/supabase.local.ps1`, preencha:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "..."
$env:SUPABASE_DB_PASSWORD = "..."
```

Em `supabase/.env.local`, preencha:

```text
RESEND_API_KEY=...
CA_EMAIL=...
FROM_EMAIL=Conecta ADM <onboarding@resend.dev>
PROTOCOL_STORAGE_BUCKET=protocolos
```

Importante: se a chave do Resend apareceu em print ou conversa, gere uma nova chave e revogue a antiga.

## 3. Publicar banco, secrets e funcao

Depois de preencher os arquivos locais:

```powershell
.\scripts\deploy-supabase.ps1
```

Esse script executa:

- `supabase link`
- `supabase db push`
- `supabase secrets set`
- `supabase functions deploy protocolo --no-verify-jwt --use-api`

## 4. Fluxo

- `Dúvida`: continua abrindo o WhatsApp com a mensagem pronta.
- `Protocolo geral`: envia para a Edge Function.
- A função gera o PDF, salva no Storage, envia e-mail automaticamente e retorna o numero do processo.
- A consulta por matricula ou numero do processo chama a mesma Edge Function.
