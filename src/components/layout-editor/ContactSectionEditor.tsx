import React from 'react';

interface ContactSectionEditorProps {
  title: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  hoursWeekday: string;
  hoursWeekend: string;
  onChange: (field: string, value: string) => void;
}

const ContactSectionEditor: React.FC<ContactSectionEditorProps> = ({
  title,
  description,
  address,
  phone,
  email,
  hoursWeekday,
  hoursWeekend,
  onChange
}) => {
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const re = /^\+?[\d\s-()]+$/;
    return re.test(phone) || phone === '';
  };

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
              value={title}
              onChange={(e) => onChange('contact_section_title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Ex: Visite-nos"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/50 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Seção
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => onChange('contact_section_description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Ex: Localização conveniente e horários flexíveis"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/100 caracteres</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Morada
          </label>
          <textarea
            value={address}
            onChange={(e) => onChange('contact_address', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            placeholder="Rua da Barbearia, 123&#10;1000-001 Lisboa"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            {address.length}/200 caracteres • Use Enter para quebras de linha
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => onChange('contact_phone', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
              phone && !validatePhone(phone) ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="+351 210 123 456"
            maxLength={20}
          />
          {phone && !validatePhone(phone) && (
            <p className="text-xs text-red-600 mt-1">Formato de telefone inválido</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChange('contact_email', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
              email && !validateEmail(email) ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="info@barber.pt"
            maxLength={100}
          />
          {email && !validateEmail(email) && (
            <p className="text-xs text-red-600 mt-1">Formato de email inválido</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horários de Semana
          </label>
          <input
            type="text"
            value={hoursWeekday}
            onChange={(e) => onChange('hours_weekday', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            placeholder="Ex: Segunda a Sábado: 9h - 19h"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horários de Fim de Semana
          </label>
          <input
            type="text"
            value={hoursWeekend}
            onChange={(e) => onChange('hours_weekend', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            placeholder="Ex: Domingo: Fechado"
            maxLength={100}
          />
        </div>
      </div>
    </div>
  );
};

export default ContactSectionEditor;
