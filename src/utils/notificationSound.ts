/**
 * Notification Sound Utility
 * Handles audio playback across different deployment environments
 * Works with local, Vercel, Render, and other deployment platforms
 */

let audioElement: HTMLAudioElement | null = null;
let isInitialized = false;

const possiblePaths = [
  '/notification.mp3',
  '/public/notification.mp3',
  process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/notification.mp3` : null,
  // Fallback with base path in case app is in a subdirectory
  `${window.location.pathname.split('/').slice(0, -1).join('/')}/notification.mp3`
].filter(Boolean) as string[];

/**
 * Initialize audio element with fallback paths
 */
const initializeAudio = async (): Promise<void> => {
  if (isInitialized && audioElement) return;

  try {
    audioElement = new Audio();
    audioElement.preload = 'auto';

    // Try each path until one works
    let pathFound = false;
    for (const path of possiblePaths) {
      try {
        const response = await fetch(path, { method: 'HEAD' });
        if (response.ok) {
          audioElement.src = path;
          pathFound = true;
          console.log(`✅ Notification sound loaded from: ${path}`);
          break;
        }
      } catch {
        // Continue to next path
        continue;
      }
    }

    if (!pathFound) {
      // Fallback: try the first path anyway (might work in browser even if HEAD fails)
      audioElement.src = possiblePaths[0];
      console.warn(`⚠️ Could not verify audio path, using fallback: ${possiblePaths[0]}`);
    }

    isInitialized = true;
  } catch (error) {
    console.error('❌ Failed to initialize audio element:', error);
    audioElement = null;
    isInitialized = true; // Mark as initialized to prevent retry loops
  }
};

/**
 * Play notification sound
 * Handles errors gracefully and works across browsers
 */
export const playNotificationSound = async (): Promise<boolean> => {
  try {
    // Initialize audio if needed
    if (!isInitialized) {
      await initializeAudio();
    }

    if (!audioElement) {
      console.warn('⚠️ Audio element not available');
      return false;
    }

    // Reset and play
    audioElement.currentTime = 0;
    
    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      await playPromise;
      console.log('✅ Notification sound played');
      return true;
    }

    return true;
  } catch (error) {
    console.warn('⚠️ Failed to play notification sound:', error);
    
    // The error might be due to browser autoplay policies
    // This is expected in some cases and is not a critical failure
    return false;
  }
};

/**
 * Preload notification sound (call on app initialization)
 */
export const preloadNotificationSound = async (): Promise<void> => {
  try {
    await initializeAudio();
  } catch (error) {
    console.warn('⚠️ Failed to preload notification sound:', error);
  }
};

/**
 * Stop current playback
 */
export const stopNotificationSound = (): void => {
  if (audioElement) {
    try {
      audioElement.pause();
      audioElement.currentTime = 0;
    } catch (error) {
      console.warn('⚠️ Failed to stop audio:', error);
    }
  }
};
