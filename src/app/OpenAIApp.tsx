"use client";
import React, { useEffect, useRef, useState } from "react";
import VoiceOrbPro from "./components/VoiceOrbPro";
import IFCLogoWatermark from "./components/IFCLogoWatermark";
import LanguageSelector from "./components/LanguageSelector";
import "./components/OpenAIStyle.css";
import "./components/MobileOptimized.css";
import { SessionStatus } from "@/app/types";
import type { RealtimeAgent } from '@openai/agents/realtime';
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRealtimeSession } from "./hooks/useRealtimeSession";
import { createModerationGuardrail } from "@/app/agentConfigs/guardrails";
import { allAgentSets } from "@/app/agentConfigs";
import { institutFrancaisCambodgeScenario, institutFrancaisCambodgeCompanyName } from "@/app/agentConfigs/institutFrancaisCambodge";
import useAudioDownload from "./hooks/useAudioDownload";
import { useHandleSessionHistory } from "./hooks/useHandleSessionHistory";

const sdkScenarioMap: Record<string, RealtimeAgent[]> = {
  institutFrancaisCambodge: institutFrancaisCambodgeScenario,
};

const agents = [
  { id: "mainReceptionist", label: "Accueil" },
  { id: "courses", label: "Cours" },
  { id: "events", label: "Événements" },
  { id: "cultural", label: "Échanges" }
];

