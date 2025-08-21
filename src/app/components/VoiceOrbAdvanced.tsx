"use client";
import React, { useEffect, useState } from 'react';
import styles from './VoiceOrbAdvanced.module.css';

interface VoiceOrbAdvancedProps {
  isUserSpeaking?: boolean;
  isAssistantSpeaking?: boolean;
  isConnected?: boolean;
  isListening?: boolean;
}

export default function VoiceOrbAdvanced({ 
  isUserSpeaking = false, 
  isAssistantSpeaking = false,
  isConnected = false,
  isListening = false 
}: VoiceOrbAdvancedProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0);

  // Dynamic pulse intensity based on speaking
  useEffect(() => {
    if (isUserSpeaking || isAssistantSpeaking) {
      const interval = setInterval(() => {
        setPulseIntensity(Math.random() * 0.5 + 0.5);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setPulseIntensity(0);
    }
  }, [isUserSpeaking, isAssistantSpeaking]);

  // Determine orb state for styling
  const getOrbState = () => {
    if (isUserSpeaking) return 'userSpeaking';
    if (isAssistantSpeaking) return 'assistantSpeaking';
    if (isListening) return 'listening';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  const orbState = getOrbState();

  return (
    <div className={styles.orbContainer}>
      {/* Outer glow layers */}
      <div className={`${styles.glowLayer} ${styles.glowOuter} ${styles[orbState]}`} />
      <div className={`${styles.glowLayer} ${styles.glowMiddle} ${styles[orbState]}`} />
      <div className={`${styles.glowLayer} ${styles.glowInner} ${styles[orbState]}`} />
      
      {/* Wave rings for speaking states */}
      {(isUserSpeaking || isAssistantSpeaking) && (
        <>
          <div className={`${styles.waveRing} ${styles.wave1} ${styles[orbState]}`} />
          <div className={`${styles.waveRing} ${styles.wave2} ${styles[orbState]}`} />
          <div className={`${styles.waveRing} ${styles.wave3} ${styles[orbState]}`} />
        </>
      )}
      
      {/* Main orb with glass morphism */}
      <div className={`${styles.orbMain} ${styles[orbState]}`}>
        <div className={styles.orbInner}>
          {/* Gradient overlay */}
          <div className={`${styles.gradientOverlay} ${styles[orbState]}`} />
          
          {/* Specular highlight for 3D effect */}
          <div className={styles.specularHighlight} />
          
          {/* Dynamic pulse overlay */}
          {(isUserSpeaking || isAssistantSpeaking) && (
            <div 
              className={styles.pulseOverlay} 
              style={{ opacity: pulseIntensity * 0.3 }}
            />
          )}
          
          {/* Voice frequency bars */}
          {(isUserSpeaking || isAssistantSpeaking) && (
            <div className={styles.frequencyBars}>
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`${styles.bar} ${styles[orbState]}`}
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    height: `${20 + Math.random() * 30}%`
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Status indicator dots */}
        {isConnected && (
          <div className={styles.statusDots}>
            <div className={`${styles.dot} ${styles[orbState]}`} />
            <div className={`${styles.dot} ${styles[orbState]}`} style={{ animationDelay: '0.3s' }} />
            <div className={`${styles.dot} ${styles[orbState]}`} style={{ animationDelay: '0.6s' }} />
          </div>
        )}
      </div>
      
      {/* Particle effects for ambiance */}
      {isConnected && (
        <div className={styles.particles}>
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={styles.particle}
              style={{ 
                animationDelay: `${i * 0.5}s`,
                left: `${20 + i * 10}%`,
                animationDuration: `${3 + i * 0.5}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}