import React, { createContext, useContext, useState, useEffect } from 'react';

export const GEMINI_API_KEY_SESSION = 'exam_gemini_api_key_session';
export const GEMINI_API_KEY_ENCRYPTED = 'exam_gemini_api_key_encrypted';

const GeminiKeyContext = createContext(null);

export function GeminiKeyProvider({ children }) {
  const [apiKey, setApiKeyState] = useState(() => {
    if (typeof sessionStorage === 'undefined') return '';
    return sessionStorage.getItem(GEMINI_API_KEY_SESSION) || '';
  });

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (apiKey) sessionStorage.setItem(GEMINI_API_KEY_SESSION, apiKey);
    else sessionStorage.removeItem(GEMINI_API_KEY_SESSION);
  }, [apiKey]);

  const setApiKey = (value) => setApiKeyState(typeof value === 'function' ? value(apiKey) : value);

  const hasEncrypted = typeof localStorage !== 'undefined' && !!localStorage.getItem(GEMINI_API_KEY_ENCRYPTED);
  const needUnlock = hasEncrypted && !apiKey;

  const value = { apiKey, setApiKey, hasEncrypted, needUnlock };
  return (
    <GeminiKeyContext.Provider value={value}>
      {children}
    </GeminiKeyContext.Provider>
  );
}

export function useGeminiKey() {
  const ctx = useContext(GeminiKeyContext);
  return ctx;
}
