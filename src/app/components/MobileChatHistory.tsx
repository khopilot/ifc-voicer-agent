"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { TranscriptItem } from "@/app/types";

interface MobileChatHistoryProps {
  isVisible: boolean;
  onToggle: () => void;
  sessionStatus: string;
}

export default function MobileChatHistory({ isVisible, onToggle, sessionStatus }: MobileChatHistoryProps) {
  const { transcriptItems } = useTranscript();
  const chatRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Filter and sort messages
  const chatMessages = transcriptItems
    .filter(item => item.type === "MESSAGE" && !item.isHidden)
    .sort((a, b) => a.createdAtMs - b.createdAtMs)
    .slice(-10); // Keep last 10 messages for mobile performance

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && chatRef.current && isVisible) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages, autoScroll, isVisible]);

  // Check if user is scrolling up (disable auto-scroll)
  const handleScroll = () => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isNearBottom);
  };

  const formatMessage = (item: TranscriptItem) => {
    const isBracketed = item.title.startsWith("[") && item.title.endsWith("]");
    if (isBracketed) {
      return item.title.slice(1, -1);
    }
    return item.title;
  };

  const formatTime = (timestamp: string) => {
    try {
      const time = new Date(timestamp);
      return time.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return timestamp.split(' ')[1] || '';
    }
  };

  if (sessionStatus !== "CONNECTED") {
    return null;
  }

  return (
    <div className={`mobile-chat-overlay ${isVisible ? 'visible' : ''}`}>
      {/* Chat Toggle Button */}
      <button
        onClick={onToggle}
        className="chat-toggle-btn"
        aria-label={isVisible ? 'Masquer l\'historique' : 'Afficher l\'historique'}
      >
        <div className="chat-toggle-icon">
          {isVisible ? '×' : '💬'}
        </div>
        {!isVisible && chatMessages.length > 0 && (
          <div className="chat-badge">{chatMessages.length}</div>
        )}
      </button>

      {/* Chat Panel */}
      <div className="chat-panel">
        <div className="chat-header">
          <h3>Conversation</h3>
          <button onClick={onToggle} className="chat-close">×</button>
        </div>
        
        <div 
          ref={chatRef}
          className="chat-messages"
          onScroll={handleScroll}
        >
          {chatMessages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">🗨️</div>
              <p>Appuyez sur le bouton micro pour commencer la conversation</p>
            </div>
          ) : (
            chatMessages.map((item) => (
              <div 
                key={item.itemId}
                className={`message ${item.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="message-content">
                  {formatMessage(item)}
                </div>
                <div className="message-time">
                  {formatTime(item.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>

        {!autoScroll && (
          <button 
            className="scroll-to-bottom"
            onClick={() => {
              if (chatRef.current) {
                chatRef.current.scrollTop = chatRef.current.scrollHeight;
                setAutoScroll(true);
              }
            }}
          >
            ↓
          </button>
        )}
      </div>

      <style jsx>{`
        .mobile-chat-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mobile-chat-overlay.visible {
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(2px);
        }

        .chat-toggle-btn {
          position: fixed;
          top: 70px;
          right: 16px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(44, 62, 80, 0.1);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          pointer-events: auto;
          backdrop-filter: blur(10px);
        }

        .chat-toggle-btn:hover {
          background: white;
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .chat-toggle-icon {
          font-size: 20px;
          color: #2c3e50;
          font-weight: 500;
        }

        .chat-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          border-radius: 10px;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          border: 2px solid white;
        }

        .chat-panel {
          position: fixed;
          top: 70px;
          left: 16px;
          right: 16px;
          bottom: 180px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(44, 62, 80, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          display: flex;
          flex-direction: column;
          opacity: ${isVisible ? '1' : '0'};
          transform: ${isVisible ? 'translateY(0)' : 'translateY(-20px)'};
          pointer-events: ${isVisible ? 'auto' : 'none'};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(44, 62, 80, 0.1);
          background: rgba(248, 250, 252, 0.8);
          border-radius: 16px 16px 0 0;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
        }

        .chat-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .chat-close:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #2c3e50;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          -webkit-overflow-scrolling: touch;
        }

        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
        }

        .chat-empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        .chat-empty p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          max-width: 200px;
        }

        .message {
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: messageSlideIn 0.3s ease;
        }

        .message.user {
          align-items: flex-end;
        }

        .message.assistant {
          align-items: flex-start;
        }

        .message-content {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .message.user .message-content {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          border-bottom-right-radius: 6px;
        }

        .message.assistant .message-content {
          background: #f1f5f9;
          color: #334155;
          border-bottom-left-radius: 6px;
          border: 1px solid rgba(44, 62, 80, 0.06);
        }

        .message-time {
          font-size: 11px;
          color: #94a3b8;
          padding: 0 8px;
        }

        .scroll-to-bottom {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #3498db;
          color: white;
          border: none;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .scroll-to-bottom:hover {
          background: #2980b9;
          transform: scale(1.1);
        }

        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 375px) {
          .chat-panel {
            left: 12px;
            right: 12px;
          }

          .message-content {
            max-width: 85%;
            padding: 10px 14px;
            font-size: 13px;
          }

          .chat-header {
            padding: 12px 16px;
          }

          .chat-messages {
            padding: 12px;
          }
        }

        @media (max-height: 600px) {
          .chat-panel {
            bottom: 140px;
          }
        }
      `}</style>
    </div>
  );
}