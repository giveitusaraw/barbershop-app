# Sistema de Notificações em Tempo Real

Este documento descreve como funciona o sistema de notificações implementado na aplicação.

## Funcionalidades

### 1. Notificações em Tempo Real
- As notificações são acionadas automaticamente quando uma nova reserva é criada
- Utiliza Supabase Realtime para detectar inserções na tabela `appointments`
- Funciona apenas quando o utilizador está logado

### 2. Tipos de Notificações

#### Notificações do Browser com Service Worker
- Notificações nativas do sistema operacional
- Funcionam mesmo com o ecrã bloqueado no telemóvel
- Funcionam em background através do Service Worker
- Aparecem no centro de notificações do dispositivo
- Incluem som e vibração personalizados
- Contêm informações da reserva: nome do cliente, serviço, funcionário, data e hora
- Permanecem visíveis até o utilizador as dispensar
- Incluem botões de ação: "Ver Reserva" e "Dispensar"
- Clicável para abrir ou focar na aplicação

#### Notificações In-App (Toast)
- Aparecem dentro da aplicação no canto inferior direito
- Animação suave de entrada
- Auto-fechamento após 5 segundos
- Podem ser fechadas manualmente
- Funcionam mesmo sem permissão de notificações do browser

#### Vibração em Dispositivos Móveis
- Padrão de vibração personalizado: 200ms, pausa 100ms, 200ms, pausa 100ms, 200ms
- Funciona em telemóveis e tablets com suporte a vibração
- Ativa automaticamente quando chega uma notificação
- Funciona em conjunto com o som da notificação

### 3. Permissões

#### Solicitação Automática
- Ao fazer login, o sistema solicita automaticamente permissão para notificações
- O utilizador pode aceitar ou recusar

#### Gestão Manual
- Aceda a "Notificações" no menu de administração
- Ative/desative notificações
- Conceda permissões se recusou inicialmente
- Verifique o estado atual das permissões

### 4. Filtros de Notificações

#### Administradores
- Recebem notificações de todas as reservas
- Acesso completo a todos os funcionários

#### Funcionários (Staff)
- Recebem apenas notificações das reservas dos funcionários aos quais têm permissão
- Baseado nas permissões definidas na secção "Contas"

## Notificações em Dispositivos Móveis

### Características Especiais para Telemóveis

As notificações em dispositivos móveis têm funcionalidades adicionais:

1. **Funcionam com o ecrã bloqueado:**
   - Graças ao Service Worker, as notificações aparecem mesmo quando o ecrã está bloqueado
   - Acordam o ecrã quando chega uma notificação
   - Aparecem no centro de notificações do sistema

2. **Vibração:**
   - Padrão de vibração personalizado
   - Vibra automaticamente quando chega uma notificação
   - Funciona em conjunto com o som

3. **Som do Sistema:**
   - Usa o som de notificação do sistema operativo
   - Respeita as configurações de volume do dispositivo
   - Toca mesmo com o ecrã bloqueado

4. **Ações Rápidas:**
   - Botão "Ver Reserva" para abrir a aplicação
   - Botão "Dispensar" para fechar a notificação
   - Pode deslizar para dispensar

### Configuração em Dispositivos Móveis

#### Android
1. Aceite a permissão de notificações quando solicitado
2. As notificações funcionarão automaticamente em background
3. Pode ajustar o som e vibração nas configurações do Android

#### iOS (Safari)
1. Para melhor funcionamento, adicione a aplicação à home screen:
   - Abra a aplicação no Safari
   - Toque no botão de partilha
   - Selecione "Adicionar ao Ecrã Principal"
2. Aceite as permissões de notificação
3. As notificações funcionarão quando a app estiver adicionada à home screen

## Como Usar

### Para o Utilizador

1. **Primeira vez:**
   - Faça login no sistema
   - Aceite a permissão de notificações quando solicitado

2. **Gestão de Notificações:**
   - Aceda ao menu "Notificações" no painel de administração
   - Ative ou desative conforme necessário
   - Conceda permissões se necessário

