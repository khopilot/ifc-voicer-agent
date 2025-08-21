"use client";
import React, { useEffect, useRef } from 'react';

interface VoiceOrbProProps {
  isSpeaking?: boolean;
  isConnected?: boolean;
  isRecording?: boolean;
}

export default function VoiceOrbPro({ isSpeaking = false, isConnected = false, isRecording = false }: VoiceOrbProProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>(0);
  const timeRef = useRef(0);
  const audioLevelsRef = useRef<number[]>([]);
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, life: number}>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // High DPI setup for crisp rendering
    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
      
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    // Initialize audio levels for smooth animation
    const initAudioLevels = () => {
      audioLevelsRef.current = Array(32).fill(0);
    };

    // Smooth audio simulation
    const updateAudioLevels = () => {
      if (isSpeaking) {
        audioLevelsRef.current = audioLevelsRef.current.map((level, i) => {
          const target = Math.sin(timeRef.current * 0.1 + i * 0.5) * 0.5 + 0.5;
          return level + (target - level) * 0.15;
        });
      } else {
        audioLevelsRef.current = audioLevelsRef.current.map(level => level * 0.92);
      }
    };

    // Create particles for ambient effect
    const createParticle = (centerX: number, centerY: number) => {
      if (particlesRef.current.length < 50 && Math.random() < 0.1) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = (Math.random() * 0.5 + 0.5) * (isSpeaking ? 2 : 0.5);
        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 1.0
        });
      }
    };

    // Main render loop
    const render = () => {
      if (!ctx || !canvas) return;

      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Update time
      timeRef.current += isSpeaking ? 0.025 : 0.008;
      
      // Update audio levels
      updateAudioLevels();
      
      // Base radius
      const baseRadius = isConnected ? 80 : 70;
      
      // Draw outer glow layers with enhanced effects
      if (isConnected) {
        // Multiple glow layers for depth
        for (let i = 3; i >= 0; i--) {
          const glowRadius = baseRadius + (i * 35) + (isSpeaking ? 25 : 0) + (isRecording ? 15 : 0);
          const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowRadius
          );
          
          // Enhanced glow colors and intensity
          let glowColor, alpha;
          if (isRecording) {
            // Red glow when recording
            glowColor = 'rgb(239, 68, 68)';
            alpha = 0.12 + Math.sin(timeRef.current * 8) * 0.04; // Pulsing effect
          } else if (isSpeaking) {
            // Blue glow when speaking
            glowColor = 'rgb(52, 152, 219)';
            alpha = 0.1 + Math.sin(timeRef.current * 4) * 0.03;
          } else {
            // Subtle default glow
            glowColor = 'rgb(52, 73, 94)';
            alpha = 0.04;
          }
          
          gradient.addColorStop(0, `rgba(44, 62, 80, 0)`);
          gradient.addColorStop(0.3, `${glowColor.replace('rgb', 'rgba').replace(')', `, ${alpha * (4-i) / 6})`)}`);
          gradient.addColorStop(0.7, `${glowColor.replace('rgb', 'rgba').replace(')', `, ${alpha * (4-i) / 8})`)}`);
          gradient.addColorStop(1, `rgba(44, 62, 80, 0)`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
      }
      
      // Draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.01;
        
        if (particle.life > 0) {
          ctx.save();
          ctx.globalAlpha = particle.life * 0.5;
          ctx.fillStyle = '#34495E';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return true;
        }
        return false;
      });
      
      // Create new particles
      if (isConnected) {
        createParticle(centerX, centerY);
      }
      
      // Draw main orb with perfect smoothness
      ctx.save();
      
      // Create the main shape path
      ctx.beginPath();
      
      const segments = 128; // High resolution for perfect smoothness
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        
        // Audio reactive distortion
        let audioInfluence = 0;
        if (isSpeaking) {
          const audioIndex = Math.floor((i / segments) * audioLevelsRef.current.length);
          audioInfluence = audioLevelsRef.current[audioIndex] * 15;
        }
        
        // Enhanced organic effects
        const breathing = Math.sin(timeRef.current * (isRecording ? 4 : 2)) * (isRecording ? 5 : 3);
        const noise = Math.sin(angle * 4 + timeRef.current) * (isSpeaking ? 3 : 2);
        const recordingPulse = isRecording ? Math.sin(timeRef.current * 6) * 4 : 0;
        
        const radius = baseRadius + breathing + audioInfluence + noise + recordingPulse;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Use quadratic curves for ultra-smooth edges
          const prevAngle = ((i - 1) / segments) * Math.PI * 2;
          const prevX = centerX + Math.cos(prevAngle) * radius;
          const prevY = centerY + Math.sin(prevAngle) * radius;
          const cpX = (x + prevX) / 2;
          const cpY = (y + prevY) / 2;
          ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
        }
      }
      
      ctx.closePath();
      
      // Main gradient fill - French Institute navy blue to grey
      const mainGradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.3, centerY - baseRadius * 0.3, 0,
        centerX, centerY, baseRadius * 1.2
      );
      
      if (isRecording) {
        // Recording state - red gradient with pulse
        const intensity = 0.8 + Math.sin(timeRef.current * 6) * 0.2;
        mainGradient.addColorStop(0, `rgba(239, 68, 68, ${intensity})`);
        mainGradient.addColorStop(0.3, '#DC2626');
        mainGradient.addColorStop(0.7, '#B91C1C');
        mainGradient.addColorStop(1, '#7F1D1D');
      } else if (isSpeaking) {
        // Speaking state - enhanced blue gradient
        const intensity = 0.8 + Math.sin(timeRef.current * 4) * 0.15;
        mainGradient.addColorStop(0, `rgba(52, 152, 219, ${intensity * 0.6})`);
        mainGradient.addColorStop(0.3, '#3498DB');
        mainGradient.addColorStop(0.7, '#2980B9');
        mainGradient.addColorStop(1, '#1F4E79');
      } else if (isConnected) {
        // Connected state - calm navy blue to grey
        mainGradient.addColorStop(0, '#34495E');
        mainGradient.addColorStop(0.5, '#2C3E50');
        mainGradient.addColorStop(1, '#1C2833');
      } else {
        // Disconnected state - muted grey
        mainGradient.addColorStop(0, '#5D6D7E');
        mainGradient.addColorStop(0.5, '#34495E');
        mainGradient.addColorStop(1, '#2C3E50');
      }
      
      ctx.fillStyle = mainGradient;
      ctx.fill();
      
      // Inner glow for depth
      const innerGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * 0.8
      );
      
      // Enhanced inner glow based on state
      if (isRecording) {
        innerGlow.addColorStop(0, 'rgba(255, 200, 200, 0.3)');
        innerGlow.addColorStop(0.5, 'rgba(255, 150, 150, 0.1)');
        innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else if (isSpeaking) {
        innerGlow.addColorStop(0, 'rgba(200, 230, 255, 0.3)');
        innerGlow.addColorStop(0.5, 'rgba(150, 200, 255, 0.1)');
        innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        innerGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      
      ctx.fillStyle = innerGlow;
      ctx.fill();
      
      // Enhanced edge highlight based on state
      if (isRecording) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
      } else if (isSpeaking) {
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
        ctx.lineWidth = 1.8;
      } else if (isConnected) {
        ctx.strokeStyle = 'rgba(52, 73, 94, 0.3)';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
      }
      ctx.stroke();
      
      // Add specular highlight for 3D effect
      ctx.beginPath();
      const highlightRadius = baseRadius * 0.3;
      const highlightGradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.25, 
        centerY - baseRadius * 0.25,
        0,
        centerX - baseRadius * 0.25,
        centerY - baseRadius * 0.25,
        highlightRadius
      );
      
      // State-based specular highlight
      if (isRecording) {
        highlightGradient.addColorStop(0, 'rgba(255, 220, 220, 0.5)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 200, 200, 0.15)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else if (isSpeaking) {
        highlightGradient.addColorStop(0, 'rgba(220, 240, 255, 0.5)');
        highlightGradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.15)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      
      ctx.arc(
        centerX - baseRadius * 0.25,
        centerY - baseRadius * 0.25,
        highlightRadius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = highlightGradient;
      ctx.fill();
      
      ctx.restore();
      
      // Status dots animation
      if (isConnected) {
        const dotRadius = 3;
        const dotDistance = baseRadius + 20;
        
        for (let i = 0; i < 3; i++) {
          const angle = timeRef.current + (i * Math.PI * 2 / 3);
          const dotX = centerX + Math.cos(angle) * dotDistance;
          const dotY = centerY + Math.sin(angle) * dotDistance;
          const alpha = (Math.sin(timeRef.current * 3 + i) + 1) * 0.5;
          
          ctx.save();
          ctx.globalAlpha = alpha * 0.6 + 0.2;
          // Status dots color based on state
          if (isRecording) {
            ctx.fillStyle = '#EF4444';
          } else if (isSpeaking) {
            ctx.fillStyle = '#3498DB';
          } else {
            ctx.fillStyle = '#34495E';
          }
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      
      // Text removed - handled by parent component
      
      animationIdRef.current = requestAnimationFrame(render);
    };

    // Initialize and start
    setupCanvas();
    initAudioLevels();
    
    // Handle resize
    const handleResize = () => {
      setupCanvas();
    };
    window.addEventListener('resize', handleResize);
    
    // Start animation
    render();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isSpeaking, isConnected, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        zIndex: 1,
      }}
    />
  );
}