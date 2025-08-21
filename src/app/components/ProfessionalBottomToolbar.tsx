import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (val: boolean) => void;
  codec: string;
  onCodecChange: (newCodec: string) => void;
}

function ProfessionalBottomToolbar({
  sessionStatus,
  onToggleConnection,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  handleTalkButtonDown,
  handleTalkButtonUp,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  function getConnectionButtonLabel() {
    if (isConnected) return "Déconnecter • Disconnect • ផ្តាច់";
    if (isConnecting) return "Connexion... • Connecting...";
    return "Se connecter • Connect • ភ្ជាប់";
  }

  function getConnectionButtonClasses() {
    const baseClasses = "text-white text-lg px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      return `bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 ${cursorClass} ${baseClasses}`;
    }
    return `bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 ${cursorClass} ${baseClasses} pulse-animation`;
  }

  return (
    <div className="p-6 flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleConnection}
          className={getConnectionButtonClasses()}
          disabled={isConnecting}
        >
          {getConnectionButtonLabel()}
        </button>

        {isConnected && (
          <div className="flex items-center gap-3 bg-white/90 px-6 py-3 rounded-full shadow-md">
            <span className="status-indicator"></span>
            <span className="text-sm font-medium text-gray-700">
              Assistant actif • Active • សកម្ម
            </span>
          </div>
        )}
      </div>

      {isConnected && (
        <div className="flex items-center gap-4 bg-white/80 px-6 py-3 rounded-full shadow-sm">
          <div className="flex items-center gap-3">
            <input
              id="push-to-talk"
              type="checkbox"
              checked={isPTTActive}
              onChange={(e) => setIsPTTActive(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="push-to-talk"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Mode Push-to-Talk
            </label>
          </div>
          
          {isPTTActive && (
            <button
              onMouseDown={handleTalkButtonDown}
              onMouseUp={handleTalkButtonUp}
              onTouchStart={handleTalkButtonDown}
              onTouchEnd={handleTalkButtonUp}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                isPTTUserSpeaking
                  ? "bg-red-500 text-white scale-110 shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isPTTUserSpeaking ? "🎙️ Parlez..." : "🎤 Appuyer pour parler"}
            </button>
          )}
        </div>
      )}

      {!isConnected && (
        <div className="text-center mt-2">
          <p className="text-sm text-gray-600">
            Cliquez pour commencer • Click to start • ចុចដើម្បីចាប់ផ្តើម
          </p>
        </div>
      )}
    </div>
  );
}

export default ProfessionalBottomToolbar;