function OpenAIApp() {
  const { addTranscriptBreadcrumb, transcriptItems } = useTranscript();
  const { logClientEvent } = useEvent();
  
  const [selectedAgentName, setSelectedAgentName] = useState<string>("mainReceptionist");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'FR' | 'KH' | 'EN'>('FR');
  const [mobileAudioReady, setMobileAudioReady] = useState<boolean>(false);
  
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const handoffTriggeredRef = useRef(false);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    
    // Mobile-friendly audio configuration
    el.autoplay = false; // Disabled for mobile compatibility
    el.muted = false;
    el.preload = 'none';
    el.style.display = 'none';
    
    // Mobile audio attributes (required for iOS Safari)
    el.setAttribute('webkit-playsinline', 'true');
    el.setAttribute('playsinline', 'true');
    
    document.body.appendChild(el);
    return el;
  }, []);

  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
      
      // Add mobile audio event listeners
      sdkAudioElement.addEventListener('loadstart', () => {
        console.log('Audio loading started');
      });
      
      sdkAudioElement.addEventListener('canplay', async () => {
        console.log('Audio can play - attempting to play for mobile');
        try {
          // Ensure audio plays on mobile when stream is ready
          if (sessionStatus === 'CONNECTED') {
            // Double-check audio is unmuted before playing
            sdkAudioElement.muted = false;
            sdkAudioElement.volume = 1.0;
            await sdkAudioElement.play();
            console.log('Audio playing successfully on mobile');
          }
        } catch (error) {
          console.log('Audio play attempt failed (normal on some mobiles):', error);
        }
      });
      
      sdkAudioElement.addEventListener('play', () => {
        console.log('Audio started playing');
        setMobileAudioReady(true);
      });
      
      sdkAudioElement.addEventListener('pause', () => {
        console.log('Audio paused');
      });
      
      sdkAudioElement.addEventListener('error', (e) => {
        console.log('Audio error:', e);
        setMobileAudioReady(false);
      });
    }
  }, [sdkAudioElement, sessionStatus]);

  const {
    connect,
    disconnect,
    sendEvent,
    interrupt,
    mute,
  } = useRealtimeSession({
    onConnectionChange: (s) => setSessionStatus(s as SessionStatus),
    onAgentHandoff: (agentName: string) => {
      handoffTriggeredRef.current = true;
      setSelectedAgentName(agentName);
    },
  });

  const { startRecording, stopRecording } = useAudioDownload();

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    try {
      sendEvent(eventObj);
      logClientEvent(eventObj, eventNameSuffix);
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }
  };

  useHandleSessionHistory();

  useEffect(() => {
    const agents = allAgentSets["institutFrancaisCambodge"];
    const agentKeyToUse = agents[0]?.name || "";
    setSelectedAgentName(agentKeyToUse);
  }, []);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    try {
      const resp = await fetch("/api/session", { method: "POST" });
      const data = await resp.json();
      
      if (!data.client_secret?.value) {
        console.error("No ephemeral key provided by the server");
        setSessionStatus("DISCONNECTED");
        return null;
      }
      
      return data.client_secret.value;
    } catch (err) {
      console.error("Failed to fetch ephemeral key:", err);
      setSessionStatus("DISCONNECTED");
      return null;
    }
  };

  // Mobile audio unlock function
  const unlockMobileAudio = async () => {
    if (!sdkAudioElement) return;
    
    try {
      // Resume AudioContext on mobile (required after user interaction)
      const audioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (audioContext) {
        const ctx = new audioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume();
          console.log('AudioContext resumed for mobile');
        }
      }
      
      // Try to play a silent audio to unlock mobile audio
      const silentAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYeBTuL0fPTgjMGHm7A7+OZSA0PVqzn77BdGAhBpePhum8hBjiR1/LNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPTgjQGHm7A7+OZSA0PVqzn77BeGQdApeHhum8iBjiR2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPTgjQGHm/A7+OZSA0PVqzn77BeGQdApeHhum8iBjiR2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSQ0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSA0PVqzn77BeGQdApeHhum8iBjiS2fLNeSsFJHfH8N2QQAoUXrTp66hVFAlFn+DyvmYeBTuL0fPUgTQGHm/A7eSZSA0PVqzn77BeGQdApeHhum8iAA==');
      silentAudio.volume = 0;
      
      const playPromise = silentAudio.play();
      if (playPromise !== undefined) {
        await playPromise.catch(() => {
          console.log('Silent audio unlock failed - this is normal on some browsers');
        });
      }
      
      console.log('Mobile audio unlock attempted');
    } catch (error) {
      console.log('Mobile audio unlock error (this is usually normal):', error);
    }
  };

  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      // Unlock mobile audio on user interaction (connect button press)
      await unlockMobileAudio();
      
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) return;

      const reorderedAgents = [...sdkScenarioMap["institutFrancaisCambodge"]];
      const idx = reorderedAgents.findIndex((a) => a.name === selectedAgentName);
      if (idx > 0) {
        const [agent] = reorderedAgents.splice(idx, 1);
        reorderedAgents.unshift(agent);
      }

      const guardrail = createModerationGuardrail(institutFrancaisCambodgeCompanyName);

      await connect({
        getEphemeralKey: async () => EPHEMERAL_KEY,
        initialAgents: reorderedAgents,
        audioElement: sdkAudioElement,
        outputGuardrails: [guardrail],
        extraContext: {
          addTranscriptBreadcrumb,
          selectedLanguage,
        },
      });
      
      // Explicitly ensure audio element is unmuted for playback
      if (sdkAudioElement) {
        sdkAudioElement.muted = false;
        sdkAudioElement.volume = 1.0;
        console.log('Audio element explicitly unmuted for playback');
      }
      
      console.log('Connected to realtime with mobile audio support');
    } catch (err) {
      console.error("Error connecting:", err);
      setSessionStatus("DISCONNECTED");
    }
  };

  const disconnectFromRealtime = () => {
    disconnect();
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);
  };

  const onToggleConnection = () => {
    if (sessionStatus === "DISCONNECTED") {
      connectToRealtime();
    } else if (sessionStatus === "CONNECTED") {
      disconnectFromRealtime();
    }
  };

  const handleTalkButtonDown = () => {
    if (sessionStatus !== 'CONNECTED') return;
    
    // Add haptic feedback on mobile if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Clear any previous audio and start fresh
    interrupt();
    sendClientEvent({ type: 'input_audio_buffer.clear' }, 'clear PTT buffer');
    
    // START RECORDING - User is holding the button
    setIsPTTUserSpeaking(true);
    mute(false); // UNMUTE - Allow microphone input
    
    console.log('PTT: Started speaking (button pressed)');
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== 'CONNECTED') return;
    
    // Only process if we were actually speaking
    if (!isPTTUserSpeaking) return;
    
    // STOP RECORDING - User released the button
    setIsPTTUserSpeaking(false);
    mute(true); // MUTE - Stop microphone input immediately
    
    // Send the audio to AI for processing
    sendClientEvent({ type: 'input_audio_buffer.commit' }, 'commit PTT');
    sendClientEvent({ type: 'response.create' }, 'trigger AI response');
    
    console.log('PTT: Stopped speaking (button released) - AI will respond');
  };
  
  // Handle mouse leaving the button area (safety)
  const handleTalkButtonLeave = () => {
    if (isPTTUserSpeaking) {
      // User's mouse/finger left the button - stop recording
      setIsPTTUserSpeaking(false);
      mute(true);
      sendClientEvent({ type: 'input_audio_buffer.commit' }, 'commit PTT on leave');
      sendClientEvent({ type: 'response.create' }, 'trigger AI response on leave');
      console.log('PTT: Emergency stop (mouse/touch left button)');
    }
  };

  const handleAgentSelect = (agentId: string) => {
    if (sessionStatus === "CONNECTED") {
      disconnectFromRealtime();
    }
    setSelectedAgentName(agentId);
  };

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }
    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  // Get last transcript message
  const lastMessage = transcriptItems
    .filter(item => item.type === "MESSAGE" && !item.isHidden)
    .slice(-1)[0];

  return (
    <div className="openai-container">
      <IFCLogoWatermark />
      
      {/* Enhanced Header */}
      <div className="openai-header">
        <div className="header-left">
          <div className="brand-mark">
            <div className="brand-logo">IF</div>
            <span className="brand-text">Institut français du Cambodge</span>
          </div>
        </div>
        <div className="header-right">
          <LanguageSelector 
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            disabled={sessionStatus === "CONNECTING"}
          />
          <div className={`status-dot-minimal ${sessionStatus === "CONNECTED" ? "connected" : ""}`} />
          {sessionStatus === "CONNECTED" && (
            <div 
              className={`mobile-audio-indicator ${mobileAudioReady ? 'ready' : 'waiting'}`}
              title={mobileAudioReady ? 'Audio fonctionnel' : 'Audio en attente'}
            >
              {mobileAudioReady ? '🔊' : '🔇'}
            </div>
          )}
        </div>
      </div>

      {/* Center Orb */}
      <div className="orb-wrapper">
        <VoiceOrbPro 
          isSpeaking={isPTTUserSpeaking} 
          isConnected={sessionStatus === "CONNECTED"} 
        />
        
        {/* Hint text */}
        {sessionStatus === "DISCONNECTED" && (
          <div className="hint-text">Cliquez sur connecter pour commencer</div>
        )}
        {sessionStatus === "CONNECTED" && !isPTTUserSpeaking && (
          <div className="hint-text">⬇️ Maintenez le bouton pour parler ⬇️</div>
        )}
        {sessionStatus === "CONNECTED" && isPTTUserSpeaking && (
          <div className="hint-text speaking">🔴 En cours d&apos;écoute... Relâchez pour envoyer</div>
        )}
      </div>

      {/* Floating Transcript - Only last message */}
      <div className={`transcript-float ${sessionStatus === "CONNECTED" && lastMessage ? "active" : ""}`}>
        {lastMessage && (
          <div className={`transcript-line ${lastMessage.role}`}>
            {lastMessage.title}
          </div>
        )}
      </div>

      {/* PTT Button */}
      {sessionStatus === "CONNECTED" && (
        <div className={`ptt-float active`}>
          <button
            onMouseDown={handleTalkButtonDown}
            onMouseUp={handleTalkButtonUp}
            onMouseLeave={handleTalkButtonLeave}
            onTouchStart={handleTalkButtonDown}
            onTouchEnd={handleTalkButtonUp}
            onTouchCancel={handleTalkButtonLeave}
            className={`ptt-hold ${isPTTUserSpeaking ? 'speaking' : ''}`}
            title="Maintenez pour parler"
            aria-label="Push to talk"
            type="button"
          >
            🎤
          </button>
        </div>
      )}

      {/* Connect Button */}
      <button
        onClick={onToggleConnection}
        className={`connect-minimal ${sessionStatus === "CONNECTED" ? "connected" : ""}`}
        disabled={sessionStatus === "CONNECTING"}
      >
        {sessionStatus === "CONNECTED" ? "Déconnecter" : 
         sessionStatus === "CONNECTING" ? "Connexion..." : "Connecter"}
      </button>

      {/* Agent Pills */}
      <div className="agent-pills">
        {agents.map((agent) => (
          <button
            key={agent.id}
            className={`agent-pill ${selectedAgentName === agent.id ? "active" : ""}`}
            onClick={() => handleAgentSelect(agent.id)}
          >
            {agent.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default OpenAIApp;