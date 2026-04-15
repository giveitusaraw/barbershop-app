import React from 'react';
import { Bell, BellOff, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationSettings: React.FC = () => {
  const { permissionGranted, requestPermission, notificationsEnabled, setNotificationsEnabled, isRealtimeConnected } = useNotifications();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-6 h-6 text-gray-700" />
        <h2 className="text-2xl font-bold text-gray-800">Notificações</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">Notificações do Browser</h3>
            <p className="text-sm text-gray-600">
              Receba alertas em tempo real quando houver novas reservas
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={notificationsEnabled && permissionGranted}
              onChange={(e) => {
                if (e.target.checked && !permissionGranted) {
                  requestPermission();
                } else {
                  setNotificationsEnabled(e.target.checked);
                }
              }}
              className="sr-only peer"
              disabled={!permissionGranted && !notificationsEnabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
          </label>
        </div>

        {!permissionGranted && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <BellOff className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Permissão de notificações não concedida
              </p>
              <p className="text-sm text-yellow-700 mb-3">
                Para receber notificações, é necessário conceder permissão ao browser.
              </p>
              <button
                onClick={requestPermission}
                className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors text-sm"
              >
                Conceder Permissão
              </button>
            </div>
          </div>
        )}

        {permissionGranted && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Bell className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Notificações ativas
              </p>
              <p className="text-sm text-green-700">
                Você receberá alertas para novas reservas dos funcionários que tem permissão para visualizar.
              </p>
            </div>
          </div>
        )}

        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          isRealtimeConnected
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          {isRealtimeConnected ? (
            <Wifi className="w-5 h-5 text-green-600 mt-0.5" />
          ) : (
            <WifiOff className="w-5 h-5 text-gray-600 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              isRealtimeConnected ? 'text-green-800' : 'text-gray-800'
            }`}>
              Conexão em Tempo Real: {isRealtimeConnected ? 'Conectado' : 'Desconectado'}
            </p>
            <p className={`text-sm ${
              isRealtimeConnected ? 'text-green-700' : 'text-gray-600'
            }`}>
              {isRealtimeConnected
                ? 'A subscrição ao sistema de notificações está ativa. Você receberá alertas de novas reservas.'
                : 'A subscrição está desativada. Ative as notificações para receber alertas em tempo real.'}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Como funcionam as notificações?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Você receberá uma notificação sempre que houver uma nova reserva</li>
            <li>• As notificações aparecem no canto do ecrã com som</li>
            <li>• Clique na notificação para focar na aplicação</li>
            <li>• As notificações funcionam apenas quando está logado</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
