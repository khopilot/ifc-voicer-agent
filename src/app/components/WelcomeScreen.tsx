"use client";
import React from 'react';

export default function WelcomeScreen() {
  return (
    <div className="welcome-message">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 header-gradient">
          Bienvenue à l&apos;Institut français du Cambodge
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          សូមស្វាគមន៍មកកាន់វិទ្យាស្ថានបារាំងនៃកម្ពុជា
        </p>
        <p className="text-lg text-gray-500">
          Welcome to the French Institute of Cambodia
        </p>
      </div>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          Je suis votre assistant vocal multilingue. Je peux vous aider en:
        </p>
        <div className="language-badges">
          <div className="language-badge">
            <span>🇫🇷</span>
            <span>Français</span>
          </div>
          <div className="language-badge">
            <span>🇰🇭</span>
            <span>ភាសាខ្មែរ</span>
          </div>
          <div className="language-badge">
            <span>🇬🇧</span>
            <span>English</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
        <div className="bg-white/80 p-4 rounded-lg shadow-md">
          <h3 className="font-semibold text-blue-800 mb-2">📚 Cours de langues</h3>
          <p className="text-sm text-gray-600">
            Français tous niveaux, préparation DELF/DALF, cours de khmer
          </p>
        </div>
        <div className="bg-white/80 p-4 rounded-lg shadow-md">
          <h3 className="font-semibold text-blue-800 mb-2">🎭 Événements culturels</h3>
          <p className="text-sm text-gray-600">
            Cinéma, expositions, concerts, festivals
          </p>
        </div>
        <div className="bg-white/80 p-4 rounded-lg shadow-md">
          <h3 className="font-semibold text-blue-800 mb-2">📖 Bibliothèque</h3>
          <p className="text-sm text-gray-600">
            15,000+ livres, magazines, ressources numériques
          </p>
        </div>
        <div className="bg-white/80 p-4 rounded-lg shadow-md">
          <h3 className="font-semibold text-blue-800 mb-2">🎓 Campus France</h3>
          <p className="text-sm text-gray-600">
            Études en France, bourses, échanges culturels
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-center text-gray-700">
          <strong>Cliquez sur &quot;Connect&quot; pour commencer</strong>
          <br />
          <span className="text-sm">Parlez-moi dans votre langue préférée!</span>
        </p>
      </div>

      <div className="mt-6 text-center">
        <div className="text-sm text-gray-500">
          📍 218 Street 184, Phnom Penh | 📞 +855 23 213 124
          <br />
          ⏰ Lun-Ven: 8h-20h | Sam: 8h-18h
        </div>
      </div>
    </div>
  );
}