"use client";
import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

export default function AnimatedBackgroundWrapper() {
  return (
    <AnimatedBackground
      animationName="floatingBubbles"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.3,
      }}
      colors={['#002B5B', '#8B1538', '#FFD700', '#1E90FF', '#FF6B6B']}
      numElements={35}
      elementSize={80}
      elementSpeed={0.5}
      interactive={true}
    />
  );
}