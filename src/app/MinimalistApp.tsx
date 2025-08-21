"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import VoiceOrbPro from "./components/VoiceOrbPro";
import IFCLogo from "./components/IFCLogo";
import "./components/MinimalistInterface.css";
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

function MinimalistApp() {
  const searchParams = useSearchParams()!;
  const { addTranscriptMessage, addTranscriptBreadcrumb, transcriptItems } = useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();
  
  const [selectedAgentName, setSelectedAgentName] = useState<string>("");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<RealtimeAgent[] | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  
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

  const handleSelectedAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentName = e.target.value;
    disconnectFromRealtime();
    setSelectedAgentName(newAgentName);
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

  return (
    <div className="minimalist-container flex flex-col h-screen relative overflow-hidden">
      <IFCLogo />
      <VoiceOrbPro 
        isSpeaking={isPTTUserSpeaking} 
        isConnected={sessionStatus === "CONNECTED"} 
      />
      
      <div className="minimalist-header">
        <div className="logo-minimal">
          <span className="flags">🇫🇷🇰🇭</span>
          <span>Institut français du Cambodge</span>
        </div>
        
        <select
          value={selectedAgentName}
          onChange={handleSelectedAgentChange}
          className="service-selector-minimal"
        >
          <option value="mainReceptionist">Accueil</option>
          <option value="courses">Cours</option>
          <option value="events">Événements</option>
          <option value="cultural">Échanges</option>
        </select>
      </div>

      <div className={`transcript-minimal ${sessionStatus === "CONNECTED" ? "active" : ""}`}>
        {transcriptItems
          .filter(item => item.type === "MESSAGE" && !item.isHidden)
          .slice(-5)
          .map((item) => (
            <div 
              key={item.itemId} 
              className={`message-minimal ${item.role}`}
            >
              {item.title}
            </div>
          ))}
      </div>

      <div className="minimalist-bottom">
        {sessionStatus === "CONNECTED" && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white/70 text-sm">
              <input
                type="checkbox"
                checked={isPTTActive}
                onChange={(e) => setIsPTTActive(e.target.checked)}
                className="w-4 h-4"
              />
              Push to Talk
            </label>
            
            {isPTTActive && (
              <button
                onMouseDown={handleTalkButtonDown}
                onMouseUp={handleTalkButtonUp}
                onTouchStart={handleTalkButtonDown}
                onTouchEnd={handleTalkButtonUp}
                className={`ptt-button ${isPTTUserSpeaking ? 'active' : ''}`}
              >
                {isPTTUserSpeaking ? '🎙️ Parlez...' : '🎤 Maintenir'}
              </button>
            )}
            
            <button
              onClick={onToggleConnection}
              className="connect-button-minimal connected"
            >
              Déconnecter
            </button>
          </div>
        )}
        
        {sessionStatus !== "CONNECTED" && (
          <button
            onClick={onToggleConnection}
            className="connect-button-minimal"
            disabled={sessionStatus === "CONNECTING"}
          >
            {sessionStatus === "CONNECTING" ? "Connexion..." : "Se connecter"}
          </button>
        )}
      </div>
    </div>
  );
}

export default MinimalistApp;