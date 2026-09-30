import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Phone,
  MapPin,
} from 'lucide-react';
import { usePms } from '../context/PmsContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, exportData, importData, resetData } = usePms();

  const [innName, setInnName] = useState(settings.inn_name);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [address, setAddress] = useState(settings.address);
  const [checkinTime, setCheckinTime] = useState(settings.default_checkin_time);
  const [checkoutTime, setCheckoutTime] = useState(settings.default_checkout_time);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      inn_name: innName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      address: address.trim(),
      default_checkin_time: checkinTime,
      default_checkout_time: checkoutTime,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importData(content);
        if (!res.success) {
          alert(res.error);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <h1 className="text-xl font-bold text-stone-900">Configurações da Pousada</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Ajuste as preferências gerais, horários operacionais e gerencie backups do sistema
        </p>
      </div>

      {/* Inn Profile Form */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h2 className="font-bold text-stone-900 text-sm">Dados da Pousada & Contato</h2>
          </div>
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvo com sucesso!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Nome da Pousada
              </label>
              <input
                type="text"
                value={innName}
                onChange={(e) => setInnName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Telefone Fixo
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                WhatsApp da Recepção
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Endereço / Cidade
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>
          </div>

          {/* Horários Padrão */}
          <div className="pt-2 border-t border-stone-100">
            <span className="block text-xs font-semibold text-stone-700 uppercase mb-2">
              Horários Padrão de Diária
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Horário de Check-in</label>
                <div className="relative">
                  <input
                    type="time"
                    value={checkinTime}
                    onChange={(e) => setCheckinTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold"
                  />
                  <Clock className="w-4 h-4 text-stone-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-500 mb-1">Horário de Check-out</label>
                <div className="relative">
                  <input
                    type="time"
                    value={checkoutTime}
                    onChange={(e) => setCheckoutTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold"
                  />
                  <Clock className="w-4 h-4 text-stone-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Restauração */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50/70">
          <h2 className="font-bold text-stone-900 text-sm">Backup & Restauração de Dados</h2>
          <p className="text-xs text-stone-500">
            Mantenha cópias de segurança do mapa de reservas e acomodações
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exportar */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-col justify-between">
              <div>
                <span className="font-bold text-stone-900 text-sm block">Exportar Backup</span>
                <p className="text-xs text-stone-500 mt-1">
                  Baixe um arquivo JSON contendo todas as acomodações e reservas cadastradas.
                </p>
              </div>
              <button
                type="button"
                onClick={exportData}
                className="mt-4 px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Download className="w-4 h-4 text-stone-600" />
                <span>Exportar Dados (JSON)</span>
              </button>
            </div>

            {/* Importar */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 flex flex-col justify-between">
              <div>
                <span className="font-bold text-stone-900 text-sm block">Restaurar de Arquivo</span>
                <p className="text-xs text-stone-500 mt-1">
                  Selecione um arquivo de backup JSON previamente exportado.
                </p>
              </div>
              <label className="mt-4 px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer">
                <Upload className="w-4 h-4 text-stone-600" />
                <span>Importar Arquivo JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-stone-800 block">
                Restaurar Dados Padrão de Demonstração
              </span>
              <span className="text-[11px] text-stone-500">
                Restaura os chalés de exemplo e reservas em torno da data de hoje.
              </span>
            </div>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition flex items-center gap-1 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetData();
                    setConfirmReset(false);
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Confirmar Restauração
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
