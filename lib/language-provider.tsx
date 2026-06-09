import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Language, getStoredLanguage, setStoredLanguage, t, TranslationKey } from "./i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "zh",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>("zh");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getStoredLanguage().then((lang) => {
      setLang(lang);
      setLoaded(true);
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    setStoredLanguage(lang);
  }, []);

  const translate = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return t(key, language, params);
    },
    [language]
  );

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
