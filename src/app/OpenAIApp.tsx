"use client";
import React, { useEffect, useRef, useState } from "react";
import VoiceOrbPro from "./components/VoiceOrbPro";
import IFCLogoWatermark from "./components/IFCLogoWatermark";
import LanguageSelector from "./components/LanguageSelector";
import "./components/OpenAIStyle.css";
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
  
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const handoffTriggeredRef = useRef(false);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

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

  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
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
    interrupt();
    setIsPTTUserSpeaking(true);
    // Unmute microphone when PTT is pressed
    mute(false);
    sendClientEvent({ type: 'input_audio_buffer.clear' }, 'clear PTT buffer');
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== 'CONNECTED' || !isPTTUserSpeaking) return;
    setIsPTTUserSpeaking(false);
    sendClientEvent({ type: 'input_audio_buffer.commit' }, 'commit PTT');
    sendClientEvent({ type: 'response.create' }, 'trigger response PTT');
    // Re-mute microphone after PTT is released
    mute(true);
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
          <div className="hint-text">Maintenez 🎤 pour parler</div>
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
            onTouchStart={handleTalkButtonDown}
            onTouchEnd={handleTalkButtonUp}
            className={`ptt-hold ${isPTTUserSpeaking ? 'speaking' : ''}`}
            title="Maintenez pour parler"
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