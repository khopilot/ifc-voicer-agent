import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['fr', 'en', 'km'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'fr';

// Map our language codes to locale codes
export const languageToLocale: Record<string, Locale> = {
  'FR': 'fr',
  'EN': 'en',
  'KH': 'km',
  'fr': 'fr',
  'en': 'en',
  'km': 'km'
};

// Load messages for a locale
export async function loadMessages(locale: Locale) {
  try {
    const messages = (await import(`./locales/${locale}.json`)).default;
    return messages;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to French if locale not found
    const messages = (await import('./locales/fr.json')).default;
    return messages;
  }
}

// Next-intl configuration
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (requestLocale || defaultLocale) as Locale;
  
  if (!locales.includes(locale)) {
    notFound();
  }
  
  const messages = await loadMessages(locale);
  
  return {
    locale,
    messages,
    timeZone: 'Asia/Phnom_Penh',
    now: new Date()
  };
});