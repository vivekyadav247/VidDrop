import { useState, useCallback } from 'react';

const HISTORY_KEY = 'qd_history';
const MAX_HISTORY = 20;

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [history, setHistory] = useState(loadFromStorage);

  const saveItem = useCallback((item) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.id !== item.id);
      const next = [item, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteItem = useCallback((id) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return { history, saveItem, deleteItem, clearHistory };
}
