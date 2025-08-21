"use client";
import React, { useEffect, useRef, useState } from 'react';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pulsePhase: number;
  baseRadius: number;
}

interface OrbsAnimationProps {
  isSpeaking?: boolean;
  isConnected?: boolean;
}

export default function OrbsAnimation({ isSpeaking = false, isConnected = false }: OrbsAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const animationIdRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  // Institut français colors - Navy blue with better visibility
  const colors = [
    '#002B5B', // Navy blue
    '#003A70', // Bright navy
    '#0056A6', // French blue
    '#1E5BA8', // Lighter French blue
    '#4B7BCA', // Sky blue accent
    '#6B8DD6', // Light blue
    '#005CE6', // Bright French blue
    '#3366CC', // Royal blue
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initOrbs();
    };

    // Initialize orbs
    const initOrbs = () => {
      const orbCount = 15; // More orbs for better effect
      orbsRef.current = [];

      for (let i = 0; i < orbCount; i++) {
        const radius = Math.random() * 80 + 60; // Much larger orbs (60-140px)
        orbsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: radius,
          baseRadius: radius,
          color: colors[Math.floor(Math.random() * colors.length)],
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas completely for crisp orbs
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Add gradient background for professional look
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, 'rgba(240, 245, 255, 0.02)');
      bgGradient.addColorStop(1, 'rgba(0, 20, 60, 0.08)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw orbs
      orbsRef.current.forEach((orb, index) => {
        // Update position
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Bounce off walls
        if (orb.x - orb.radius < 0 || orb.x + orb.radius > canvas.width) {
          orb.vx *= -1;
        }
        if (orb.y - orb.radius < 0 || orb.y + orb.radius > canvas.height) {
          orb.vy *= -1;
        }

        // Mouse interaction
        const dx = mouseRef.current.x - orb.x;
        const dy = mouseRef.current.y - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) {
          const force = (200 - distance) / 200;
          orb.vx -= (dx / distance) * force * 0.05;
          orb.vy -= (dy / distance) * force * 0.05;
        }

        // Limit velocity
        const maxSpeed = 1.5;
        const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        if (speed > maxSpeed) {
          orb.vx = (orb.vx / speed) * maxSpeed;
          orb.vy = (orb.vy / speed) * maxSpeed;
        }

        // Pulse effect
        orb.pulsePhase += 0.02;
        const pulseFactor = isSpeaking ? 1.5 : 1.0;
        const basePulse = Math.sin(orb.pulsePhase) * 0.1 + 1;
        orb.radius = orb.baseRadius * basePulse * pulseFactor;

        // Speaking animation - DRAMATIC REACTION
        if (isSpeaking) {
          // Explosive movement
          orb.vx += (Math.random() - 0.5) * 0.8;
          orb.vy += (Math.random() - 0.5) * 0.8;
          
          // Pulsating size
          const speakPulse = Math.sin(Date.now() * 0.01 + orb.pulsePhase) * 0.3 + 1.3;
          orb.radius = orb.baseRadius * speakPulse;
        }

        // Draw orb with gradient
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.radius
        );
        
        // Add color stops for beautiful gradient - MORE VISIBLE
        gradient.addColorStop(0, orb.color + 'FF'); // Full opacity at center
        gradient.addColorStop(0.4, orb.color + 'DD');
        gradient.addColorStop(0.7, orb.color + '88');
        gradient.addColorStop(1, orb.color + '22'); // More visible at edge

        // Draw the orb
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add strong glow effect for visibility
        ctx.shadowBlur = isSpeaking ? 60 : 40;
        ctx.shadowColor = orb.color;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fill();
        
        // Double fill for more intensity
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connections between nearby orbs
        orbsRef.current.forEach((otherOrb, otherIndex) => {
          if (otherIndex <= index) return;
          
          const orbDistance = Math.sqrt(
            Math.pow(orb.x - otherOrb.x, 2) + 
            Math.pow(orb.y - otherOrb.y, 2)
          );
          
          if (orbDistance < 250) {
            const opacity = (1 - orbDistance / 250) * 0.3;
            ctx.beginPath();
            ctx.moveTo(orb.x, orb.y);
            ctx.lineTo(otherOrb.x, otherOrb.y);
            ctx.strokeStyle = `rgba(0, 43, 91, ${opacity})`;
            ctx.lineWidth = isSpeaking ? 2 : 1;
            ctx.stroke();
          }
        });
      });

      // Connection status indicator
      if (isConnected) {
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(canvas.width - 30, 30, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulse animation for connected status
        const pulse = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
        ctx.beginPath();
        ctx.arc(canvas.width - 30, 30, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
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
        opacity: 1,
        mixBlendMode: 'normal',
        pointerEvents: 'none',
      }}
    />
  );
}