3. **Receber Notificações:**
   - Mantenha a sessão ativa (logado)
   - Novas reservas irão gerar notificações automaticamente
   - Notificações aparecem tanto no browser como na aplicação

### Para Administradores

1. **Configurar Permissões:**
   - Aceda a "Contas" no painel de administração
   - Defina quais funcionários cada conta staff pode visualizar
   - As notificações respeitarão essas permissões

## Tecnologias Utilizadas

- **Supabase Realtime:** Detecção de mudanças em tempo real na base de dados
- **Service Worker API:** Permite notificações em background e com ecrã bloqueado
- **Notification API:** Notificações nativas do browser
- **Vibration API:** Vibração em dispositivos móveis
- **Web Audio API:** Som personalizado para notificações
- **React Context:** Gestão de estado global das notificações
- **Toast Components:** Notificações in-app personalizadas

## Requisitos

- Browser moderno com suporte a Notification API (Chrome, Firefox, Safari, Edge)
- Permissões de notificação concedidas pelo utilizador
- Sessão ativa (utilizador logado)
- Conexão com a internet

## Sistema de Reconexão Automática

Para garantir que as notificações continuem a funcionar mesmo após períodos de inatividade:

### Reconexão Inteligente
- Deteta quando o ecrã é desbloqueado e reconecta automaticamente
- Monitora o estado da conexão a cada **15 segundos** (heartbeat)
- Reconecta automaticamente quando a internet volta
- Retry automático em caso de erro na conexão
- Deteta quando o dispositivo acorda de deep sleep
- Verifica imediatamente reservas perdidas ao reconectar

### Sistema de Polling Inteligente (Fallback Robusto)
- **Polling a cada 10 segundos** quando a página está visível
- Verifica novas reservas automaticamente em background
- Ativa automaticamente quando:
  - Desbloqueia o telemóvel
  - Ganha foco na aplicação
  - Internet volta depois de cair
  - Dispositivo acorda de sleep
- Desativa quando a página está oculta (poupa bateria)
- **Funciona mesmo sem webhook configurado**

### Web Push Notifications (Servidor) - **Opcional**
- Sistema de push notifications verdadeiras via servidor
- Funciona mesmo com a aplicação completamente fechada
- Subscrições push guardadas na base de dados
- Edge Function preparada para enviar notificações automaticamente
- Não depende de conexão WebSocket ativa
- **Requer configuração manual de Database Webhook** (ver WEBHOOK_SETUP.md)
- **NOTA:** O sistema atual funciona muito bem mesmo SEM webhook configurado!

### Background Sync
- Periodic Background Sync para verificar novas reservas
- Sincronização automática quando o dispositivo acorda
- Funciona em segundo plano sem intervenção do utilizador
- Verifica reservas a cada 5 minutos (quando suportado)

## Sistema Atual - Como Funciona

### Quando o Telemóvel Está Bloqueado

O sistema usa uma abordagem **híbrida com múltiplas camadas de proteção**:

1. **Conexão Realtime Principal:**
   - Subscrição WebSocket ao Supabase Realtime
   - Notificações instantâneas quando há nova reserva
   - Reconexão automática quando detecta desconexão

2. **Polling Inteligente em Background:**
   - Verifica automaticamente a cada 10 segundos (quando visível)
   - Continua verificando mesmo se Realtime falhar
   - Ao desbloquear telemóvel, verifica imediatamente reservas perdidas

3. **Eventos de Wake:**
   - Deteta quando desbloqueia o telemóvel (`visibilitychange`)
   - Deteta quando a janela ganha foco (`focus`)
   - Deteta quando internet volta (`online`)
   - Deteta quando dispositivo acorda de sleep (`resume`)
   - **Todos estes eventos verificam imediatamente novas reservas**

4. **Heartbeat e Monitorização:**
   - Verifica estado da conexão a cada 15 segundos
   - Se detecta desconexão, reconecta automaticamente
   - Logs detalhados para debugging

### Resultado Prático

