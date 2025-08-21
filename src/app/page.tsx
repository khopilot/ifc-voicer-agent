import React, { Suspense } from "react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import OpenAIApp from "./OpenAIApp";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TranscriptProvider>
        <EventProvider>
          <OpenAIApp />
        </EventProvider>
      </TranscriptProvider>
    </Suspense>
  );
}
