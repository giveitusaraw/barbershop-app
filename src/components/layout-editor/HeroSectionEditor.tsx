import React from 'react';

interface HeroSectionEditorProps {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  onChange: (field: string, value: string) => void;
}

const HeroSectionEditor: React.FC<HeroSectionEditorProps> = ({
  title,
  subtitle,
  description,
  buttonText,
  onChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título Principal
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChange('hero_title', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          placeholder="Ex: Barber"
          maxLength={50}
        />
        <p className="text-xs text-gray-500 mt-1">{title.length}/50 caracteres</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtítulo <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => onChange('hero_subtitle', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          placeholder="Ex: Barbearia Premium"
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">{subtitle.length}/100 caracteres</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange('hero_description', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          placeholder="Ex: Onde o estilo encontra a perfeição..."
          rows={3}
          maxLength={200}
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/200 caracteres</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto do Botão
        </label>
        <input
          type="text"
          value={buttonText}
          onChange={(e) => onChange('hero_button_text', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          placeholder="Ex: Reservar Agora"
          maxLength={30}
        />
        <p className="text-xs text-gray-500 mt-1">{buttonText.length}/30 caracteres</p>
      </div>
    </div>
  );
};

export default HeroSectionEditor;
