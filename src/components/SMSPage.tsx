import React, { useState, useEffect, useRef } from 'react';
import { db, SMSTemplate, AppointmentWithDetails, Barber } from '../lib/database';
import { supabase } from '../lib/supabase';
import {
  MessageSquare,
  Send,
  Save,
  ChevronLeft,
  ChevronRight,
  Trash2,
  User,
  Phone,
  Clock,
  Calendar,
  Loader2,
  CalendarDays,
  Star,
} from 'lucide-react';

interface SMSPageProps {
  accountRole?: 'admin' | 'staff';
  barberIds?: string[];
}

function getMiniCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function SMSPage({ accountRole = 'admin', barberIds = [] }: SMSPageProps) {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [messageText, setMessageText] = useState('');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadData();

    const appointmentsSubscription = supabase
      .channel('appointments-sms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        loadAppointments();
      })
      .subscribe();

    return () => {
      appointmentsSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, selectedBarber]);

  async function loadData() {
    setLoading(true);
    try {
      const [barbersData, templatesData] = await Promise.all([
        db.getBarbers(),
        db.getSMSTemplates()
      ]);

      let filteredBarbers = barbersData;
      if (accountRole === 'staff' && barberIds.length > 0) {
        filteredBarbers = barbersData.filter(b => barberIds.includes(b.id));
      }

      setBarbers(filteredBarbers);
      setTemplates(templatesData);

      const defaultTemplate = templatesData.find(t => t.is_default);
      if (defaultTemplate) {
        setMessageText(defaultTemplate.message_text);
      }

      await loadAppointments();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointments() {
    try {
      const allAppointments = await db.getAppointments();
      const pad = (n: number) => String(n).padStart(2, '0');
      const selectedDateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;

      let filtered = allAppointments.filter(apt => {
        return (
          apt.status === 'confirmed' &&
          apt.customer_phone &&
          apt.customer_phone.trim() !== '' &&
          apt.appointment_date === selectedDateStr
        );
      });

      if (selectedBarber !== 'all') {
        filtered = filtered.filter(apt => apt.barber_id === selectedBarber);
      }

      if (accountRole === 'staff' && barberIds.length > 0) {
        filtered = filtered.filter(apt => barberIds.includes(apt.barber_id));
      }

      setAppointments(filtered.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)));
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }

  function selectDate(date: Date) {
    setSelectedDate(date);
    setSelectedAppointment(null);
  }

  function goToToday() {
    const today = new Date();
    setSelectedDate(today);
    setCalendarMonth({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedAppointment(null);
  }

  function prevMonth() {
    setCalendarMonth(prev => {
      const m = prev.month === 0 ? 11 : prev.month - 1;
      const y = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: y, month: m };
    });
  }

  function nextMonth() {
    setCalendarMonth(prev => {
      const m = prev.month === 11 ? 0 : prev.month + 1;
      const y = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: y, month: m };
    });
  }

  function formatSelectedDate(): string {
    const dayName = selectedDate.toLocaleDateString('pt-PT', { weekday: 'long' });
    const day = selectedDate.getDate();
    const month = selectedDate.toLocaleDateString('pt-PT', { month: 'long' });
    const year = selectedDate.getFullYear();
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${day} de ${month} de ${year}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatTime(timeStr: string): string {
    return timeStr.substring(0, 5);
  }

  function insertVariable(variable: string) {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = messageText.substring(0, start) + variable + messageText.substring(end);
    setMessageText(newText);
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variable.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  function replaceVariables(text: string, appointment: AppointmentWithDetails | null): string {
    if (!appointment) return text;
    let result = text;
    result = result.replace(/\{nome\}/g, appointment.customer_name);
    result = result.replace(/\{data\}/g, formatDate(appointment.appointment_date));
    result = result.replace(/\{hora\}/g, formatTime(appointment.appointment_time));
    return result;
  }

  function generateWhatsAppURL(): string {
    if (!selectedAppointment) return '#';
    const phone = selectedAppointment.customer_phone.replace(/\D/g, '');
    const message = replaceVariables(messageText, selectedAppointment);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  function generateSMSURL(): string {
    if (!selectedAppointment) return '#';
    const phone = selectedAppointment.customer_phone.replace(/\D/g, '');
    const message = replaceVariables(messageText, selectedAppointment);
    return `sms:${phone}?body=${encodeURIComponent(message)}`;
  }

  function isValidMessage(): boolean {
    return messageText.trim() !== '' && selectedAppointment !== null;
  }

  async function handleSaveTemplate() {
    if (!templateName.trim() || !messageText.trim()) {
      alert('Por favor, preencha o nome e a mensagem');
      return;
    }
    try {
      await db.saveSMSTemplate({ name: templateName.trim(), message_text: messageText });
      const updatedTemplates = await db.getSMSTemplates();
      setTemplates(updatedTemplates);
      setTemplateName('');
      setShowSaveModal(false);
      alert('Mensagem guardada com sucesso!');
    } catch (error: any) {
      console.error('Error saving template:', error);
      if (error.message?.includes('duplicate') || error.code === '23505') {
        alert('Já existe uma mensagem com este nome. Por favor, escolha outro nome.');
      } else {
        alert('Erro ao guardar mensagem. Tente novamente.');
      }
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Tem a certeza que deseja eliminar esta mensagem guardada?')) return;
    try {
      await db.deleteSMSTemplate(id);
      const updatedTemplates = await db.getSMSTemplates();
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Erro ao eliminar mensagem');
    }
  }

  async function handleToggleDefault(template: SMSTemplate) {
    const newDefault = template.is_default ? null : template.id;
    try {
      await db.setDefaultSMSTemplate(newDefault);
      const updatedTemplates = await db.getSMSTemplates();
      setTemplates(updatedTemplates);
      if (!template.is_default) {
        setMessageText(template.message_text);
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      alert('Erro ao definir mensagem predefinida');
    }
  }

  function loadTemplate(template: SMSTemplate) {
    setMessageText(template.message_text);
  }

  const today = new Date();
  const calendarDays = getMiniCalendarDays(calendarMonth.year, calendarMonth.month);
  const monthLabel = new Date(calendarMonth.year, calendarMonth.month, 1)
    .toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 flex-shrink-0" />
            Envio de SMS/WhatsApp
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Selecione uma reserva e envie mensagens personalizadas aos seus clientes
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Funcionário
          </label>
          <select
            value={selectedBarber}
            onChange={(e) => { setSelectedBarber(e.target.value); setSelectedAppointment(null); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          >
            <option value="all">Todos os Funcionários</option>
            {barbers.map(barber => (
              <option key={barber.id} value={barber.id}>{barber.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-gray-800 capitalize text-center truncate">
                    {monthLabel}
                  </span>
                  <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={goToToday}
                  className="px-2.5 py-1.5 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 flex-shrink-0"
                >
                  <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Hoje
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, today);
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => selectDate(date)}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-yellow-400 text-gray-900'
                          : isToday
                          ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-300'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4 gap-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">{formatSelectedDate()}</h2>
                <span className="text-sm text-gray-500 flex-shrink-0">
                  {appointments.length} {appointments.length === 1 ? 'reserva' : 'reservas'}
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {appointments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Não há reservas confirmadas neste dia</p>
                  </div>
                ) : (
                  appointments.map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAppointment?.id === apt.id
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{apt.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {formatTime(apt.appointment_time)}
                        </div>
                      </div>
                      <div className="mt-2 ml-7 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {apt.customer_phone}
                        </div>
                        <div className="text-gray-500">
                          {apt.service_name} • {apt.barber_name}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Compor Mensagem</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variáveis Disponíveis
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => insertVariable('{nome}')} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                      {'{nome}'}
                    </button>
                    <button onClick={() => insertVariable('{data}')} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                      {'{data}'}
                    </button>
                    <button onClick={() => insertVariable('{hora}')} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                      {'{hora}'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Escreva a sua mensagem aqui..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                    rows={6}
                  />
                  <div className="mt-1 text-xs text-gray-500 text-right">{messageText.length} caracteres</div>
                </div>

                {selectedAppointment && messageText && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pré-visualização</label>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {replaceVariables(messageText, selectedAppointment)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={!messageText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <a
                    href={isValidMessage() ? generateWhatsAppURL() : '#'}
                    onClick={(e) => { if (!isValidMessage()) { e.preventDefault(); alert('Por favor, selecione uma reserva e escreva uma mensagem'); } }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${isValidMessage() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    <Send className="w-4 h-4" />
                    Enviar via WhatsApp
                  </a>

                  <a
                    href={isValidMessage() ? generateSMSURL() : '#'}
                    onClick={(e) => { if (!isValidMessage()) { e.preventDefault(); alert('Por favor, selecione uma reserva e escreva uma mensagem'); } }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${isValidMessage() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Enviar via SMS
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Mensagens Guardadas</h2>
              <p className="text-xs text-gray-500 mb-4">
                A mensagem marcada com <Star className="w-3 h-3 inline text-yellow-500" /> é carregada automaticamente ao entrar nesta página.
              </p>

              {templates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Ainda não tem mensagens guardadas
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg transition-colors ${template.is_default ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {template.is_default && (
                              <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 fill-yellow-500" />
                            )}
                            <h3 className="font-medium text-gray-900 text-sm truncate">{template.name}</h3>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{template.message_text}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleDefault(template)}
                            title={template.is_default ? 'Remover predefinição' : 'Definir como predefinida'}
                            className={`p-1.5 rounded transition-colors ${template.is_default ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                          >
                            <Star className={`w-3.5 h-3.5 ${template.is_default ? 'fill-yellow-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => loadTemplate(template)}
                            className="px-2 py-1 text-xs bg-yellow-400 text-gray-900 rounded hover:bg-yellow-500 transition-colors"
                          >
                            Usar
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Guardar Mensagem</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Mensagem</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Confirmação de Reserva"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSaveModal(false); setTemplateName(''); }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
