"use client";

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useMemo } from 'react';
import { languageToLocale } from '../i18n/config';

// Static imports to avoid webpack chunk loading issues
import frMessages from '../i18n/locales/fr.json';
import enMessages from '../i18n/locales/en.json';
import kmMessages from '../i18n/locales/km.json';

interface I18nProviderProps {
  children: ReactNode;
  selectedLanguage: 'FR' | 'EN' | 'KH';
}

const messageMap = {
  'fr': frMessages,
  'en': enMessages,
  'km': kmMessages
};

export function I18nProvider({ children, selectedLanguage }: I18nProviderProps) {
  const locale = languageToLocale[selectedLanguage] || 'fr';
  
  const messages = useMemo(() => {
    return messageMap[locale as keyof typeof messageMap] || frMessages;
  }, [locale]);
  
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Asia/Phnom_Penh"
    >
      {children}
    </NextIntlClientProvider>
  );
}