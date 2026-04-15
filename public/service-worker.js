// Service Worker para notificações em background e suporte offline (PWA)
const CACHE_NAME = 'barber-booking-v5';
const BACKGROUND_SYNC_TAG = 'check-appointments';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png/icon-192.png',
  '/icon-512.png/icon-512.png',
];

// Instalar Service Worker e fazer pre-cache dos recursos essenciais
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalado');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[Service Worker] Pre-cache parcialmente falhou:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado');
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Intercepção de pedidos para suporte offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar pedidos que não sejam GET
  if (request.method !== 'GET') return;

  // Ignorar pedidos a APIs externas (Supabase, etc.)
  if (url.origin !== self.location.origin) return;

  // Para navegação (HTML) usar network-first, fallback para cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Para assets estáticos (JS, CSS, imagens) usar cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }
});

// Escutar mensagens da aplicação
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensagem recebida:', event.data);

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, badge, tag, vibrate } = event.data;

    const notificationOptions = {
      body,
      icon: icon || '/favicon.ico',
      badge: badge || '/favicon.ico',
      tag: tag || 'appointment-notification',
      requireInteraction: true,
      silent: false,
      vibrate: vibrate || [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Ver Reserva'
        },
        {
          action: 'close',
          title: 'Dispensar'
        }
      ],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: tag
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  }
});

// Tratar cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Se já existe uma janela aberta, focar nela
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Caso contrário, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow('/admin');
        }
      })
    );
  }
});

// Tratar push notifications (para futuras implementações de push server)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido');

  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Nova Reserva';
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      vibrate: data.vibrate || [200, 100, 200],
      tag: data.tag || 'push-notification',
      requireInteraction: true,
      silent: false
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Tratar fechamento de notificações
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notificação fechada:', event.notification.tag);
});

// Periodic Background Sync - Verificar novas reservas periodicamente
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic sync acionado:', event.tag);

  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(checkForNewAppointments());
  }
});

// Background Sync - Para quando o dispositivo volta online
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync acionado:', event.tag);

  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(checkForNewAppointments());
  }
});

// Função para verificar novas reservas
async function checkForNewAppointments() {
  try {
    console.log('[Service Worker] Verificando novas reservas...');

    // Obter última vez que verificamos
    const lastCheck = await getLastCheckTime();
    const now = Date.now();

    // Guardar tempo atual como último check
    await setLastCheckTime(now);

    // Notificar todos os clientes ativos para verificarem
    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window'
    });

    clients.forEach(client => {
      client.postMessage({
        type: 'CHECK_NEW_APPOINTMENTS',
        lastCheck
      });
    });

    return true;
  } catch (error) {
    console.error('[Service Worker] Erro ao verificar reservas:', error);
    return false;
  }
}

// Helpers para IndexedDB (armazenar último check)
async function getLastCheckTime() {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('lastCheckTime');

      request.onsuccess = () => {
        resolve(request.result?.value || 0);
      };

      request.onerror = () => {
        resolve(0);
      };
    });
  } catch {
    return 0;
  }
}

async function setLastCheckTime(time) {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key: 'lastCheckTime', value: time });

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BarberBookingDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}
