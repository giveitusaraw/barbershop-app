import React from 'react';
import { Wrench } from 'lucide-react';

interface MaintenancePageProps {
  onNavigateToLogin: () => void;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ onNavigateToLogin }) => {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-8">
          <Wrench className="w-9 h-9 text-amber-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
          Website em Manutenção
        </h1>

        <p className="text-gray-400 text-base leading-relaxed mb-10">
          Estamos a realizar trabalhos de manutenção. O serviço ficará disponível brevemente.
          Agradecemos a sua compreensão.
        </p>

        <button
          onClick={onNavigateToLogin}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-4"
        >
          Acesso administrativo
        </button>
      </div>
    </div>
  );
};

export default MaintenancePage;
