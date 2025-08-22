"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from 'next-intl';
import VoiceOrbAdvanced from "./components/VoiceOrbAdvanced";
import IFCLogoWatermark from "./components/IFCLogoWatermark";
import LanguageSelector from "./components/LanguageSelector";
import MobileChatHistory from "./components/MobileChatHistory";
import { I18nProvider } from "./providers/I18nProvider";
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
// import useAudioDownload from "./hooks/useAudioDownload"; // Currently unused
import { useHandleSessionHistory } from "./hooks/useHandleSessionHistory";
// import { useMobileAudioFix } from "./hooks/useMobileAudioFix"; // Currently unused in this refactor
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { haptic, hapticManager } from "./utils/hapticManager";

const sdkScenarioMap: Record<string, RealtimeAgent[]> = {
  institutFrancaisCambodge: institutFrancaisCambodgeScenario,
};

// Agent configuration will be populated with translations
const getAgents = (t: any) => [
  { id: "mainReceptionist", label: t('nav.home') },
  { id: "courses", label: t('nav.courses') },
  { id: "events", label: t('nav.events') },
  { id: "cultural", label: t('nav.cultural') }
];

// Inner component that uses translations
function OpenAIAppContent({ selectedLanguage, setSelectedLanguage }: { 
  selectedLanguage: 'FR' | 'KH' | 'EN';
  setSelectedLanguage: (lang: 'FR' | 'KH' | 'EN') => void;
}) {
  const t = useTranslations();
  const { addTranscriptBreadcrumb, transcriptItems } = useTranscript();
  const { logClientEvent } = useEvent();
  
  const [selectedAgentName, setSelectedAgentName] = useState<string>("mainReceptionist");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
  const [sdkAudioElement, setSdkAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [lastMessage, setLastMessage] = useState<{ role: string; title: string } | null>(null);
  const [nuclearMonitor, setNuclearMonitor] = useState(0);
  const [mobileAudioReady, setMobileAudioReady] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const handoffTriggeredRef = useRef(false);
  
  const agents = getAgents(t);

  // Reset handoff flag when agent selection changes manually
  useEffect(() => {
    if (!handoffTriggeredRef.current) {
      handoffTriggeredRef.current = false;
    }
  }, [selectedAgentName]);

  // Server event logging (placeholder)
  // const logServerEvent = (event: any, eventNameSuffix?: string) => {
  //   return;
  // };

  const nuclearUnlock = async () => {
    if (!sdkAudioElement) return;
    
    console.log('🔊 🚀 NUCLEAR: Starting unlock sequence...');
    
    // Force unmute
    sdkAudioElement.muted = false;
    sdkAudioElement.volume = 1.0;
    
    // Add silent audio
    const buffer = new AudioBuffer({ 
      length: 1, 
      sampleRate: 44100, 
      numberOfChannels: 1 
    });
    
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      console.log('🔊 🚀 NUCLEAR: Played silent audio to wake up mobile audio system');
    } catch (e) {
      console.log('🔊 🚀 NUCLEAR: Silent audio failed, but continuing...', e);
    }
    
    setNuclearMonitor(prev => prev + 1);
  };

  const nuclearAudioContext = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🔊 🚀 NUCLEAR: AudioContext resumed');
      }
      
      // Create and play a silent buffer
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
      
      console.log('🔊 🚀 NUCLEAR: Created AudioContext and played silent buffer');
      return audioContext;
    } catch (e) {
      console.log('🔊 🚀 NUCLEAR: AudioContext creation failed:', e);
      return null;
    }
  };

  const nuclearForcePlay = async (element: HTMLAudioElement) => {
    console.log('🔊 🚀 NUCLEAR: Force playing audio element...');
    element.muted = false;
    element.volume = 1.0;
    
    try {
      const playPromise = element.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('🔊 🚀 NUCLEAR: Audio element playing successfully!');
        return true;
      }
    } catch (e) {
      console.log('🔊 🚀 NUCLEAR: Play failed but might work later:', e);
      
      // Try alternative approach
      element.load();
      setTimeout(() => {
        element.play().catch(e2 => console.log('🔊 NUCLEAR: Retry play failed:', e2));
      }, 100);
    }
    return false;
  };

  // Find SDK audio element
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLAudioElement) {
            console.log('🔊 FOUND SDK AUDIO ELEMENT!', node);
            setSdkAudioElement(node);
            
            // Configure immediately
            node.muted = false;
            node.volume = 1.0;
            node.setAttribute('playsinline', 'true');
            node.setAttribute('autoplay', 'true');
            
            console.log('🔊 Configured SDK audio element:', {
              muted: node.muted,
              volume: node.volume,
              playsinline: node.getAttribute('playsinline'),
              autoplay: node.getAttribute('autoplay')
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  // Setup audio element event listeners
  useEffect(() => {
    if (sdkAudioElement && sessionStatus === "CONNECTED") {
      console.log('🔊 Setting up audio element listeners');
      
      // Track assistant speaking state
      const handlePlay = () => {
        console.log('🎵 Assistant started speaking');
        setIsAssistantSpeaking(true);
        // Subtle haptic feedback when assistant starts speaking
        haptic('assistantStartSpeaking');
      };
      
      const handlePause = () => {
        console.log('🎵 Assistant paused speaking');
        setIsAssistantSpeaking(false);
        // Gentle haptic feedback when assistant stops
        haptic('assistantStopSpeaking');
      };
      
      const handleEnded = () => {
        console.log('🎵 Assistant finished speaking');
        setIsAssistantSpeaking(false);
        // Gentle haptic feedback when assistant finishes
        haptic('assistantStopSpeaking');
      };
      
      sdkAudioElement.addEventListener('play', handlePlay);
      sdkAudioElement.addEventListener('pause', handlePause);
      sdkAudioElement.addEventListener('ended', handleEnded);
      sdkAudioElement.addEventListener('emptied', handleEnded);
      
      // Mobile audio monitoring (cleanup function from hook)
      
      sdkAudioElement.addEventListener('canplay', () => {
        console.log('🔊 Can play event - audio ready, waiting for PTT to unlock');
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
        // Haptic feedback for audio errors
        haptic('audioError');
      });
      
      // Cleanup event listeners on unmount
      return () => {
        sdkAudioElement.removeEventListener('play', handlePlay);
        sdkAudioElement.removeEventListener('pause', handlePause);
        sdkAudioElement.removeEventListener('ended', handleEnded);
        sdkAudioElement.removeEventListener('emptied', handleEnded);
        // Mobile audio monitoring cleanup handled by hook
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
    onConnectionChange: (s) => {
      const newStatus = s as SessionStatus;
      setSessionStatus(newStatus);
      
      // Haptic feedback for connection state changes
      if (newStatus === "CONNECTED") {
        haptic('connectSuccess');
        console.log('🔸 Haptic: Connection success');
      } else if (newStatus === "DISCONNECTED") {
        haptic('disconnect');
        console.log('🔸 Haptic: Disconnected');
      }
    },
    onAgentHandoff: (agentName: string) => {
      console.log('🎯 UI: Agent handoff received, switching to:', agentName);
      console.log('🌐 UI: Current language context:', selectedLanguage);
      
      // Haptic feedback for agent transitions
      haptic('agentHandoff');
      console.log('🔸 Haptic: Agent handoff');
      
      handoffTriggeredRef.current = true;
      setSelectedAgentName(agentName);
    },
  });

  // Audio download hooks (currently unused)
  // const { startRecording, stopRecording } = useAudioDownload();
  
  // Mobile audio fix handled through direct implementation (nuclear methods)

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
      return data.ephemeral_key ?? data.client_secret?.value ?? null;
    } catch (e) {
      console.error("Failed to fetch ephemeral key:", e);
      alert("Failed to fetch ephemeral key. Check your environment variables.");
      return null;
    }
  };

  // Get last message from transcript
  useEffect(() => {
    if (transcriptItems.length > 0) {
      const lastItem = transcriptItems[transcriptItems.length - 1];
      setLastMessage({
        role: lastItem.role || 'user',
        title: lastItem.title || '',
      });
    }
  }, [transcriptItems]);

  // Agent switch handler  
  const handleAgentSwitch = (agentName: string) => {
    if (sessionStatus === "CONNECTED") {
      console.log('🔄 DEBUG: Switching agent to:', agentName);
      
      // Don't trigger handoff if this was already triggered by an actual handoff event
      if (handoffTriggeredRef.current) {
        handoffTriggeredRef.current = false;
        return;
      }
      
      const targetAgent = allAgentSets["institutFrancaisCambodge"].find(a => a.name === agentName);
      
      if (targetAgent) {
        console.log('🔄 DEBUG: Found target agent:', targetAgent.name);
        
        // Trigger handoff via message with context
        const handoffMessage = `Please transfer me to the ${agentName} agent. Context: User selected language is ${selectedLanguage}`;
        console.log('🔄 DEBUG: Sending handoff message:', handoffMessage);
        
        interrupt();
        sendClientEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: handoffMessage
              }
            ]
          }
        }, "manual_handoff");
        
        sendClientEvent({ type: "response.create" }, "trigger_handoff");
      }
    } else {
      setSelectedAgentName(agentName);
    }
  };


  // Core connection logic that can be reused
  const onConnectCore = async () => {
    console.log('🚀 DEBUG: Starting connection flow');
    console.log('🚀 DEBUG: User agent:', navigator.userAgent);
    console.log('🚀 DEBUG: Is mobile:', /iPhone|iPad|iPod|Android/.test(navigator.userAgent));

    try {
      // Don't unlock audio here - wait for user gesture (PTT button)
      console.log('🚀 DEBUG: Connecting to OpenAI - audio unlock delayed until PTT press');
      
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        setSessionStatus("DISCONNECTED");
        return;
      }

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

      console.log('🌐 DEBUG: Language context being passed:', selectedLanguage);
      console.log('🤖 DEBUG: Agents in scenario:', reorderedAgents.map(a => a.name));
      
      // Create a temporary audio element for the connection
      // The SDK will create its own audio element during connection
      const tempAudioElement = document.createElement('audio');
      tempAudioElement.muted = false;
      tempAudioElement.volume = 1.0;
      tempAudioElement.setAttribute('playsinline', 'true');
      tempAudioElement.setAttribute('autoplay', 'true');
      
      console.log('🔊 DEBUG: Using temporary audio element for connection');

      await connect({
        getEphemeralKey: async () => EPHEMERAL_KEY,
        initialAgents: reorderedAgents,
        audioElement: tempAudioElement,
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
        console.log('🔊 Audio element configured - waiting for PTT to unlock mobile audio');
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
      // Haptic feedback for connection errors
      haptic('connectionError');
    }
  };
  
  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");
    await onConnectCore();
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

  const handleTalkButtonDown = async () => {
    if (sessionStatus !== 'CONNECTED') return;
    
    console.log('🎤 DEBUG: PTT button pressed down');
    console.log('🎤 DEBUG: Session status:', sessionStatus);
    console.log('🎤 DEBUG: Audio element ready:', !!sdkAudioElement);
    console.log('🎤 DEBUG: Mobile audio ready:', mobileAudioReady);
    console.log('🎤 DEBUG: Audio unlocked:', audioUnlocked);
    
    // NUCLEAR: Unlock mobile audio on first PTT press (real user gesture!)
    if (!audioUnlocked && /iPhone|iPad|iPod|Android/.test(navigator.userAgent)) {
      console.log('🔊 NUCLEAR: First PTT press - unlocking mobile audio with user gesture!');
      await nuclearUnlock();
      await nuclearAudioContext();
      
      // Try to play the audio element if it has a stream
      if (sdkAudioElement && sdkAudioElement.srcObject) {
        const success = await nuclearForcePlay(sdkAudioElement);
        if (success) {
          console.log('🔊 ✅ NUCLEAR: Audio unlocked and playing!');
          setMobileAudioReady(true);
          // Haptic feedback for successful audio unlock
          haptic('audioUnlockSuccess');
        }
      }
      
      setAudioUnlocked(true);
      console.log('🔊 NUCLEAR: Mobile audio unlock complete!');
    }
    
    // Enhanced haptic feedback for PTT press
    haptic('pttPress');
    
    // Clear any previous audio and start fresh
    interrupt();
    sendClientEvent({ type: 'input_audio_buffer.clear' }, 'clear PTT buffer');
    
    // START RECORDING - User is holding the button
    setIsPTTUserSpeaking(true);
    mute(false); // UNMUTE - Allow microphone input
    
    console.log('🎤 DEBUG: PTT recording started');
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== 'CONNECTED' || !isPTTUserSpeaking) return;
    
    console.log('🎤 DEBUG: PTT button released');
    
    // Enhanced haptic feedback for PTT release
    haptic('pttRelease');
    
    // STOP RECORDING - User released the button
    setIsPTTUserSpeaking(false);
    mute(true); // MUTE - Stop microphone input
    
    // Commit the audio buffer to send to the model
    sendClientEvent({ type: 'input_audio_buffer.commit' }, 'commit PTT audio');
    
    // Trigger a response from the model
    sendClientEvent({ type: 'response.create' }, 'create PTT response');
    
    console.log('🎤 DEBUG: PTT recording stopped and committed');
  };

  const handleTalkButtonLeave = () => {
    if (isPTTUserSpeaking) {
      console.log('🎤 DEBUG: PTT button left area - stopping recording');
      handleTalkButtonUp();
    }
  };

  return (
    <div className="openai-container">
      <IFCLogoWatermark />
      
      {/* Chat History */}
      <MobileChatHistory 
        isVisible={isChatExpanded}
        onToggle={() => setIsChatExpanded(!isChatExpanded)}
        sessionStatus={sessionStatus}
      />

      {/* Header */}
      <div className="openai-header">
        <div className="header-left">
          <div className="brand-mark">
            <div className="brand-logo">🇫🇷</div>
            <div className="brand-text-container">
              <span className="brand-text">{t('header.brand')}</span>
              <span className="brand-subtitle">{t('header.subtitle')}</span>
            </div>
          </div>
          <div className="header-separator"></div>
          <div className="app-title">
            <span className="app-title-text">{t('header.title')}</span>
            <div className={`app-status ${sessionStatus.toLowerCase()}`}>
              {sessionStatus === "CONNECTED" && t('status.connected')}
              {sessionStatus === "CONNECTING" && t('status.connecting')}
              {sessionStatus === "DISCONNECTED" && t('status.disconnected')}
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-controls">
            <LanguageSelector 
              selectedLanguage={selectedLanguage}
              onLanguageChange={async (lang) => {
                console.log('🌐 Language changed to:', lang);
                setSelectedLanguage(lang);
                
                // Haptic feedback for language change
                haptic('languageSwitch');
                
                // If connected, disconnect and reconnect with new language context
                if (sessionStatus === "CONNECTED") {
                  console.log('🔄 Reconnecting with new language context:', lang);
                  // Store current agent before disconnecting
                  const currentAgent = selectedAgentName;
                  
                  // Disconnect current session
                  disconnect();
                  
                  // Wait a moment for cleanup
                  await new Promise(resolve => setTimeout(resolve, 100));
                  
                  // Reconnect with new language context
                  await onConnectCore();
                  
                  // If not on main agent, switch back to the same agent
                  if (currentAgent !== 'mainReceptionist') {
                    setSelectedAgentName(currentAgent);
                  }
                } else if (sessionStatus === "DISCONNECTED") {
                  // If not connected, the new language will be used on next connection
                  console.log('📝 Language preference saved for next connection');
                }
              }}
              disabled={sessionStatus === "CONNECTING"}
            />
            <div className="status-indicators">
              <div className={`status-dot-minimal ${sessionStatus === "CONNECTED" ? "connected" : ""}`} />
              {sessionStatus === "CONNECTED" && (
                <div 
                  className={`mobile-audio-indicator ${mobileAudioReady ? 'ready' : 'waiting'}`}
                  title={mobileAudioReady ? t('audio.ready') : t('audio.waiting')}
                >
                  {mobileAudioReady ? '🔊' : '🔇'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center Orb */}
      <div className="orb-wrapper">
        <VoiceOrbAdvanced 
          isUserSpeaking={isPTTUserSpeaking} 
          isAssistantSpeaking={isAssistantSpeaking}
          isConnected={sessionStatus === "CONNECTED"}
          isListening={sessionStatus === "CONNECTED" && !isPTTUserSpeaking && !isAssistantSpeaking}
        />
        
        {/* Hint text */}
        {sessionStatus === "DISCONNECTED" && (
          <div className="hint-text">{t('hints.disconnected')}</div>
        )}
        {sessionStatus === "CONNECTED" && !isPTTUserSpeaking && (
          <div className="hint-text">⬇️ {t('buttons.pushToTalk')} ⬇️</div>
        )}
        {sessionStatus === "CONNECTED" && isPTTUserSpeaking && (
          <div className="hint-text speaking">🔴 {t('hints.speaking')}</div>
        )}
        {sessionStatus === "CONNECTED" && !mobileAudioReady && /iPhone|iPad|iPod|Android/.test(navigator.userAgent) && (
          <div className="hint-text warning" style={{color: '#e74c3c', fontSize: '12px', marginTop: '8px'}}>
            📱 {t('audio.mobileWarning')}
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
            title={t('buttons.pushToTalk')}
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
        {sessionStatus === "CONNECTED" ? t('buttons.disconnect') : 
         sessionStatus === "CONNECTING" ? t('buttons.connecting') : t('buttons.connect')}
      </button>

      {/* NUCLEAR AUDIO DEBUG PANEL - Development Only */}
      {false && process.env.NODE_ENV === 'development' && /iPhone|iPad|iPod|Android/.test(navigator.userAgent) && (
        <div style={{
          position: 'fixed',
          bottom: '200px',
          left: '10px',
          right: '10px',
          maxHeight: '150px',
          overflow: 'auto',
          background: 'rgba(0,0,0,0.9)',
          color: '#00ff00',
          padding: '10px',
          fontSize: '10px',
          fontFamily: 'monospace',
          borderRadius: '8px',
          zIndex: 10000
        }}>
          <div>🔊 NUCLEAR AUDIO DEBUG</div>
          <div>Session: {sessionStatus}</div>
          <div>SDK Element: {sdkAudioElement ? '✅' : '❌'}</div>
          <div>Mobile Ready: {mobileAudioReady ? '✅' : '❌'}</div>
          <div>Unlocked: {audioUnlocked ? '✅' : '❌'}</div>
          <div>PTT Speaking: {isPTTUserSpeaking ? '✅' : '❌'}</div>
          <div>Monitor: {nuclearMonitor}</div>
          {sdkAudioElement && (
            <>
              <div>Muted: {sdkAudioElement?.muted ? '🔇' : '🔊'}</div>
              <div>Volume: {sdkAudioElement?.volume}</div>
              <div>Paused: {sdkAudioElement?.paused ? '⏸️' : '▶️'}</div>
              <div>Ready: {sdkAudioElement?.readyState}</div>
              <div>Src: {sdkAudioElement?.srcObject ? '✅' : '❌'}</div>
            </>
          )}
        </div>
      )}

      {/* Agent Navigation */}
      <div className="agent-pills">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => {
              handleAgentSwitch(agent.id);
              // Haptic feedback for navigation
              haptic('navigationTap');
            }}
            className={`agent-pill ${selectedAgentName === agent.id ? 'active' : ''}`}
            disabled={sessionStatus === "CONNECTING"}
          >
            {agent.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Main wrapper component
export default function OpenAIApp() {
  const [selectedLanguage, setSelectedLanguage] = useState<'FR' | 'KH' | 'EN'>('FR');
  
  return (
    <I18nProvider selectedLanguage={selectedLanguage}>
      <OpenAIAppContent 
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
      />
    </I18nProvider>
  );
}