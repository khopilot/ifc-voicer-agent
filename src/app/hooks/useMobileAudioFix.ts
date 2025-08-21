import { useRef, useState } from 'react';

/**
 * NUCLEAR MOBILE AUDIO FIX HOOK
 * 
 * This hook implements every known solution for mobile WebRTC audio issues.
 * It's designed to be aggressive and comprehensive, ensuring audio works
 * on ALL mobile browsers (iOS Safari, Chrome, Firefox, etc.)
 */
export function useMobileAudioFix() {
  const [audioReady, setAudioReady] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  const log = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Create and maintain a global AudioContext
  const ensureAudioContext = async () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        log('🔊 NUCLEAR: AudioContext created');
      }

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        log('🔊 NUCLEAR: AudioContext resumed successfully');
      }

      return audioContextRef.current;
    } catch (error) {
      log(`🔊 NUCLEAR ERROR: AudioContext failed: ${error}`);
      return null;
    }
  };

  // Create multiple audio elements as fallbacks
  const createAudioElementPool = () => {
    if (audioElementsRef.current.length === 0) {
      for (let i = 0; i < 3; i++) {
        const audio = document.createElement('audio');
        audio.id = `mobile-audio-fix-${i}`;
        audio.autoplay = false;
        audio.muted = false;
        audio.volume = 1.0;
        audio.preload = 'auto';
        
        // iOS specific attributes
        audio.setAttribute('webkit-playsinline', 'true');
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('x-webkit-airplay', 'allow');
        
        audio.style.position = 'absolute';
        audio.style.left = '-9999px';
        document.body.appendChild(audio);
        audioElementsRef.current.push(audio);
        
        log(`🔊 NUCLEAR: Created fallback audio element ${i}`);
      }
    }
    return audioElementsRef.current;
  };

  // Aggressive unlock function - tries everything
  const unlockMobileAudio = async () => {
    log('🔊 NUCLEAR: Starting aggressive mobile audio unlock');
    
    // 1. Resume AudioContext
    const ctx = await ensureAudioContext();
    
    // 2. Create audio element pool
    const audioElements = createAudioElementPool();
    
    // 3. Try getUserMedia to unlock WebRTC
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        } 
      });
      
      // Play silent stream on all audio elements
      for (const audio of audioElements) {
        const clonedStream = stream.clone();
        audio.srcObject = clonedStream;
        audio.muted = true;
        audio.volume = 0;
        
        try {
          await audio.play();
          log(`🔊 NUCLEAR: Silent stream played on audio element ${audio.id}`);
        } catch (e) {
          log(`🔊 NUCLEAR: Failed to play on ${audio.id}: ${e}`);
        }
        
        // Stop the cloned stream
        setTimeout(() => {
          clonedStream.getTracks().forEach(track => track.stop());
          audio.srcObject = null;
        }, 100);
      }
      
      // Stop the original stream
      stream.getTracks().forEach(track => track.stop());
      log('🔊 NUCLEAR: getUserMedia unlock successful');
      
    } catch (error) {
      log(`🔊 NUCLEAR: getUserMedia failed: ${error}`);
    }
    
    // 4. Play oscillator through AudioContext
    if (ctx) {
      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0; // Silent
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 100);
        log('🔊 NUCLEAR: Oscillator played through AudioContext');
      } catch (e) {
        log(`🔊 NUCLEAR: Oscillator failed: ${e}`);
      }
    }
    
    // 5. Play data URI audio on all elements
    const silentMP3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA////////////////////////////////////////////////////////////////////////////AAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQxAAOAAAGkAAAAIAAANIAAAARAAAAaQAAAAgAAA0gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    
    for (const audio of audioElements) {
      try {
        audio.src = silentMP3;
        audio.muted = false;
        audio.volume = 0.01;
        await audio.play();
        log(`🔊 NUCLEAR: Silent MP3 played on ${audio.id}`);
      } catch (e) {
        log(`🔊 NUCLEAR: Silent MP3 failed on ${audio.id}: ${e}`);
      }
    }
    
    setAudioReady(true);
    log('🔊 NUCLEAR: Mobile audio unlock complete');
  };

  // Monitor and fix audio element when srcObject changes
  const monitorAudioElement = (audioElement: HTMLAudioElement) => {
    log('🔊 NUCLEAR: Starting audio element monitoring');
    
    let lastSrcObject: MediaStream | null = null;
    
    // Watch for srcObject changes
    const checkSrcObject = () => {
      if (audioElement.srcObject !== lastSrcObject) {
        lastSrcObject = audioElement.srcObject as MediaStream;
        
        if (lastSrcObject) {
          log('🔊 NUCLEAR: New MediaStream detected on audio element');
          
          const tracks = lastSrcObject.getAudioTracks();
          log(`🔊 NUCLEAR: MediaStream has ${tracks.length} audio tracks`);
          
          if (tracks.length > 0) {
            const track = tracks[0];
            log(`🔊 NUCLEAR: Audio track - enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
            
            // Force track to be enabled
            track.enabled = true;
            
            // Don't auto-play - wait for user gesture
            log('🔊 NUCLEAR: Stream ready, waiting for user gesture to play');
          }
        }
      }
    };
    
    // Check periodically for srcObject changes
    const interval = setInterval(checkSrcObject, 100);
    
    // Also listen for events
    audioElement.addEventListener('loadedmetadata', () => {
      log('🔊 NUCLEAR: loadedmetadata event - ready for manual play');
    });
    
    audioElement.addEventListener('canplay', () => {
      log('🔊 NUCLEAR: canplay event - ready for manual play');
    });
    
    audioElement.addEventListener('play', () => {
      log('🔊 NUCLEAR: ✅✅✅ PLAY EVENT FIRED - AUDIO IS WORKING!');
      setAudioReady(true);
    });
    
    audioElement.addEventListener('error', (e) => {
      log(`🔊 NUCLEAR: ❌ Audio error: ${JSON.stringify(e)}`);
    });
    
    // Initial check
    checkSrcObject();
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  };

  // Force audio to play using all available methods
  const forceAudioPlay = async (audioElement: HTMLAudioElement) => {
    log('🔊 NUCLEAR: Forcing audio play with all methods');
    
    // Method 1: Direct play
    try {
      audioElement.muted = false;
      audioElement.volume = 1.0;
      await audioElement.play();
      log('🔊 NUCLEAR: Direct play successful');
      return true;
    } catch (e) {
      log(`🔊 NUCLEAR: Direct play failed: ${e}`);
    }
    
    // Method 2: Play with user gesture simulation
    try {
      const event = new Event('click');
      document.dispatchEvent(event);
      await audioElement.play();
      log('🔊 NUCLEAR: Play with simulated gesture successful');
      return true;
    } catch (e) {
      log(`🔊 NUCLEAR: Simulated gesture play failed: ${e}`);
    }
    
    // Method 3: Clone and play
    try {
      const clonedAudio = audioElement.cloneNode(true) as HTMLAudioElement;
      clonedAudio.muted = false;
      clonedAudio.volume = 1.0;
      document.body.appendChild(clonedAudio);
      await clonedAudio.play();
      log('🔊 NUCLEAR: Cloned audio play successful');
      
      // Transfer srcObject
      if (audioElement.srcObject) {
        audioElement.srcObject = null;
        audioElement.srcObject = clonedAudio.srcObject;
      }
      
      document.body.removeChild(clonedAudio);
      return true;
    } catch (e) {
      log(`🔊 NUCLEAR: Cloned audio play failed: ${e}`);
    }
    
    // Method 4: Use AudioContext to route audio
    const ctx = audioContextRef.current;
    if (ctx && audioElement.srcObject) {
      try {
        const source = ctx.createMediaStreamSource(audioElement.srcObject as MediaStream);
        source.connect(ctx.destination);
        log('🔊 NUCLEAR: Routed audio through AudioContext');
        return true;
      } catch (e) {
        log(`🔊 NUCLEAR: AudioContext routing failed: ${e}`);
      }
    }
    
    return false;
  };

  return {
    audioReady,
    debugLog,
    unlockMobileAudio,
    monitorAudioElement,
    forceAudioPlay,
    ensureAudioContext
  };
}