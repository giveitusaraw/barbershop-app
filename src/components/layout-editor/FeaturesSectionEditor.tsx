import React from 'react';
import {
  Users, Scissors, Star, Award, Clock, Shield, Heart,
  Sparkles, Trophy, CheckCircle, ThumbsUp, Smile, Zap,
  Target, Palette, Briefcase, Gift, Crown, BadgeCheck
} from 'lucide-react';

interface FeaturesSectionEditorProps {
  whyChooseTitle: string;
  whyChooseDescription: string;
  feature1Title: string;
  feature1Description: string;
  feature1Icon: string;
  feature2Title: string;
  feature2Description: string;
  feature2Icon: string;
  feature3Title: string;
  feature3Description: string;
  feature3Icon: string;
  onChange: (field: string, value: string) => void;
}

const ICON_OPTIONS = [
  { name: 'Users', icon: Users, label: 'Pessoas' },
  { name: 'Scissors', icon: Scissors, label: 'Tesoura' },
  { name: 'Star', icon: Star, label: 'Estrela' },
  { name: 'Award', icon: Award, label: 'Prêmio' },
  { name: 'Clock', icon: Clock, label: 'Relógio' },
  { name: 'Shield', icon: Shield, label: 'Escudo' },
  { name: 'Heart', icon: Heart, label: 'Coração' },
  { name: 'Sparkles', icon: Sparkles, label: 'Brilhos' },
  { name: 'Trophy', icon: Trophy, label: 'Troféu' },
  { name: 'CheckCircle', icon: CheckCircle, label: 'Check' },
  { name: 'ThumbsUp', icon: ThumbsUp, label: 'Positivo' },
  { name: 'Smile', icon: Smile, label: 'Sorriso' },
  { name: 'Zap', icon: Zap, label: 'Raio' },
  { name: 'Target', icon: Target, label: 'Alvo' },
  { name: 'Palette', icon: Palette, label: 'Paleta' },
  { name: 'Briefcase', icon: Briefcase, label: 'Maleta' },
  { name: 'Gift', icon: Gift, label: 'Presente' },
  { name: 'Crown', icon: Crown, label: 'Coroa' },
  { name: 'BadgeCheck', icon: BadgeCheck, label: 'Verificado' }
];

const FeaturesSectionEditor: React.FC<FeaturesSectionEditorProps> = ({
  whyChooseTitle,
  whyChooseDescription,
  feature1Title,
  feature1Description,
  feature1Icon,
  feature2Title,
  feature2Description,
  feature2Icon,
  feature3Title,
  feature3Description,
  feature3Icon,
  onChange
}) => {
  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.name === iconName);
    return iconOption?.icon || Users;
  };

  const features = [
    {
      iconName: feature1Icon,
      iconField: 'feature_1_icon',
      titleField: 'feature_1_title',
      titleValue: feature1Title,
      descField: 'feature_1_description',
      descValue: feature1Description,
      label: 'Característica 1'
    },
    {
      iconName: feature2Icon,
      iconField: 'feature_2_icon',
      titleField: 'feature_2_title',
      titleValue: feature2Title,
      descField: 'feature_2_description',
      descValue: feature2Description,
      label: 'Característica 2'
    },
    {
      iconName: feature3Icon,
      iconField: 'feature_3_icon',
      titleField: 'feature_3_title',
      titleValue: feature3Title,
      descField: 'feature_3_description',
      descValue: feature3Description,
      label: 'Característica 3'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título da Seção
            </label>
            <input
              type="text"
              value={whyChooseTitle}
              onChange={(e) => onChange('why_choose_title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Ex: Por que escolher a Barber?"
              maxLength={80}
            />
            <p className="text-xs text-gray-500 mt-1">{whyChooseTitle.length}/80 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Seção
            </label>
            <textarea
              value={whyChooseDescription}
              onChange={(e) => onChange('why_choose_description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Ex: Combinamos tradição e modernidade..."
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{whyChooseDescription.length}/200 caracteres</p>
          </div>
        </div>
      </div>

      {features.map((feature, index) => {
        const IconComponent = getIconComponent(feature.iconName);
        return (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-yellow-100 rounded-full p-2">
                <IconComponent className="h-5 w-5 text-yellow-600" />
              </div>
              <h4 className="font-medium text-gray-900">{feature.label}</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícone
                </label>
                <select
                  value={feature.iconName}
                  onChange={(e) => onChange(feature.iconField, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  {ICON_OPTIONS.map(option => {
                    const OptionIcon = option.icon;
                    return (
                      <option key={option.name} value={option.name}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
                <div className="mt-2 p-2 bg-white rounded border border-gray-200 flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Pré-visualização do ícone</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={feature.titleValue}
                  onChange={(e) => onChange(feature.titleField, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Ex: Profissionais Experientes"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">{feature.titleValue.length}/50 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={feature.descValue}
                  onChange={(e) => onChange(feature.descField, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Descreva esta característica..."
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{feature.descValue.length}/200 caracteres</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeaturesSectionEditor;
