import React from 'react';
import BarbersManager from './BarbersManager';

interface BarbersAdminPageProps {
  onBarbersChange?: () => void;
}

const BarbersAdminPage: React.FC<BarbersAdminPageProps> = ({ onBarbersChange }) => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Funcionários</h2>
        <p className="text-gray-600">Adicione, edite e gerencie os funcionários</p>
      </div>

      <BarbersManager onBarbersChange={onBarbersChange} />
    </div>
  );
};

export default BarbersAdminPage;
