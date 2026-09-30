import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatDateBR } from '../lib/dateUtils';
import { Reservation } from '../types';

interface ConflictAlertProps {
  conflictingReservation?: Reservation;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({ conflictingReservation }) => {
  return (
    <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-3 text-sm animate-fadeIn">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-amber-950">
          Esta acomodação já possui uma reserva neste período.
        </div>
        {conflictingReservation && (
          <div className="mt-1 text-xs text-amber-800">
            Reserva existente: <span className="font-medium">{conflictingReservation.guest_name}</span> (
            {formatDateBR(conflictingReservation.check_in)} até {formatDateBR(conflictingReservation.check_out)})
          </div>
        )}
        <p className="mt-1 text-xs text-amber-700">
          Por favor, selecione outro chalé disponível ou altere as datas da reserva.
        </p>
      </div>
    </div>
  );
};
