"use client";

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';
import { languageToLocale } from '../i18n/config';

interface I18nProviderProps {
  children: ReactNode;
  selectedLanguage: 'FR' | 'EN' | 'KH';
}

export function I18nProvider({ children, selectedLanguage }: I18nProviderProps) {
  const [messages, setMessages] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const locale = languageToLocale[selectedLanguage] || 'fr';
  
  useEffect(() => {
    const loadMessages = async () => {
      try {
        let messageModule;
        if (locale === 'fr') {
          messageModule = await import('../i18n/locales/fr.json');
        } else if (locale === 'en') {
          messageModule = await import('../i18n/locales/en.json');
        } else if (locale === 'km') {
          messageModule = await import('../i18n/locales/km.json');
        } else {
          messageModule = await import('../i18n/locales/fr.json');
        }
        setMessages(messageModule.default);
      } catch (error) {
        console.error(`Failed to load messages for locale ${locale}:`, error);
        // Fallback to basic French messages
        setMessages({
          nav: { home: "Accueil", courses: "Cours", events: "Événements", cultural: "Échanges" },
          buttons: { connect: "Connecter", disconnect: "Déconnecter", connecting: "Connexion...", pushToTalk: "Maintenez pour parler" },
          status: { connected: "Connecté", disconnected: "Déconnecté", connecting: "Connexion en cours" },
          header: { title: "Assistant Vocal", subtitle: "du Cambodge", brand: "Institut français" }
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [locale]);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  
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