"use client";
import React, { useEffect, useRef } from 'react';

interface VoiceOrbProps {
  isSpeaking?: boolean;
  isConnected?: boolean;
}

export default function VoiceOrb({ isSpeaking = false, isConnected = false }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const noiseRef = useRef<number[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    // Initialize noise array for organic movement
    const initNoise = () => {
      noiseRef.current = [];
      for (let i = 0; i < 128; i++) {
        noiseRef.current.push(Math.random() * Math.PI * 2);
      }
    };

    // Simplex noise approximation for smooth animation
    const noise = (x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const g1 = noiseRef.current[(xi + yi * 57) % 128] || 0;
      const g2 = noiseRef.current[(xi + 1 + yi * 57) % 128] || 0;
      const g3 = noiseRef.current[(xi + (yi + 1) * 57) % 128] || 0;
      const g4 = noiseRef.current[(xi + 1 + (yi + 1) * 57) % 128] || 0;
      
      const sx = x - xi;
      const sy = y - yi;
      
      const mix1 = g1 * (1 - sx) + g2 * sx;
      const mix2 = g3 * (1 - sx) + g4 * sx;
      
      return mix1 * (1 - sy) + mix2 * sy;
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Center position
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Base radius with connection state
      const baseRadius = isConnected ? 120 : 100;
      const pulseAmount = isSpeaking ? 40 : 10;
      
      // Time for animation
      timeRef.current += isSpeaking ? 0.03 : 0.01;
      
      // Create morphing orb shape
      ctx.beginPath();
      
      const points = 64; // More points for smoother shape
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        
        // Multiple noise layers for organic movement
        const noise1 = noise(
          Math.cos(angle) * 2 + timeRef.current,
          Math.sin(angle) * 2 + timeRef.current
        );
        const noise2 = noise(
          Math.cos(angle) * 4 + timeRef.current * 0.5,
          Math.sin(angle) * 4 + timeRef.current * 0.5
        );
        const noise3 = noise(
          Math.cos(angle) * 8 + timeRef.current * 0.25,
          Math.sin(angle) * 8 + timeRef.current * 0.25
        );
        
        // Combine noise for radius variation
        const noiseValue = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;
        const radiusVariation = noiseValue * pulseAmount;
        
        // Calculate radius with speaking boost
        const speakingBoost = isSpeaking ? 
          Math.sin(timeRef.current * 8 + angle * 3) * 20 : 0;
        
        const radius = baseRadius + radiusVariation + speakingBoost;
        
        // Calculate point position
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      
      // Create gradient based on state
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * 1.5
      );
      
      if (isSpeaking) {
        // Active speaking - vibrant blue gradient
        gradient.addColorStop(0, '#0056A6');
        gradient.addColorStop(0.5, '#1E5BA8');
        gradient.addColorStop(1, 'rgba(30, 91, 168, 0.2)');
      } else if (isConnected) {
        // Connected but not speaking - calm blue
        gradient.addColorStop(0, '#002B5B');
        gradient.addColorStop(0.5, '#003A70');
        gradient.addColorStop(1, 'rgba(0, 58, 112, 0.1)');
      } else {
        // Disconnected - grey
        gradient.addColorStop(0, '#4B5563');
        gradient.addColorStop(0.5, '#6B7280');
        gradient.addColorStop(1, 'rgba(107, 114, 128, 0.1)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add glow effect
      if (isConnected) {
        ctx.shadowBlur = isSpeaking ? 80 : 40;
        ctx.shadowColor = isSpeaking ? '#1E5BA8' : '#003A70';
        ctx.fill();
        
        // Double glow for intensity when speaking
        if (isSpeaking) {
          ctx.shadowBlur = 120;
          ctx.shadowColor = '#4B7BCA';
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      
      // Add inner ring for depth
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.85, 0, Math.PI * 2);
      const innerGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * 0.85
      );
      
      if (isConnected) {
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      
      ctx.fillStyle = innerGradient;
      ctx.fill();
      
      // Add status text below orb
      ctx.font = '14px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isConnected ? '#6B7280' : '#9CA3AF';
      
      const statusText = isSpeaking ? 
        'Écoute...' : 
        isConnected ? 
        'En ligne' : 
        '';
      
      ctx.fillText(statusText, centerX, centerY + baseRadius + 60);
      
      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    resizeCanvas();
    initNoise();
    window.addEventListener('resize', resizeCanvas);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isSpeaking, isConnected]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{
        zIndex: 1,
      }}
    />
  );
}