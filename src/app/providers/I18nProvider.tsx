"use client";

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';
import { languageToLocale } from '../i18n/config';

interface I18nProviderProps {
  children: ReactNode;
  selectedLanguage: 'FR' | 'EN' | 'KH';
}

// Import default messages to avoid loading state
import frMessages from '../i18n/locales/fr.json';
import enMessages from '../i18n/locales/en.json';
import kmMessages from '../i18n/locales/km.json';

const messagesMap = {
  fr: frMessages,
  en: enMessages,
  km: kmMessages
};

export function I18nProvider({ children, selectedLanguage }: I18nProviderProps) {
  const locale = languageToLocale[selectedLanguage] || 'fr';
  const messages = messagesMap[locale as keyof typeof messagesMap] || frMessages;
  
  
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