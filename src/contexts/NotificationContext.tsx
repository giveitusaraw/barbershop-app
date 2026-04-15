import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  permissionGranted: boolean;
  requestPermission: () => Promise<void>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  isRealtimeConnected: boolean;
  unreadCalendarCount: number;
  markCalendarAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [unreadCalendarCount, setUnreadCalendarCount] = useState(0);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const showNotificationRef = useRef<(appointment: any) => Promise<void>>();
  const currentUserRef = useRef(currentUser);
  const channelRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const lastAppointmentCheckRef = useRef<Date>(new Date());
  const notifiedAppointmentIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Função para verificar novas reservas via polling (fallback)
  const checkForNewAppointments = useCallback(async () => {
    if (!currentUserRef.current || !notificationsEnabled) {
      return;
    }

    try {
      console.log('[Notificações] Polling - Verificando novas reservas desde:', lastAppointmentCheckRef.current);

      const { data: newAppointments } = await supabase
        .from('appointments')
        .select('*')
        .gte('created_at', lastAppointmentCheckRef.current.toISOString())
        .order('created_at', { ascending: false });

      if (newAppointments && newAppointments.length > 0) {
        const user = currentUserRef.current;
        console.log('[Notificações] Polling - Encontradas', newAppointments.length, 'novas reservas');

        // Processar cada reserva nova
        for (const appointment of newAppointments) {
          // Verificar se deve notificar baseado em permissões
          let shouldNotify = false;

          if (user.role === 'admin') {
            shouldNotify = true;
          } else if (user.role === 'staff' && user.barber_ids) {
            shouldNotify = user.barber_ids.includes(appointment.barber_id);
          }

          if (shouldNotify) {
            console.log('[Notificações] Polling - Notificando reserva:', appointment.id);
            await showNotificationRef.current?.(appointment);
          }
        }
      }

      // Atualizar timestamp da última verificação
      lastAppointmentCheckRef.current = new Date();
    } catch (error) {
      console.error('[Notificações] Erro no polling:', error);
    }
  }, [notificationsEnabled]);

  // Detectar quando a página volta ao foreground e forçar reconexão + polling
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[Notificações] Página voltou ao foreground, verificando conexão...');
        if (currentUserRef.current && notificationsEnabled) {
          // Verificar imediatamente se há novas reservas (importante após ecrã bloqueado)
          await checkForNewAppointments();

          // Forçar reconexão do Realtime
          setReconnectTrigger(prev => prev + 1);
        }
      }
    };

    const handleFocus = async () => {
      console.log('[Notificações] Janela ganhou foco, verificando reservas...');
      if (currentUserRef.current && notificationsEnabled) {
        await checkForNewAppointments();
      }
    };

    const handleOnline = async () => {
      console.log('[Notificações] Conexão à internet restaurada, reconectando...');
      if (currentUserRef.current && notificationsEnabled) {
        await checkForNewAppointments();
        setReconnectTrigger(prev => prev + 1);
      }
    };

    // Detectar quando o utilizador volta após muito tempo inativo (resume event)
    const handleResume = async () => {
      console.log('[Notificações] Dispositivo acordou de sleep, verificando...');
      if (currentUserRef.current && notificationsEnabled) {
        await checkForNewAppointments();
        setReconnectTrigger(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('resume', handleResume);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('resume', handleResume);
    };
  }, [notificationsEnabled, checkForNewAppointments]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }

    const storedPreference = localStorage.getItem('notificationsEnabled');
    if (storedPreference !== null) {
      setNotificationsEnabled(storedPreference === 'true');
    }
  }, []);

  const subscribeToPushNotifications = useCallback(async (registration: ServiceWorkerRegistration) => {
    try {
      // Verificar se já existe uma subscrição
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('[Push] Criando nova subscrição push...');

        // VAPID key pública - Esta é uma chave de exemplo, deve ser gerada corretamente
        // Para produção, gerar usando: npx web-push generate-vapid-keys
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYjEB8RvTYwShJVcNa0V4mY6C5Y9WBpEV8e-p8cV7bF1R5qXv6_SE';

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        console.log('[Push] Subscrição criada:', subscription.endpoint);
      } else {
        console.log('[Push] Subscrição já existe:', subscription.endpoint);
      }

      // Guardar subscrição na base de dados
      if (currentUserRef.current) {
        const subscriptionJSON = subscription.toJSON();

        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: currentUserRef.current.id,
            endpoint: subscription.endpoint,
            p256dh_key: subscriptionJSON.keys?.p256dh || '',
            auth_key: subscriptionJSON.keys?.auth || '',
            user_agent: navigator.userAgent,
            is_active: true,
            last_used_at: new Date().toISOString()
          }, {
            onConflict: 'endpoint'
          });

        if (error) {
          console.error('[Push] Erro ao guardar subscrição:', error);
        } else {
          console.log('[Push] Subscrição guardada na base de dados');
        }
      }

      // Registar Periodic Background Sync (se suportado)
      if ('periodicSync' in registration) {
        try {
          await (registration as any).periodicSync.register('check-appointments', {
            minInterval: 5 * 60 * 1000 // 5 minutos (valor mínimo sugerido)
          });
          console.log('[Background Sync] Periodic sync registado');
        } catch (error) {
          console.warn('[Background Sync] Erro ao registar periodic sync:', error);
        }
      } else {
        console.log('[Background Sync] Periodic sync não suportado neste browser');
      }

    } catch (error) {
      console.error('[Push] Erro ao subscrever push notifications:', error);
    }
  }, []);

  // Função auxiliar para converter VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Este browser não suporta notificações');
      return;
    }

    if (Notification.permission === 'granted') {
      setPermissionGranted(true);

      // Garantir que Service Worker está registado e subscrever push
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('[Notificações] Service Worker pronto:', registration.scope);

          // Subscrever push notifications
          await subscribeToPushNotifications(registration);
        } catch (error) {
          console.error('[Notificações] Erro ao verificar Service Worker:', error);
        }
      }

      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === 'granted');

      if (permission === 'granted' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.log('[Notificações] Service Worker pronto:', registration.scope);

          // Subscrever push notifications
          await subscribeToPushNotifications(registration);
        } catch (error) {
          console.error('[Notificações] Erro ao verificar Service Worker:', error);
        }
      }
    }
  }, [subscribeToPushNotifications]);

  const handleNotificationsEnabledChange = useCallback((enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', enabled.toString());
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.3);
      }, 100);
    } catch (error) {
      console.warn('[Notificações] Erro ao reproduzir som:', error);
    }
  }, []);

  const markCalendarAsRead = useCallback(() => {
    setUnreadCalendarCount(0);
  }, []);

  const showNotification = useCallback(async (appointment: any) => {
    // Verificar se utilizador está logado PRIMEIRO
    if (!currentUserRef.current) {
      console.log('[Notificações] Utilizador não está logado, ignorando...');
      return;
    }

    if (!notificationsEnabled) {
      console.log('[Notificações] Notificações desativadas, ignorando...');
      return;
    }

    if (notifiedAppointmentIdsRef.current.has(appointment.id)) {
      console.log('[Notificações] Reserva já notificada, ignorando duplicado:', appointment.id);
      return;
    }
    notifiedAppointmentIdsRef.current.add(appointment.id);

    console.log('[Notificações] Preparando notificação para reserva:', appointment.id);

    playNotificationSound();
    setUnreadCalendarCount(prev => prev + 1);

    try {
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', appointment.service_id)
        .maybeSingle();

      const { data: barber } = await supabase
        .from('barbers')
        .select('name')
        .eq('id', appointment.barber_id)
        .maybeSingle();

      const serviceName = service?.name || 'Serviço';
      const barberName = barber?.name || 'Funcionário';
      const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('pt-PT');
      const appointmentTime = appointment.appointment_time.substring(0, 5);

      if (permissionGranted) {
        const notificationBody = `${appointment.customer_name}\n${serviceName} - ${barberName}\n${appointmentDate} às ${appointmentTime}`;

        // Tentar usar Service Worker para notificações que funcionam com ecrã bloqueado
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          console.log('[Notificações] Usando Service Worker para notificação');

          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: 'Nova Reserva',
            body: notificationBody,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `appointment-${appointment.id}`,
            vibrate: [200, 100, 200, 100, 200]
          });

          // Adicionar vibração também na página (para dispositivos móveis)
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        } else {
          // Fallback para notificação normal do browser
          console.log('[Notificações] Service Worker não disponível, usando notificação normal');
          const notification = new Notification('Nova Reserva', {
            body: notificationBody,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `appointment-${appointment.id}`,
            requireInteraction: true,
            silent: false
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          // Adicionar vibração para dispositivos móveis
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }
      } else {
        console.log('[Notificações] Permissão do browser não concedida, apenas toast');
      }
    } catch (error) {
      console.error('[Notificações] Erro ao mostrar notificação:', error);
    }
  }, [permissionGranted, notificationsEnabled, playNotificationSound]);

  // Update ref whenever showNotification changes
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  useEffect(() => {
    if (!currentUser || !notificationsEnabled) {
      setIsRealtimeConnected(false);
      // Limpar heartbeat se existir
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = undefined;
      }
      // Limpar polling se existir
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = undefined;
      }
      // Remover canal anterior se existir
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    console.log('[Notificações] Iniciando subscrição ao Realtime...', {
      user: currentUser.username,
      role: currentUser.role,
      barber_ids: currentUser.barber_ids,
      reconnectAttempt: reconnectTrigger
    });

    // Remover canal anterior antes de criar novo (importante para reconexão)
    if (channelRef.current) {
      console.log('[Notificações] Removendo canal anterior antes de reconectar');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel('appointments-changes', {
        config: {
          broadcast: { self: false },
          presence: { key: currentUser.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments'
        },
        async (payload) => {
          console.log('[Notificações] Nova reserva detectada:', payload.new);
          const newAppointment = payload.new;
          const user = currentUserRef.current;

          if (!user) return;

          if (user.role === 'admin') {
            console.log('[Notificações] Admin - Mostrando notificação');
            await showNotificationRef.current?.(newAppointment);
            return;
          }

          if (user.role === 'staff' && user.barber_ids) {
            if (user.barber_ids.includes(newAppointment.barber_id)) {
              console.log('[Notificações] Staff - Mostrando notificação para funcionário permitido');
              await showNotificationRef.current?.(newAppointment);
            } else {
              console.log('[Notificações] Staff - Reserva ignorada (funcionário não permitido)');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[Notificações] Estado da subscrição:', status);
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false);
          // Tentar reconectar após erro
          console.log('[Notificações] Erro na conexão, tentando reconectar em 5 segundos...');
          setTimeout(() => {
            if (currentUserRef.current && notificationsEnabled) {
              setReconnectTrigger(prev => prev + 1);
            }
          }, 5000);
        }
      });

    channelRef.current = channel;

    // Implementar heartbeat para manter conexão ativa e detectar desconexões
    // Heartbeat mais frequente: a cada 15 segundos
    heartbeatIntervalRef.current = setInterval(() => {
      if (channelRef.current) {
        const state = channelRef.current.state;
        console.log('[Notificações] Heartbeat - Estado do canal:', state);

        // Se o canal não está subscrito, tentar reconectar
        if (state !== 'joined') {
          console.log('[Notificações] Canal desconectado detectado no heartbeat, reconectando...');
          setReconnectTrigger(prev => prev + 1);
        }
      }
    }, 15000); // Verificar a cada 15 segundos (mais frequente)

    // Implementar polling como fallback (apenas quando visível)
    // Polling a cada 10 segundos quando a página está visível
    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Apenas fazer polling se a página está visível
      if (document.visibilityState === 'visible') {
        pollingIntervalRef.current = setInterval(() => {
          if (document.visibilityState === 'visible') {
            console.log('[Notificações] Polling periódico...');
            checkForNewAppointments();
          }
        }, 10000); // A cada 10 segundos
      }
    };

    startPolling();

    // Listener para parar/retomar polling baseado em visibilidade
    const handlePollingVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Notificações] Página visível, iniciando polling');
        startPolling();
      } else {
        console.log('[Notificações] Página oculta, parando polling');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = undefined;
        }
      }
    };

    document.addEventListener('visibilitychange', handlePollingVisibility);

    return () => {
      console.log('[Notificações] Cancelando subscrição ao Realtime');
      setIsRealtimeConnected(false);

      document.removeEventListener('visibilitychange', handlePollingVisibility);

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = undefined;
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = undefined;
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id, notificationsEnabled, reconnectTrigger, checkForNewAppointments]);

  return (
    <NotificationContext.Provider
      value={{
        permissionGranted,
        requestPermission,
        notificationsEnabled,
        setNotificationsEnabled: handleNotificationsEnabledChange,
        isRealtimeConnected,
        unreadCalendarCount,
        markCalendarAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
