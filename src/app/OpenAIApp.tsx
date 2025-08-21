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
import { useMobileAudioFix } from "./hooks/useMobileAudioFix";

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
  
  // NUCLEAR MOBILE AUDIO FIX
  const { 
    audioReady: nuclearAudioReady,
    debugLog: audioDebugLog,
    unlockMobileAudio: nuclearUnlock,
    monitorAudioElement: nuclearMonitor,
    forceAudioPlay: nuclearForcePlay,
    ensureAudioContext: nuclearAudioContext
  } = useMobileAudioFix();
  
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
      
      // NUCLEAR: Start monitoring this audio element
      console.log('🔊 NUCLEAR: Starting nuclear audio monitoring');
      const cleanup = nuclearMonitor(sdkAudioElement);
      
      // Add mobile MediaStream-specific event listeners
      sdkAudioElement.addEventListener('loadstart', () => {
        console.log('🔊 Audio loading started');
        console.log('🔊 Audio src:', sdkAudioElement.src);
        console.log('🔊 Audio srcObject:', sdkAudioElement.srcObject);
      });
      
      // CRITICAL: Handle MediaStream srcObject changes (WebRTC streams)
      const handleSrcObjectChange = async () => {
        console.log('🔊 MediaStream srcObject changed');
        console.log('🔊 New srcObject:', sdkAudioElement.srcObject);
        
        if (sdkAudioElement.srcObject) {
          const stream = sdkAudioElement.srcObject as MediaStream;
          console.log('🔊 MediaStream active:', stream.active);
          console.log('🔊 MediaStream audio tracks:', stream.getAudioTracks().length);
          
          if (stream.getAudioTracks().length > 0) {
            const audioTrack = stream.getAudioTracks()[0];
            console.log('🔊 Audio track enabled:', audioTrack.enabled);
            console.log('🔊 Audio track muted:', audioTrack.muted);
            console.log('🔊 Audio track readyState:', audioTrack.readyState);
          }
          
          // Mobile fix: Force play after srcObject is set
          try {
            sdkAudioElement.muted = false;
            sdkAudioElement.volume = 1.0;
            
            // Wait for metadata to load before playing (critical for mobile)
            if (sdkAudioElement.readyState >= 1) {
              await sdkAudioElement.play();
              console.log('🔊 ✅ MediaStream playing immediately');
              setMobileAudioReady(true);
            } else {
              console.log('🔊 Waiting for metadata to load...');
            }
          } catch (error) {
            console.log('🔊 MediaStream play failed:', error);
          }
        }
      };
      
      // Watch for srcObject changes (this is when WebRTC stream arrives)
      const observer = new MutationObserver(() => {
        if (sdkAudioElement.srcObject && !mobileAudioReady) {
          handleSrcObjectChange();
        }
      });
      
      observer.observe(sdkAudioElement, { attributes: true, attributeFilter: ['src'] });
      
      sdkAudioElement.addEventListener('loadedmetadata', async () => {
        console.log('🔊 Metadata loaded - attempting mobile play');
        try {
          if (sessionStatus === 'CONNECTED' && sdkAudioElement.srcObject) {
            sdkAudioElement.muted = false;
            sdkAudioElement.volume = 1.0;
            await sdkAudioElement.play();
            console.log('🔊 ✅ Playing after metadata loaded');
            setMobileAudioReady(true);
          }
        } catch (error) {
          console.log('🔊 Play after metadata failed:', error);
        }
      });
      
      sdkAudioElement.addEventListener('canplay', async () => {
        console.log('🔊 Can play event - final mobile attempt');
        try {
          if (sessionStatus === 'CONNECTED' && !mobileAudioReady) {
            sdkAudioElement.muted = false;
            sdkAudioElement.volume = 1.0;
            await sdkAudioElement.play();
            console.log('🔊 ✅ Final play attempt succeeded');
            setMobileAudioReady(true);
          }
        } catch (error) {
          console.log('🔊 Final play attempt failed:', error);
        }
      });
      
      sdkAudioElement.addEventListener('play', () => {
        console.log('🔊 ✅ AUDIO PLAY EVENT FIRED!');
        console.log('🔊 ✅ This means mobile audio is working!');
        console.log('🔊 ✅ Audio element state:', {
          muted: sdkAudioElement.muted,
          volume: sdkAudioElement.volume,
          paused: sdkAudioElement.paused,
          currentTime: sdkAudioElement.currentTime,
          duration: sdkAudioElement.duration,
          srcObject: !!sdkAudioElement.srcObject
        });
        setMobileAudioReady(true);
      });
      
      sdkAudioElement.addEventListener('pause', () => {
        console.log('🔊 Audio paused');
      });
      
      sdkAudioElement.addEventListener('error', (e) => {
        console.log('🔊 ❌ Audio error:', e);
        setMobileAudioReady(false);
      });
      
      // Cleanup observer on unmount
      return () => {
        observer.disconnect();
        if (cleanup) cleanup();
      };
    }
  }, [sdkAudioElement, sessionStatus, mobileAudioReady, nuclearMonitor]);

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
    console.log('📡 DEBUG: Sending event:', eventObj.type, eventNameSuffix);
    try {
      sendEvent(eventObj);
      logClientEvent(eventObj, eventNameSuffix);
      console.log('📡 DEBUG: Event sent successfully');
    } catch (err) {
      console.error('📡 ERROR: Failed to send via SDK', err);
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

  // Mobile audio unlock function (legacy - now using gesture-based version)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      
      // Additional mobile debugging
      console.log('🔊 MOBILE AUDIO UNLOCK ATTEMPTED');
      console.log('🔊 User Agent:', navigator.userAgent);
      console.log('🔊 Is iOS:', /iPhone|iPad|iPod/.test(navigator.userAgent));
      console.log('🔊 Audio element muted:', sdkAudioElement.muted);
      console.log('🔊 Audio element volume:', sdkAudioElement.volume);
      
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        console.log('🔊 ⚠️  iOS DETECTED: CHECK SILENT SWITCH!');
        console.log('🔊 ⚠️  iOS: Audio won\'t play if device is in silent mode');
      }
    } catch (error) {
      console.log('Mobile audio unlock error (this is usually normal):', error);
    }
  };


  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");
    
    console.log('🚀 DEBUG: Connect button clicked - starting connection flow');
    console.log('🚀 DEBUG: User agent:', navigator.userAgent);
    console.log('🚀 DEBUG: Is mobile:', /iPhone|iPad|iPod|Android/.test(navigator.userAgent));

    try {
      // NUCLEAR: Use the nuclear mobile audio unlock
      console.log('🚀 DEBUG: Starting NUCLEAR mobile audio unlock');
      await nuclearUnlock();
      console.log('🚀 DEBUG: NUCLEAR unlock completed');
      
      // Also ensure AudioContext is ready
      await nuclearAudioContext();
      console.log('🚀 DEBUG: AudioContext ensured');
      
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) return;

      const reorderedAgents = [...sdkScenarioMap["institutFrancaisCambodge"]];
      const idx = reorderedAgents.findIndex((a) => a.name === selectedAgentName);
      if (idx > 0) {
        const [agent] = reorderedAgents.splice(idx, 1);
        reorderedAgents.unshift(agent);
      }

      const guardrail = createModerationGuardrail(institutFrancaisCambodgeCompanyName);

      console.log('🚀 DEBUG: About to connect to OpenAI SDK');
      console.log('🚀 DEBUG: Audio element:', sdkAudioElement);
      console.log('🚀 DEBUG: Audio element muted:', sdkAudioElement?.muted);
      console.log('🚀 DEBUG: Audio element volume:', sdkAudioElement?.volume);

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
      
      console.log('🚀 DEBUG: OpenAI SDK connected successfully');
      
      // Explicitly ensure audio element is unmuted for playback
      if (sdkAudioElement) {
        sdkAudioElement.muted = false;
        sdkAudioElement.volume = 1.0;
        console.log('🔊 Audio element explicitly unmuted for playback');
        
        // NUCLEAR: Force play if srcObject is already set (WebRTC stream might be ready)
        if (sdkAudioElement.srcObject) {
          console.log('🔊 NUCLEAR: Attempting nuclear force play');
          const success = await nuclearForcePlay(sdkAudioElement);
          if (success) {
            console.log('🔊 ✅ NUCLEAR force play successful!');
            setMobileAudioReady(true);
          } else {
            console.log('🔊 ❌ NUCLEAR force play failed - will retry');
          }
        }
      }
      
      // Additional debugging after connection
      console.log('🔊 Connected to realtime with mobile audio support');
      if (sdkAudioElement) {
        console.log('🔊 Final audio element state:');
        console.log('🔊   - muted:', sdkAudioElement.muted);
        console.log('🔊   - volume:', sdkAudioElement.volume);
        console.log('🔊   - src:', sdkAudioElement.src);
        console.log('🔊   - srcObject:', sdkAudioElement.srcObject);
        console.log('🔊   - paused:', sdkAudioElement.paused);
        console.log('🔊   - readyState:', sdkAudioElement.readyState);
      }
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
    
    console.log('🎤 DEBUG: PTT button pressed down');
    console.log('🎤 DEBUG: Session status:', sessionStatus);
    console.log('🎤 DEBUG: Audio element ready:', !!sdkAudioElement);
    console.log('🎤 DEBUG: Mobile audio ready:', mobileAudioReady);
    
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
    
    console.log('🎤 DEBUG: PTT recording started');
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== 'CONNECTED') return;
    
    console.log('🎤 DEBUG: PTT button released');
    console.log('🎤 DEBUG: Was speaking:', isPTTUserSpeaking);
    
    // Only process if we were actually speaking
    if (!isPTTUserSpeaking) return;
    
    // STOP RECORDING - User released the button
    setIsPTTUserSpeaking(false);
    mute(true); // MUTE - Stop microphone input immediately
    
    // Send the audio to AI for processing
    sendClientEvent({ type: 'input_audio_buffer.commit' }, 'commit PTT');
    sendClientEvent({ type: 'response.create' }, 'trigger AI response');
    
    console.log('🎤 DEBUG: PTT recording stopped - AI should respond soon');
    console.log('🎤 DEBUG: Audio element at response time:', {
      muted: sdkAudioElement?.muted,
      volume: sdkAudioElement?.volume,
      paused: sdkAudioElement?.paused,
      srcObject: !!sdkAudioElement?.srcObject,
      readyState: sdkAudioElement?.readyState
    });
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
        {sessionStatus === "CONNECTED" && !mobileAudioReady && /iPhone|iPad|iPod|Android/.test(navigator.userAgent) && (
          <div className="hint-text warning" style={{color: '#e74c3c', fontSize: '12px', marginTop: '8px'}}>
            📱 Pas de son ? Vérifiez que l&apos;interrupteur silencieux est désactivé
          </div>
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

      {/* NUCLEAR AUDIO DEBUG PANEL - Only on mobile */}
      {/iPhone|iPad|iPod|Android/.test(navigator.userAgent) && (
        <div style={{
          position: 'fixed',
          bottom: '200px',
          left: '10px',
          right: '10px',
          maxHeight: '150px',
          overflow: 'auto',
          background: 'rgba(0,0,0,0.8)',
          color: '#00ff00',
          fontSize: '10px',
          padding: '5px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          zIndex: 9999,
          display: audioDebugLog.length > 0 ? 'block' : 'none'
        }}>
          <div style={{color: '#ffff00', fontWeight: 'bold'}}>🔊 NUCLEAR AUDIO DEBUG:</div>
          {audioDebugLog.slice(-10).map((log, i) => (
            <div key={i} style={{marginTop: '2px'}}>{log}</div>
          ))}
          <div style={{color: nuclearAudioReady ? '#00ff00' : '#ff0000', fontWeight: 'bold', marginTop: '5px'}}>
            STATUS: {nuclearAudioReady ? '✅ AUDIO READY' : '❌ AUDIO NOT READY'}
          </div>
        </div>
      )}

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