/**
 * Sophisticated Haptic Feedback Manager for IFC Voice Assistant
 * Provides rich tactile feedback patterns for enhanced user experience
 */

export type HapticPattern = number | number[];

export interface HapticPatterns {
  // Connection Events
  connectSuccess: HapticPattern;
  connectFailed: HapticPattern;
  disconnect: HapticPattern;
  
  // Agent & Voice Events
  agentHandoff: HapticPattern;
  assistantStartSpeaking: HapticPattern;
  assistantStopSpeaking: HapticPattern;
  
  // Voice Interaction (Enhanced)
  pttPress: HapticPattern;
  pttRelease: HapticPattern;
  voiceRecordingError: HapticPattern;
  
  // Mobile & System Events
  audioUnlockSuccess: HapticPattern;
  languageSwitch: HapticPattern;
  navigationTap: HapticPattern;
  
  // Error & Warning Events
  connectionError: HapticPattern;
  audioError: HapticPattern;
}

class HapticManager {
  private static instance: HapticManager;
  private isEnabled: boolean = true;
  private isSupported: boolean = false;
  
  // Sophisticated haptic patterns
  private patterns: HapticPatterns = {
    // Connection Events - Welcoming and informative
    connectSuccess: [50, 30, 100],        // Double-pulse success
    connectFailed: [100, 50, 100, 50, 100], // Triple-pulse error
    disconnect: [80],                      // Single decisive pulse
    
    // Agent & Voice Events - Smooth and contextual  
    agentHandoff: [30, 20, 60],           // Smooth transition
    assistantStartSpeaking: [25],         // Subtle notification
    assistantStopSpeaking: [15],          // Gentle completion
    
    // Voice Interaction - Refined tactile confirmation
    pttPress: [12],                       // Crisp press confirmation
    pttRelease: [8],                      // Soft release confirmation
    voiceRecordingError: [50, 50, 50],    // Attention pattern
    
    // Mobile & System Events - Informative feedback
    audioUnlockSuccess: [40, 20, 40],     // Success confirmation
    languageSwitch: [30, 15, 30],         // Change notification
    navigationTap: [8],                   // Subtle tap feedback
    
    // Error & Warning Events - Escalated attention
    connectionError: [100, 50, 100, 50, 100], // Urgent attention
    audioError: [80, 40, 80],             // Moderate warning
  };
  
  private constructor() {
    this.checkSupport();
    this.loadUserPreferences();
  }
  
  public static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager();
    }
    return HapticManager.instance;
  }
  
  private checkSupport(): void {
    this.isSupported = 'vibrate' in navigator && typeof navigator.vibrate === 'function';
    
    if (this.isSupported) {
      console.log('🔸 Haptic feedback supported and enabled');
    } else {
      console.log('🔸 Haptic feedback not supported on this device');
    }
  }
  
  private loadUserPreferences(): void {
    // Check for user haptic preference (could be from localStorage, system settings, etc.)
    const userPreference = localStorage.getItem('ifc-haptic-enabled');
    if (userPreference !== null) {
      this.isEnabled = userPreference === 'true';
    }
    
    // Respect system haptic preferences if available
    if ('matchMedia' in window) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (prefersReducedMotion.matches) {
        this.isEnabled = false;
        console.log('🔸 Haptic feedback disabled due to reduced motion preference');
      }
    }
  }
  
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('ifc-haptic-enabled', enabled.toString());
    console.log(`🔸 Haptic feedback ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  public isHapticEnabled(): boolean {
    return this.isEnabled && this.isSupported;
  }
  
  public trigger(patternName: keyof HapticPatterns, intensity: number = 1): void {
    if (!this.isHapticEnabled()) return;
    
    try {
      const pattern = this.patterns[patternName];
      
      if (typeof pattern === 'number') {
        navigator.vibrate(Math.round(pattern * intensity));
      } else if (Array.isArray(pattern)) {
        const adjustedPattern = pattern.map(duration => Math.round(duration * intensity));
        navigator.vibrate(adjustedPattern);
      }
      
      console.log(`🔸 Haptic: ${patternName} triggered (intensity: ${intensity})`);
    } catch (error) {
      console.warn('🔸 Haptic feedback error:', error);
    }
  }
  
  // Convenience methods for common patterns
  public success(): void {
    this.trigger('connectSuccess');
  }
  
  public error(): void {
    this.trigger('connectionError');
  }
  
  public tap(): void {
    this.trigger('navigationTap');
  }
  
  public transition(): void {
    this.trigger('agentHandoff');
  }
  
  // Custom pattern method for special cases
  public custom(pattern: HapticPattern): void {
    if (!this.isHapticEnabled()) return;
    
    try {
      navigator.vibrate(pattern);
      console.log('🔸 Haptic: Custom pattern triggered');
    } catch (error) {
      console.warn('🔸 Custom haptic feedback error:', error);
    }
  }
  
  // Stop all haptic feedback
  public stop(): void {
    if (this.isSupported) {
      navigator.vibrate(0);
    }
  }
}

// Export singleton instance
export const hapticManager = HapticManager.getInstance();

// Export convenience function
export const haptic = (patternName: keyof HapticPatterns, intensity?: number) => {
  hapticManager.trigger(patternName, intensity);
};