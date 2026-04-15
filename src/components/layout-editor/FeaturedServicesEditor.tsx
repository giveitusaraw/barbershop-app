import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';
import { Service } from '../../lib/database';
import { db } from '../../lib/database';

interface FeaturedServicesEditorProps {
  selectedServiceIds: string[];
  onChange: (serviceIds: string[]) => void;
}

const FeaturedServicesEditor: React.FC<FeaturedServicesEditorProps> = ({
  selectedServiceIds,
  onChange
}) => {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const services = await db.getServices();
    setAllServices(services);
    setLoading(false);
  };

  const handleToggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      onChange(selectedServiceIds.filter(id => id !== serviceId));
    } else {
      if (selectedServiceIds.length < 6) {
        onChange([...selectedServiceIds, serviceId]);
      } else {
        alert('Pode selecionar no máximo 6 serviços em destaque.');
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...selectedServiceIds];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onChange(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedServiceIds.length - 1) return;
    const newOrder = [...selectedServiceIds];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onChange(newOrder);
  };

  const selectedServices = selectedServiceIds
    .map(id => allServices.find(s => s.id === id))
    .filter(s => s !== undefined) as Service[];

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        A carregar serviços...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Selecionar Serviços</h4>
        <p className="text-sm text-gray-600 mb-4">
          Escolha até 6 serviços para mostrar na homepage (mínimo 1)
        </p>

        <div className="grid grid-cols-1 gap-2">
          {allServices.map(service => {
            const isSelected = selectedServiceIds.includes(service.id);
            return (
              <button
                key={service.id}
                onClick={() => handleToggleService(service.id)}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-500">
                    €{service.price.toFixed(2)} • {service.duration} min
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-yellow-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedServices.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-2">Ordem de Exibição</h4>
          <p className="text-sm text-gray-600 mb-4">
            Use as setas para reordenar os serviços selecionados
          </p>

          <div className="space-y-2">
            {selectedServices.map((service, index) => (
              <div
                key={service.id}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`p-1 rounded ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === selectedServices.length - 1}
                    className={`p-1 rounded ${
                      index === selectedServices.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-500">
                    €{service.price.toFixed(2)} • {service.duration} min
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-500">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Os preços e durações são sempre atualizados automaticamente
          da gestão de serviços. Apenas a seleção e ordem são personalizáveis aqui.
        </p>
      </div>
    </div>
  );
};

export default FeaturedServicesEditor;
