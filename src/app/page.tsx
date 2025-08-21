"use client";
import React from "react";
import dynamic from "next/dynamic";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";

// Dynamic import with SSR disabled to prevent server-side rendering issues
const OpenAIApp = dynamic(() => import("./OpenAIApp"), {
  ssr: false,
  loading: () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#ffffff',
      color: '#2c3e50',
      fontSize: '18px'
    }}>
      Chargement de l&apos;assistant vocal...
    </div>
  ),
});

export default function Page() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <OpenAIApp />
      </EventProvider>
    </TranscriptProvider>
  );
}
