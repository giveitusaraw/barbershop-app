import React from 'react';
import { Clock, Euro } from 'lucide-react';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onSelect: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, selected, onSelect }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selected ? 'ring-2' : ''
      }`}
      style={selected ? {
        backgroundColor: 'var(--color-primary-lighter)',
        borderColor: 'var(--color-primary)'
      } : {}}
      onClick={() => onSelect(service)}
    >
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{service.name}</h3>
      <p className="text-gray-600 mb-4 whitespace-pre-line">{service.description}</p>

      <div className="flex justify-between items-center">
        <div className="flex items-center font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
          <Euro className="h-4 w-4 mr-1" />
          <span>{service.price}</span>
        </div>
        <div className="flex items-center text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm">{service.duration} min</span>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;