import React from 'react';
import ServicesManager from './ServicesManager';

const ServicesAdminPage: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Serviços</h2>
        <p className="text-gray-600">Adicione, edite e gerencie os serviços</p>
      </div>

      <ServicesManager />
    </div>
  );
};

export default ServicesAdminPage;
