"use client";
import React from 'react';

export default function IFCLogoWatermark() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Ultra minimal watermark */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(150, 150)">
            {/* Very subtle IF logo */}
            <g opacity="0.03">
              {/* Letter I */}
              <rect x="-50" y="-40" width="15" height="80" fill="#34495E"/>
              
              {/* Letter F */}
              <rect x="-15" y="-40" width="15" height="80" fill="#34495E"/>
              <rect x="-15" y="-40" width="50" height="15" fill="#34495E"/>
              <rect x="-15" y="-8" width="35" height="12" fill="#34495E"/>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}