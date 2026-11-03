import React from 'react';
import { User, AdminSettings, Transaction } from '../types';
import { AirtimeModal } from './AirtimeModal';
import { DataModal } from './DataModal';

export interface VtuTelecomModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  adminSettings?: AdminSettings;
  initialTab?: 'airtime' | 'data';
  onSuccess: (updatedUser: User, tx: Transaction) => void;
  onRequireAuth: () => void;
  onOpenDeposit?: () => void;
}

/**
 * VtuTelecomModal acts as the unified router delegating directly to
 * either the dedicated step-by-step AirtimeModal or DataModal.
 * Payment is strictly Direct Bank Transfer Only to the depository account,
 * with status remaining Pending until Super Admin verification and approval.
 */
export const VtuTelecomModal: React.FC<VtuTelecomModalProps> = ({
  isOpen,
  onClose,
  user,
  adminSettings,
  initialTab = 'data',
  onSuccess,
  onRequireAuth,
}) => {
  if (!isOpen) return null;

  if (initialTab === 'airtime') {
    return (
      <AirtimeModal
        isOpen={isOpen}
        onClose={onClose}
        user={user}
        adminSettings={adminSettings}
        onSuccess={onSuccess}
        onRequireAuth={onRequireAuth}
      />
    );
  }

  return (
    <DataModal
      isOpen={isOpen}
      onClose={onClose}
      user={user}
      adminSettings={adminSettings}
      onSuccess={onSuccess}
      onRequireAuth={onRequireAuth}
    />
  );
};
