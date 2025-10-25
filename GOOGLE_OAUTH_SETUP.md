# Guia de Configuração - Google OAuth no Supabase

## Problema
Erro ao tentar conectar com Google no Phoenix Coach.

## Causa
O provedor Google OAuth não está configurado no projeto Supabase.

## Solução - Configurar Google OAuth

### Passo 1: Configurar no Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto ou selecione existente
3. Vá em **APIs & Services** → **Credentials**
4. Clique em **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - Application type: **Web application**
   - Name: **Phoenix Coach**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (desenvolvimento)
     - Seu domínio de produção
   - Authorized redirect URIs:
     - `https://zzpxwkurxgspxumiqtfm.supabase.co/auth/v1/callback`
6. Copie o **Client ID** e **Client Secret**

### Passo 2: Configurar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **Phoenix Coach**
3. Vá em **Authentication** → **Providers**
4. Encontre **Google** e clique para expandir
5. Configure:
   - ✅ **Enable Google provider**
   - Cole o **Client ID** do Google
   - Cole o **Client Secret** do Google
6. Clique em **Save**

### Passo 3: Testar

1. Volte para http://localhost:3000
2. Clique em "Entrar com Google"
3. Será redirecionado para autenticação Google
4. Após autorizar, volta para o app autenticado

---

## Alternativa: Desabilitar Google OAuth (temporário)

Se não quiser configurar agora, pode remover o botão Google:

### Editar `/app/app/page.js`

Procure e comente o botão Google:

```javascript
{/* Temporariamente desabilitado
<Button
  variant="outline"
  className="w-full"
  onClick={handleGoogleSignIn}
>
  <svg ... /> Entrar com Google
</Button>
*/}
```

---

## Verificar Status

Para verificar se o Google OAuth está habilitado no Supabase:

1. Dashboard Supabase → Authentication → Providers
2. Verificar se **Google** está com status **Enabled**

---

## Logs de Erro Comuns

**Erro:** "Invalid provider"
- **Causa:** Google não habilitado no Supabase
- **Solução:** Seguir Passo 2 acima

**Erro:** "redirect_uri_mismatch"
- **Causa:** URL de redirecionamento não configurada no Google Console
- **Solução:** Adicionar callback URL correto no Google Console

**Erro:** "access_denied"
- **Causa:** Usuário cancelou ou não autorizou
- **Solução:** Tentar novamente e autorizar

---

## Suporte

Se o erro persistir, por favor compartilhe:
1. Mensagem de erro exata do console do navegador
2. Screenshot do erro
3. Status do Google Provider no Supabase Dashboard

