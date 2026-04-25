import React, { createContext, useContext, useState } from 'react';
import { useFinance, FinanceState } from './useFinance';
import { Transaction } from '../lib/data';

interface FinanceContextValue extends FinanceState {
  openAdd: () => void;
  openEdit: (t: Transaction) => void;
  modalVisible: boolean;
  editItem: Transaction | null;
  closeModal: () => void;
}

export const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const finance = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem]         = useState<Transaction | null>(null);

  const openAdd  = () => { setEditItem(null); setModalVisible(true); };
  const openEdit = (t: Transaction) => { setEditItem(t); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); setEditItem(null); };

  return (
    <FinanceContext.Provider value={{ ...finance, openAdd, openEdit, modalVisible, editItem, closeModal }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceContext(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinanceContext must be used within FinanceProvider');
  return ctx;
}

export { useFinanceContext as useFinance };
