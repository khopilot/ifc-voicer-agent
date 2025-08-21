"use client";
import React from 'react';

export default function IFCLogo() {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none" style={{ zIndex: 0 }}>
      <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stylized IF logo */}
        <g transform="translate(200, 200)">
          {/* Circle background */}
          <circle cx="0" cy="0" r="180" stroke="#2C3E50" strokeWidth="2" fill="none" opacity="0.3"/>
          
          {/* Inner circle */}
          <circle cx="0" cy="0" r="150" stroke="#34495E" strokeWidth="1" fill="none" opacity="0.2"/>
          
          {/* Letter I */}
          <rect x="-80" y="-60" width="30" height="120" fill="#2C3E50" opacity="0.4"/>
          
          {/* Letter F */}
          <rect x="-20" y="-60" width="30" height="120" fill="#2C3E50" opacity="0.4"/>
          <rect x="-20" y="-60" width="70" height="25" fill="#2C3E50" opacity="0.4"/>
          <rect x="-20" y="-10" width="60" height="20" fill="#2C3E50" opacity="0.4"/>
          
          {/* Text: CAMBODGE */}
          <text x="0" y="100" fontFamily="Arial, sans-serif" fontSize="20" fill="#34495E" textAnchor="middle" opacity="0.5">
            CAMBODGE
          </text>
          
          {/* Decorative elements */}
          <path d="M -120 -120 L -100 -100" stroke="#34495E" strokeWidth="1" opacity="0.2"/>
          <path d="M 120 -120 L 100 -100" stroke="#34495E" strokeWidth="1" opacity="0.2"/>
          <path d="M -120 120 L -100 100" stroke="#34495E" strokeWidth="1" opacity="0.2"/>
          <path d="M 120 120 L 100 100" stroke="#34495E" strokeWidth="1" opacity="0.2"/>
        </g>
      </svg>
    </div>
  );
}