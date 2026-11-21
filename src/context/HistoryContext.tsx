import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserActionHistoryItem } from '../types';
import { useAuth } from './AuthContext';

interface HistoryContextType {
  historyItems: UserActionHistoryItem[];
  isLoadingHistory: boolean;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  addHistoryItem: (item: Omit<UserActionHistoryItem, 'id' | 'userId' | 'createdAt'>) => Promise<UserActionHistoryItem | null>;
  deleteHistoryItem: (id: string) => Promise<boolean>;
  clearAllHistory: () => Promise<boolean>;
  refreshHistory: () => Promise<void>;
  loadScriptToEditor: (text: string, voiceId?: string) => void;
  registerScriptLoader: (loader: (text: string, voiceId?: string) => void) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [historyItems, setHistoryItems] = useState<UserActionHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [scriptLoader, setScriptLoader] = useState<((text: string, voiceId?: string) => void) | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setHistoryItems([]);
      return;
    }
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setHistoryItems(data.history);
        }
      }
    } catch (err) {
      console.error('Failed to load user history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addHistoryItem = async (
    itemData: Omit<UserActionHistoryItem, 'id' | 'userId' | 'createdAt'>
  ): Promise<UserActionHistoryItem | null> => {
    if (!token || !isAuthenticated) return null;
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) {
        throw new Error('Failed to record history item');
      }
      const data = await res.json();
      if (data.item) {
        setHistoryItems((prev) => [data.item, ...prev]);
        return data.item;
      }
      return null;
    } catch (err) {
      console.error('Failed to save history item:', err);
      return null;
    }
  };

  const deleteHistoryItem = async (id: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setHistoryItems((prev) => prev.filter((item) => item.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete history item:', err);
      return false;
    }
  };

  const clearAllHistory = async (): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setHistoryItems([]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to clear history:', err);
      return false;
    }
  };

  const registerScriptLoader = (loader: (text: string, voiceId?: string) => void) => {
    setScriptLoader(() => loader);
  };

  const loadScriptToEditor = (text: string, voiceId?: string) => {
    if (scriptLoader) {
      scriptLoader(text, voiceId);
    }
  };

  return (
    <HistoryContext.Provider
      value={{
        historyItems,
        isLoadingHistory,
        isHistoryModalOpen,
        setIsHistoryModalOpen,
        addHistoryItem,
        deleteHistoryItem,
        clearAllHistory,
        refreshHistory: fetchHistory,
        loadScriptToEditor,
        registerScriptLoader,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
