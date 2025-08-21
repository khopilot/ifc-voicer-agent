"use client";
import React, { useEffect, useRef } from 'react';

interface VoiceOrbProProps {
  isSpeaking?: boolean;
  isConnected?: boolean;
}

export default function VoiceOrbPro({ isSpeaking = false, isConnected = false }: VoiceOrbProProps) {
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
      
      // Draw outer glow layers
      if (isConnected) {
        // Multiple glow layers for depth
        for (let i = 3; i >= 0; i--) {
          const glowRadius = baseRadius + (i * 30) + (isSpeaking ? 20 : 0);
          const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowRadius
          );
          
          const alpha = isSpeaking ? 0.08 : 0.04;
          gradient.addColorStop(0, `rgba(44, 62, 80, 0)`);
          gradient.addColorStop(0.5, `rgba(52, 73, 94, ${alpha * (4-i) / 4})`);
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
        
        // Organic breathing effect
        const breathing = Math.sin(timeRef.current * 2) * 3;
        const noise = Math.sin(angle * 4 + timeRef.current) * 2;
        
        const radius = baseRadius + breathing + audioInfluence + noise;
        
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
      
      if (isSpeaking) {
        // Active state - vibrant navy to grey
        mainGradient.addColorStop(0, '#4A5F7A');
        mainGradient.addColorStop(0.3, '#2C3E50');
        mainGradient.addColorStop(0.7, '#1A252F');
        mainGradient.addColorStop(1, '#0F1419');
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
      
      innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      innerGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = innerGlow;
      ctx.fill();
      
      // Edge highlight for definition
      ctx.strokeStyle = isConnected 
        ? 'rgba(52, 73, 94, 0.3)' 
        : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
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
      
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
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
          ctx.fillStyle = isSpeaking ? '#5D6D7E' : '#34495E';
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
  }, [isSpeaking, isConnected]);

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