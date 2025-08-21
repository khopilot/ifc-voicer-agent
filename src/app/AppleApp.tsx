"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import VoiceOrbPro from "./components/VoiceOrbPro";
import "./components/AppleInterface.css";
import { SessionStatus } from "@/app/types";
import type { RealtimeAgent } from '@openai/agents/realtime';
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRealtimeSession } from "./hooks/useRealtimeSession";
import { createModerationGuardrail } from "@/app/agentConfigs/guardrails";
import { allAgentSets, defaultAgentSetKey } from "@/app/agentConfigs";
import { institutFrancaisCambodgeScenario, institutFrancaisCambodgeCompanyName } from "@/app/agentConfigs/institutFrancaisCambodge";
import useAudioDownload from "./hooks/useAudioDownload";
import { useHandleSessionHistory } from "./hooks/useHandleSessionHistory";

const sdkScenarioMap: Record<string, RealtimeAgent[]> = {
  institutFrancaisCambodge: institutFrancaisCambodgeScenario,
};

const agentCards = [
  {
    id: "mainReceptionist",
    icon: "🎓",
    name: "Accueil",
    description: "Information générale"
  },
  {
    id: "courses",
    icon: "📚",
    name: "Cours",
    description: "Français & Khmer"
  },
  {
    id: "events",
    icon: "🎭",
    name: "Événements",
    description: "Culture & Cinéma"
  },
  {
    id: "cultural",
    icon: "🌍",
    name: "Échanges",
    description: "Campus France"
  }
];

function AppleApp() {
  const searchParams = useSearchParams()!;
  const { addTranscriptMessage, addTranscriptBreadcrumb, transcriptItems } = useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();
  
  const [selectedAgentName, setSelectedAgentName] = useState<string>("");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<RealtimeAgent[] | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(true);
  
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
    sendUserText,
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

  const { startRecording, stopRecording, downloadRecording } = useAudioDownload();

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
    setSelectedAgentConfigSet(agents);
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
    sendClientEvent({ type: 'input_audio_buffer.clear' }, 'clear PTT buffer');
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== 'CONNECTED' || !isPTTUserSpeaking) return;
    setIsPTTUserSpeaking(false);
    sendClientEvent({ type: 'input_audio_buffer.commit' }, 'commit PTT');
    sendClientEvent({ type: 'response.create' }, 'trigger response PTT');
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="apple-container">
      {/* Header */}
      <div className="apple-header">
        <div className="logo-section">
          <div className="logo-mark">IF</div>
          <div className="logo-text">
            <div className="logo-title">Institut français du Cambodge</div>
            <div className="logo-subtitle">🇫🇷 Phnom Penh & Battambang 🇰🇭</div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="status-indicator">
          <div className={`status-dot ${sessionStatus === "CONNECTED" ? "connected" : ""} ${isPTTUserSpeaking ? "speaking" : ""}`}></div>
          <span className="status-text">
            {sessionStatus === "CONNECTED" ? (isPTTUserSpeaking ? "En train de parler..." : "Connecté") : 
             sessionStatus === "CONNECTING" ? "Connexion..." : "Déconnecté"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="apple-main">
        {/* Orb Container */}
        <div className="orb-container">
          <VoiceOrbPro 
            isSpeaking={isPTTUserSpeaking} 
            isConnected={sessionStatus === "CONNECTED"} 
          />
        </div>

        {/* Transcript Panel */}
        <div className={`transcript-panel ${!showTranscript || sessionStatus !== "CONNECTED" ? "hidden" : ""}`}>
          <div className="transcript-header">
            <h3 className="transcript-title">Conversation</h3>
          </div>
          <div className="transcript-content">
            {transcriptItems
              .filter(item => item.type === "MESSAGE" && !item.isHidden)
              .map((item) => (
                <div key={item.itemId} className="transcript-message">
                  <div className={`message-bubble ${item.role}`}>
                    {item.title}
                  </div>
                  <div className={`message-time ${item.role === "user" ? "text-right" : ""}`}>
                    {formatTime(new Date(item.addedAt))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Agent Selector */}
      <div className="agent-selector-container">
        <div className="agent-selector-scroll">
          {agentCards.map((agent) => (
            <div 
              key={agent.id}
              className={`agent-card ${selectedAgentName === agent.id ? "active" : ""}`}
              onClick={() => handleAgentSelect(agent.id)}
            >
              <div className="agent-icon">{agent.icon}</div>
              <div className="agent-name">{agent.name}</div>
              <div className="agent-description">{agent.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PTT Controls */}
      {sessionStatus === "CONNECTED" && (
        <div className="ptt-section">
          <div className="ptt-toggle">
            <input
              type="checkbox"
              checked={isPTTActive}
              onChange={(e) => setIsPTTActive(e.target.checked)}
            />
            <span>Push to Talk</span>
          </div>
          
          {isPTTActive && (
            <button
              onMouseDown={handleTalkButtonDown}
              onMouseUp={handleTalkButtonUp}
              onTouchStart={handleTalkButtonDown}
              onTouchEnd={handleTalkButtonUp}
              className={`ptt-talk-button ${isPTTUserSpeaking ? 'active' : ''}`}
            >
              {isPTTUserSpeaking ? '🎙️ Parlez...' : '🎤 Maintenir'}
            </button>
          )}
        </div>
      )}

      {/* Connection Button */}
      <div className="connection-area">
        <button
          onClick={onToggleConnection}
          className={`connect-button-apple ${sessionStatus === "CONNECTED" ? "connected" : ""}`}
          disabled={sessionStatus === "CONNECTING"}
        >
          {sessionStatus === "CONNECTED" ? "Déconnecter" : 
           sessionStatus === "CONNECTING" ? "Connexion..." : "Se connecter"}
        </button>
      </div>
    </div>
  );
}

export default AppleApp;