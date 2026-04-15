import React, { useState } from 'react';
import { isValidHexColor } from '../../lib/themeUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ThemeColorsEditorProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pageBgColor: string;
  servicesSectionBgColor: string;
  contactSectionBgColor: string;
  cardBgColor: string;
  textHeadingColor: string;
  textBodyColor: string;
  onChange: (field: string, value: string) => void;
}

interface ColorFieldConfig {
  field: string;
  value: string;
  label: string;
  description: string;
  defaultColor: string;
  examples: string[];
}

interface ColorGroupConfig {
  title: string;
  fields: ColorFieldConfig[];
}

const ThemeColorsEditor: React.FC<ThemeColorsEditorProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
  pageBgColor,
  servicesSectionBgColor,
  contactSectionBgColor,
  cardBgColor,
  textHeadingColor,
  textBodyColor,
  onChange
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    brand: true,
    backgrounds: false,
    text: false,
  });

  const colorGroups: ColorGroupConfig[] = [
    {
      title: 'Cores da Marca',
      fields: [
        {
          field: 'primary_color',
          value: primaryColor,
          label: 'Cor Primária',
          description: 'Usada em botões principais, ícones e destaques',
          defaultColor: '#FACC15',
          examples: ['Botões de ação', 'Ícones das características', 'Hover effects']
        },
        {
          field: 'secondary_color',
          value: secondaryColor,
          label: 'Cor Secundária',
          description: 'Usada como cor de texto em botões e contraste',
          defaultColor: '#111827',
          examples: ['Texto nos botões', 'Ícones em fundos primários']
        },
        {
          field: 'accent_color',
          value: accentColor,
          label: 'Cor de Acento',
          description: 'Usada em preços, links e elementos de destaque secundário',
          defaultColor: '#F59E0B',
          examples: ['Preços dos serviços', 'Elementos secundários']
        }
      ]
    },
    {
      title: 'Fundos e Cartões',
      fields: [
        {
          field: 'page_bg_color',
          value: pageBgColor,
          label: 'Fundo Geral do Site',
          description: 'Cor de fundo principal de toda a página',
          defaultColor: '#F9FAFB',
          examples: ['Fundo da página', 'Área entre secções']
        },
        {
          field: 'services_section_bg_color',
          value: servicesSectionBgColor,
          label: 'Fundo da Secção de Serviços',
          description: 'Cor de fundo da secção que mostra os serviços',
          defaultColor: '#F3F4F6',
          examples: ['Secção de serviços em destaque']
        },
        {
          field: 'contact_section_bg_color',
          value: contactSectionBgColor,
          label: 'Fundo da Secção de Contacto',
          description: 'Cor de fundo da secção de contacto no rodapé',
          defaultColor: '#111827',
          examples: ['Secção de contacto', 'Localização e horários']
        },
        {
          field: 'card_bg_color',
          value: cardBgColor,
          label: 'Fundo dos Cartões',
          description: 'Cor de fundo dos cartões de funcionalidades e serviços',
          defaultColor: '#FFFFFF',
          examples: ['Cartões de funcionalidades', 'Cartões de serviços']
        }
      ]
    },
    {
      title: 'Cores de Texto',
      fields: [
        {
          field: 'text_heading_color',
          value: textHeadingColor,
          label: 'Cor dos Títulos',
          description: 'Cor dos títulos e cabeçalhos das secções',
          defaultColor: '#111827',
          examples: ['Títulos das secções', 'Nomes dos serviços', 'Títulos dos cartões']
        },
        {
          field: 'text_body_color',
          value: textBodyColor,
          label: 'Cor do Texto de Corpo',
          description: 'Cor do texto de descrições e parágrafos',
          defaultColor: '#4B5563',
          examples: ['Descrições das funcionalidades', 'Texto explicativo', 'Duração dos serviços']
        }
      ]
    }
  ];

  const groupKeys = ['brand', 'backgrounds', 'text'];

  const handleColorChange = (field: string, value: string) => {
    if (value.startsWith('#')) {
      onChange(field, value.toUpperCase());
    } else {
      onChange(field, '#' + value.toUpperCase());
    }
  };

  const handleReset = (field: string, defaultColor: string) => {
    onChange(field, defaultColor);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Escolha cores que combinem bem e mantenham boa legibilidade.
          As cores serão aplicadas automaticamente em toda a homepage.
        </p>
      </div>

      {colorGroups.map((group, groupIndex) => {
        const key = groupKeys[groupIndex];
        const isExpanded = expandedGroups[key];
        return (
          <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup(key)}
              className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <span className="font-semibold text-gray-900">{group.title}</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {isExpanded && (
              <div className="p-5 space-y-5 bg-white">
                {group.fields.map((colorField) => (
                  <div key={colorField.field} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{colorField.label}</h4>
                        <p className="text-sm text-gray-600">{colorField.description}</p>
                      </div>
                      <button
                        onClick={() => handleReset(colorField.field, colorField.defaultColor)}
                        className="text-xs text-gray-500 hover:text-gray-700 underline ml-4 shrink-0"
                      >
                        Restaurar padrão
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <input
                        type="color"
                        value={colorField.value}
                        onChange={(e) => handleColorChange(colorField.field, e.target.value)}
                        className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300"
                      />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código da Cor
                        </label>
                        <input
                          type="text"
                          value={colorField.value}
                          onChange={(e) => handleColorChange(colorField.field, e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-mono ${
                            isValidHexColor(colorField.value) ? 'border-gray-300' : 'border-red-300'
                          }`}
                          placeholder={colorField.defaultColor}
                          maxLength={7}
                        />
                        {!isValidHexColor(colorField.value) && (
                          <p className="text-xs text-red-600 mt-1">
                            Formato inválido. Use #RRGGBB (ex: #FACC15)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Onde é usada:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {colorField.examples.map((example, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-4">Preview das Cores</h4>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Cores da Marca</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { color: primaryColor, label: 'Primária' },
                { color: secondaryColor, label: 'Secundária' },
                { color: accentColor, label: 'Acento' },
              ].map(({ color, label }) => (
                <div key={label} className="text-center">
                  <div className="h-12 rounded-lg mb-1 shadow-sm border border-gray-200" style={{ backgroundColor: color }}></div>
                  <p className="text-xs text-gray-600">{label}</p>
                  <p className="text-xs font-mono text-gray-400">{color}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Fundos</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { color: pageBgColor, label: 'Página' },
                { color: servicesSectionBgColor, label: 'Serviços' },
                { color: contactSectionBgColor, label: 'Contacto' },
                { color: cardBgColor, label: 'Cartões' },
              ].map(({ color, label }) => (
                <div key={label} className="text-center">
                  <div className="h-12 rounded-lg mb-1 shadow-sm border border-gray-200" style={{ backgroundColor: color }}></div>
                  <p className="text-xs text-gray-600">{label}</p>
                  <p className="text-xs font-mono text-gray-400">{color}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Texto</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { color: textHeadingColor, label: 'Títulos' },
                { color: textBodyColor, label: 'Corpo' },
              ].map(({ color, label }) => (
                <div key={label} className="text-center">
                  <div className="h-12 rounded-lg mb-1 shadow-sm border border-gray-200 flex items-center justify-center" style={{ backgroundColor: '#fff' }}>
                    <span className="text-sm font-semibold" style={{ color }}>Aa</span>
                  </div>
                  <p className="text-xs text-gray-600">{label}</p>
                  <p className="text-xs font-mono text-gray-400">{color}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeColorsEditor;
