# Configuração do Database Webhook para Notificações Push

Este documento explica como configurar o Database Webhook no Supabase para ativar notificações push verdadeiras do servidor.

## Por que configurar?

Com o webhook configurado:
- ✅ Notificações funcionam mesmo com a aplicação **completamente fechada**
- ✅ Notificações chegam **instantaneamente** quando há nova reserva
- ✅ Funciona mesmo com o **telemóvel bloqueado por muito tempo**
- ✅ Não depende de conexão WebSocket ativa

## Sistema Atual (Sem Webhook)

Atualmente implementado e funcionando:
- ✅ **Realtime com Reconexão Automática:** Reconecta quando desbloqueia o telemóvel
- ✅ **Polling Inteligente:** Verifica novas reservas a cada 10 segundos quando a página está visível
- ✅ **Wake Events:** Detecta quando dispositivo acorda e verifica reservas
- ✅ **Heartbeat:** Monitora conexão a cada 15 segundos
- ✅ **Service Worker:** Preparado para receber push notifications
- ✅ **Tabela de Subscrições:** Sistema de push subscriptions já criado

## Como Configurar o Webhook (Opcional - Melhoria Adicional)

### Passo 1: Aceder ao Supabase Dashboard

1. Abra o [Supabase Dashboard](https://app.supabase.com)
2. Selecione o seu projeto
3. No menu lateral, vá para **Database** → **Webhooks**

### Passo 2: Criar Novo Webhook

1. Clique em **"Create a new hook"**
2. Preencha os campos:

   **Name:** `notify-new-appointment`

   **Table:** `appointments`

   **Events:** Selecione apenas `INSERT`

   **Type:** `HTTP Request`

   **Method:** `POST`

   **URL:**
   ```
   https://[seu-projeto].supabase.co/functions/v1/send-push-notification
   ```
   (Substitua `[seu-projeto]` pelo ID do seu projeto Supabase)

   **HTTP Headers:**
   ```
   Content-Type: application/json
   Authorization: Bearer [sua-anon-key]
   ```
   (Substitua `[sua-anon-key]` pela Anon Key do seu projeto - encontra-se em Settings → API)

   **HTTP Params:** (deixe vazio)

3. Clique em **"Confirm"**

### Passo 3: Testar o Webhook

1. Crie uma nova reserva na aplicação
2. Verifique os logs da Edge Function:
   - No Supabase Dashboard, vá para **Edge Functions**
   - Selecione `send-push-notification`
   - Clique em **Logs**
   - Deverá ver logs de execução quando cria uma reserva

### Passo 4: Verificar Funcionamento

Com o webhook configurado:

1. Faça login na aplicação
2. Aceite as permissões de notificação
3. **Feche completamente a aplicação** (ou bloqueie o telemóvel)
4. Peça a alguém para criar uma nova reserva
5. Deverá receber uma notificação push mesmo com a app fechada

## Resolução de Problemas

### Webhook não está a disparar?

1. Verifique se a URL está correta
2. Confirme que o Header `Authorization` está presente com a Anon Key correta
3. Verifique os logs do webhook no Supabase Dashboard

### Notificações push não chegam?

1. Verifique se concedeu permissões de notificação
2. Confirme que as subscrições foram criadas (tabela `push_subscriptions`)
3. Verifique os logs da Edge Function `send-push-notification`
4. Certifique-se de que está logado quando testa

### Edge Function retorna erro?

1. Verifique os logs detalhados no Dashboard
2. Confirme que a tabela `push_subscriptions` existe
3. Verifique se as políticas RLS estão corretas

## Sem Webhook - Sistema Atual

Mesmo sem configurar o webhook, o sistema atual já é muito robusto:

### Como Funciona Agora

1. **Quando a aplicação está aberta:**
   - Notificações chegam **instantaneamente** via Realtime
   - Som toca imediatamente
   - Toast aparece na interface

2. **Quando bloqueia o telemóvel:**
   - Sistema verifica novas reservas a cada 10 segundos (polling)
   - Ao desbloquear, reconecta automaticamente e verifica reservas perdidas
   - Deteta eventos de wake (quando dispositivo acorda)

3. **Quando perde conexão:**
   - Heartbeat detecta desconexão em 15 segundos
   - Reconexão automática
   - Polling continua em background

4. **Segurança:**
   - Notificações APENAS para utilizadores logados
   - Filtro por permissões (admin vê tudo, staff vê só os seus)

## Recomendação

**Para a maioria dos casos, o sistema atual (sem webhook) é suficiente e funciona muito bem!**

O webhook é uma melhoria adicional recomendada apenas se:
- Precisa de notificações com a app **completamente fechada** por muito tempo
- O dispositivo fica em deep sleep por longos períodos
- Necessita de garantia 100% de entrega de notificações

## Suporte

Se tiver problemas:
1. Verifique os logs no browser (Console)
2. Confirme que está logado
3. Verifique se as permissões de notificação foram concedidas
4. Teste com a aplicação aberta primeiro
5. Se ainda tiver problemas, contacte o suporte
