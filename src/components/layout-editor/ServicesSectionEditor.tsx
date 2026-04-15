import React from 'react';

interface ServicesSectionEditorProps {
  title: string;
  description: string;
  onChange: (field: string, value: string) => void;
}

const ServicesSectionEditor: React.FC<ServicesSectionEditorProps> = ({
  title,
  description,
  onChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título da Seção
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChange('services_section_title', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          placeholder="Ex: Nossos Serviços"
          maxLength={50}
        />
        <p className="text-xs text-gray-500 mt-1">{title.length}/50 caracteres</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição da Seção
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange('services_section_description', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          placeholder="Ex: Serviços profissionais para o homem moderno"
          rows={2}
          maxLength={150}
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/150 caracteres</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Os serviços exibidos são configurados na próxima aba.
          Aqui você define apenas o título e descrição da seção.
        </p>
      </div>
    </div>
  );
};

export default ServicesSectionEditor;
