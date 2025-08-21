"use client";
import React from 'react';

interface LanguageSelectorProps {
  selectedLanguage: 'FR' | 'KH' | 'EN';
  onLanguageChange: (language: 'FR' | 'KH' | 'EN') => void;
  disabled?: boolean;
}

export default function LanguageSelector({ 
  selectedLanguage, 
  onLanguageChange, 
  disabled = false 
}: LanguageSelectorProps) {
  const languages = [
    { 
      code: 'FR' as const, 
      flag: '🇫🇷', 
      name: 'Français',
      label: 'Français'
    },
    { 
      code: 'KH' as const, 
      flag: '🇰🇭', 
      name: 'ខ្មែរ',
      label: 'ភាសាខ្មែរ'
    },
    { 
      code: 'EN' as const, 
      flag: '🇬🇧', 
      name: 'English',
      label: 'English'
    }
  ];

  return (
    <div className="language-selector">
      <div className="language-label">
        <span className="text-xs text-gray-500 mb-1 block">Langue / ភាសា / Language</span>
      </div>
      <div className="language-options">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => !disabled && onLanguageChange(lang.code)}
            disabled={disabled}
            className={`language-option ${selectedLanguage === lang.code ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            title={lang.label}
          >
            <span className="flag">{lang.flag}</span>
            <span className="name">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}