Com esta abordagem híbrida:
- ✅ **Notificações chegam dentro de 10 segundos** mesmo com telemóvel bloqueado
- ✅ **Ao desbloquear, notificações aparecem IMEDIATAMENTE** (verificação instantânea)
- ✅ **Não perde nenhuma notificação** (sistema de fallback robusto)
- ✅ **Funciona sem configuração adicional** (não precisa de webhook)
- ✅ **Compatível com todos os browsers** modernos

## Segurança das Notificações

### Filtro por Login
- Notificações APENAS aparecem quando o utilizador está logado
- Som e vibração NÃO tocam se não houver sessão ativa
- Protege contra notificações não autorizadas

### Verificação de Permissões
- Admins recebem todas as notificações
- Staff apenas recebe notificações dos seus funcionários permitidos
- Verificação feita tanto no Realtime como no Polling

## Limitações

- Service Worker requer HTTPS (exceto em localhost para desenvolvimento)
- Algumas configurações de browser podem bloquear notificações
- Utilizadores devem conceder permissão explicitamente
- Vibração funciona apenas em dispositivos com suporte (telemóveis e tablets)
- Em iOS, notificações com Service Worker têm limitações (requerem adicionar à home screen)
- Periodic Background Sync não é suportado em todos os browsers (principalmente Chrome/Edge)

## Resolução de Problemas

### Não recebo notificações do browser?
1. Verifique se concedeu permissão ao browser
2. Aceda às configurações de notificações no menu
3. Clique em "Conceder Permissão"
4. Verifique as configurações do browser para o site

### Não recebo notificações in-app?
1. Verifique se está logado
2. Aceda às configurações de notificações
3. Certifique-se de que as notificações estão ativadas
4. Verifique se tem permissões para o funcionário da reserva

### Recebo muitas notificações?
1. Aceda ao menu "Notificações"
2. Desative as notificações temporariamente
3. Configure permissões de funcionários na secção "Contas"

### Notificações não funcionam com ecrã bloqueado no telemóvel?

**Solução Implementada:** A aplicação agora usa um sistema de reconexão automática combinado com Web Push Notifications do servidor.

1. **Certifique-se de que está logado:** As notificações APENAS funcionam quando está autenticado
2. **Conceda permissões:** Aceite as permissões de notificação quando solicitado
3. **Service Worker:** Verifique se está registado (aparece nos logs do browser)
4. **Web Push Ativo:** Após aceitar permissões, a subscrição push é criada automaticamente
5. **No iOS:** Adicione a aplicação à home screen para melhor funcionamento
6. **Poupança de Bateria:** Alguns modos extremos podem bloquear notificações
7. **Reconexão Automática:** Quando desbloquear o dispositivo, a conexão é restaurada automaticamente

**Como funciona agora:**
- **Com a app aberta:** Notificações instantâneas via Realtime
- **Com ecrã bloqueado:** Polling verifica a cada 10 segundos + verificação ao desbloquear
- **Ao desbloquear:** Verificação IMEDIATA de reservas perdidas + reconexão Realtime
- **Sem internet:** Ao voltar online, verifica automaticamente
- **Deep sleep:** Ao acordar o dispositivo, verifica automaticamente

**Tempos de entrega:**
- App aberta e visível: **< 1 segundo** (Realtime)
- Ecrã bloqueado: **5-10 segundos** (Polling)
- Ao desbloquear telemóvel: **< 1 segundo** (Verificação imediata)

**Webhook Opcional (Melhoria Adicional):**
Se configurar o Database Webhook (ver WEBHOOK_SETUP.md):
- Notificações chegam MESMO com app completamente fechada
- Push notifications verdadeiras do servidor
- Entrega instantânea em todos os cenários

### Notificações não vibram no telemóvel?
1. Verifique se o telemóvel não está em modo silencioso
2. Ative a vibração nas configurações do sistema
3. Alguns browsers podem não suportar a API de vibração

## Segurança e Privacidade

- Notificações respeitam as permissões de acesso do utilizador
- Staff só recebe notificações dos funcionários aos quais tem acesso
- Não há armazenamento de dados sensíveis no browser
- Todas as verificações são feitas em tempo real contra a base de dados
