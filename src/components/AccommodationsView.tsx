import React, { useState } from 'react';
import {
  Bed,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Layers,
  Info,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  ListOrdered,
  GripVertical,
} from 'lucide-react';
import { usePms } from '../context/PmsContext';
import { Accommodation } from '../types';
import { getTodaySaoPaulo } from '../lib/dateUtils';

export const AccommodationsView: React.FC = () => {
  const {
    accommodations,
    reservations,
    createAccommodation,
    batchCreateAccommodations,
    updateAccommodation,
    moveAccommodation,
    reorderAccommodation,
    deleteAccommodation,
    openNewReservationModal,
  } = usePms();

  const today = getTodaySaoPaulo();

  // Modals state
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Accommodation | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedAccommodationId, setDraggedAccommodationId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  // Single Form State
  const [singleName, setSingleName] = useState('');
  const [singleType, setSingleType] = useState('');
  const [singleActive, setSingleActive] = useState(true);

  // Batch Form State
  const [batchBaseName, setBatchBaseName] = useState('');
  const [batchType, setBatchType] = useState('');
  const [batchCount, setBatchCount] = useState(2);

  const [formError, setFormError] = useState<string | null>(null);

  // Open single modal for creation
  const handleOpenCreateSingle = () => {
    setEditingAcc(null);
    setSingleName('');
    setSingleType('Chalé Casal');
    setSingleActive(true);
    setFormError(null);
    setIsSingleModalOpen(true);
  };

  // Open single modal for edit
  const handleOpenEdit = (acc: Accommodation) => {
    setEditingAcc(acc);
    setSingleName(acc.nome);
    setSingleType(acc.tipo);
    setSingleActive(acc.ativo);
    setFormError(null);
    setIsSingleModalOpen(true);
  };

  // Open batch modal
  const handleOpenBatch = () => {
    setBatchBaseName('');
    setBatchType('');
    setBatchCount(2);
    setFormError(null);
    setIsBatchModalOpen(true);
  };

  // Submit Single Form
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!singleName.trim()) {
      setFormError('Informe o nome da acomodação (ex: Chalé Casal 03).');
      return;
    }

    if (editingAcc) {
      updateAccommodation(editingAcc.id, {
        nome: singleName.trim(),
        tipo: singleType.trim() || 'Chalé',
        ativo: singleActive,
      });
    } else {
      createAccommodation({
        nome: singleName.trim(),
        tipo: singleType.trim() || 'Chalé',
        ativo: singleActive,
      });
    }

    setIsSingleModalOpen(false);
  };

  // Submit Batch Form
  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!batchBaseName.trim()) {
      setFormError('Informe o nome base das unidades (ex: Chalé Vista Mar).');
      return;
    }

    if (batchCount < 1 || batchCount > 20) {
      setFormError('A quantidade deve ser entre 1 e 20 unidades.');
      return;
    }

    batchCreateAccommodations(
      batchBaseName.trim(),
      batchType.trim() || batchBaseName.trim(),
      batchCount
    );

    setIsBatchModalOpen(false);
  };

  // Delete handler with confirmation
  const handleDelete = (acc: Accommodation) => {
    const confirm = window.confirm(
      `Deseja realmente excluir a acomodação "${acc.nome}"?\nEsta ação não poderá ser desfeita.`
    );
    if (!confirm) return;

    const res = deleteAccommodation(acc.id);
    if (!res.success) {
      alert(res.error);
    }
  };

  // Distinct types list for autocomplete/quick selection
  const existingTypes = Array.from(new Set(accommodations.map((a) => a.tipo).filter(Boolean)));

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Acomodações & Chalés</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Cadastre, edite e gerencie individualmente as unidades e chalés da Pousada Paraíso
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setIsReordering((current) => !current)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
              isReordering
                ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
            }`}
            title="Alterar a ordem exibida no mapa de reservas"
          >
            <ListOrdered className="w-4 h-4" />
            <span>{isReordering ? 'Concluir ordem' : 'Ordenar chalés'}</span>
          </button>

          <button
            onClick={handleOpenBatch}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            title="Criar várias unidades numeradas de uma vez"
          >
            <Layers className="w-4 h-4 text-stone-600" />
            <span>Gerar em Lote</span>
          </button>

          <button
            onClick={handleOpenCreateSingle}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Acomodação</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex items-center gap-4 text-xs text-stone-600 px-1">
        <span>
          Total:{' '}
          <strong className="text-stone-900 font-semibold">{accommodations.length}</strong>{' '}
          unidades
        </span>
        <span>·</span>
        <span>
          Ativas:{' '}
          <strong className="text-emerald-800 font-semibold">
            {accommodations.filter((a) => a.ativo).length}
          </strong>
        </span>
        <span>·</span>
        <span>
          Categorias:{' '}
          <strong className="text-stone-900 font-semibold">{existingTypes.length}</strong>
        </span>
      </div>

      {isReordering && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-xs text-emerald-950">
          Arraste os chalés pela alça para definir a ordem. No celular, você também pode usar as setas. A alteração é salva automaticamente e vale para o mapa de reservas.
        </div>
      )}

      {/* Accommodations Grid */}
      <div className={isReordering ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
        {accommodations.map((acc) => {
          // Check if occupied today
          const occupiedToday = reservations.some(
            (r) =>
              r.accommodation_id === acc.id &&
              r.status !== 'Cancelada' &&
              r.check_in <= today &&
              r.check_out > today
          );

          // Total reservations
          const totalBookings = reservations.filter(
            (r) => r.accommodation_id === acc.id && r.status !== 'Cancelada'
          ).length;

          const accommodationIndex = accommodations.findIndex((item) => item.id === acc.id);

          if (isReordering) {
            const isFirst = accommodationIndex === 0;
            const isLast = accommodationIndex === accommodations.length - 1;

            return (
              <div
                key={acc.id}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', acc.id);
                  setDraggedAccommodationId(acc.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDragTargetId(acc.id);
                }}
                onDragLeave={() => setDragTargetId((current) => current === acc.id ? null : current)}
                onDrop={(event) => {
                  event.preventDefault();
                  const draggedId = draggedAccommodationId ?? event.dataTransfer.getData('text/plain');
                  if (draggedId) reorderAccommodation(draggedId, acc.id);
                  setDraggedAccommodationId(null);
                  setDragTargetId(null);
                }}
                onDragEnd={() => {
                  setDraggedAccommodationId(null);
                  setDragTargetId(null);
                }}
                className={`bg-white rounded-2xl border shadow-xs p-3 flex items-center gap-3 transition ${
                  dragTargetId === acc.id && draggedAccommodationId !== acc.id
                    ? 'border-emerald-500 ring-2 ring-emerald-200'
                    : 'border-stone-200'
                } ${draggedAccommodationId === acc.id ? 'opacity-40' : ''} ${
                  acc.ativo ? '' : 'opacity-60 bg-stone-50'
                }`}
              >
                <span
                  draggable
                  className="shrink-0 cursor-grab active:cursor-grabbing"
                  title="Arraste para mudar a posição"
                  aria-label={`Arrastar ${acc.nome}`}
                >
                  <GripVertical className="w-5 h-5 text-stone-400" aria-hidden="true" />
                </span>
                <span className="w-7 text-center text-xs font-bold tabular-nums text-stone-400">
                  {accommodationIndex + 1}
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 shrink-0">
                  <Bed className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-stone-900 truncate">{acc.nome}</div>
                  <div className="text-xs text-stone-500 truncate">{acc.tipo}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveAccommodation(acc.id, 'top')}
                    disabled={isFirst}
                    className="p-2 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg disabled:opacity-25 disabled:pointer-events-none"
                    title="Mover para o início"
                    aria-label={`Mover ${acc.nome} para o início`}
                  >
                    <ChevronsUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveAccommodation(acc.id, 'up')}
                    disabled={isFirst}
                    className="p-2 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg disabled:opacity-25 disabled:pointer-events-none"
                    title="Subir uma posição"
                    aria-label={`Subir ${acc.nome} uma posição`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveAccommodation(acc.id, 'down')}
                    disabled={isLast}
                    className="p-2 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg disabled:opacity-25 disabled:pointer-events-none"
                    title="Descer uma posição"
                    aria-label={`Descer ${acc.nome} uma posição`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveAccommodation(acc.id, 'bottom')}
                    disabled={isLast}
                    className="p-2 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg disabled:opacity-25 disabled:pointer-events-none"
                    title="Mover para o fim"
                    aria-label={`Mover ${acc.nome} para o fim`}
                  >
                    <ChevronsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={acc.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs p-4 flex flex-col justify-between ${
                acc.ativo ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl ${
                        acc.ativo ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-stone-900 text-sm">{acc.nome}</h2>
                      <span className="text-xs text-stone-500">{acc.tipo}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
                      acc.ativo
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    {acc.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Status Hoje */}
                <div className="mt-4 p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Situação hoje:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      occupiedToday ? 'text-amber-800' : 'text-emerald-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        occupiedToday ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}
                    />
                    {occupiedToday ? 'Ocupado' : 'Livre'}
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
                  <span>{totalBookings} reservas vinculadas</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() =>
                    openNewReservationModal({
                      accommodation_id: acc.id,
                      check_in: today,
                    })
                  }
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Reservar</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                    title="Editar acomodação"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(acc)}
                    className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                    title="Excluir acomodação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Single Accommodation (Create / Edit) */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingAcc ? 'Editar Acomodação' : 'Nova Acomodação'}
              </h3>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSingle} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Nome da Unidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="Ex: Chalé Casal 03 ou Suíte Master"
                  className="w-full px-3.5 py-2.5 text-stone-900 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Tipo / Categoria
                </label>
                <input
                  type="text"
                  list="categories-list"
                  value={singleType}
                  onChange={(e) => setSingleType(e.target.value)}
                  placeholder="Ex: Chalé Casal, Chalé Família..."
                  className="w-full px-3.5 py-2.5 text-stone-900 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
                <datalist id="categories-list">
                  {existingTypes.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={singleActive}
                    onChange={(e) => setSingleActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    Acomodação Ativa para Reservas
                  </span>
                </label>
                <p className="text-[11px] text-stone-500 mt-1 pl-6">
                  Se desativada, não aparecerá na lista de opções para novas reservas.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {editingAcc ? 'Salvar Alterações' : 'Criar Acomodação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Creation */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Gerar Unidades em Lote</h3>
                <p className="text-xs text-stone-500">
                  Cria rapidamente múltiplas unidades numeradas
                </p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBatch} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Nome Base da Acomodação <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchBaseName}
                  onChange={(e) => setBatchBaseName(e.target.value)}
                  placeholder="Ex: Chalé Luxo"
                  className="w-full px-3.5 py-2.5 text-stone-900 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Tipo / Categoria
                </label>
                <input
                  type="text"
                  list="categories-list-batch"
                  value={batchType}
                  onChange={(e) => setBatchType(e.target.value)}
                  placeholder="Ex: Chalé Luxo"
                  className="w-full px-3.5 py-2.5 text-stone-900 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                />
                <datalist id="categories-list-batch">
                  {existingTypes.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Quantidade de Unidades a Criar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-stone-900 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-bold tabular-nums"
                  required
                />
              </div>

              {/* Preview */}
              {batchBaseName && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="font-semibold text-stone-700 block mb-1">
                    Exemplo das unidades que serão criadas:
                  </span>
                  <div className="text-stone-600 space-y-0.5 font-mono text-[11px]">
                    <div>• {batchBaseName} 01</div>
                    {batchCount > 1 && <div>• {batchBaseName} 02</div>}
                    {batchCount > 2 && <div>• ... até {batchBaseName} {batchCount < 10 ? `0${batchCount}` : batchCount}</div>}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Gerar {batchCount} Unidades
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
