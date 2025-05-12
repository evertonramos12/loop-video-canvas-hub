
import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoType } from '@/types';
import { Fullscreen, Play, Pause, SkipForward, SkipBack, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractYoutubeId, extractCanvaId } from '@/services/videoService';

interface VideoPlayerProps {
  videos: Video[];
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videos, autoPlay = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [isPortrait, setIsPortrait] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(30); // Default 30 seconds per video
  
  const currentVideo = videos[currentIndex];

  // Video time limits based on type (in seconds)
  const VIDEO_TIME_LIMITS = {
    [VideoType.YOUTUBE]: 0, // For YouTube we rely on events instead of timer
    [VideoType.CANVA]: 30, // 30 seconds for Canva presentations
  };

  // Force portrait orientation and fullscreen on mobile
  useEffect(() => {
    // Request fullscreen and portrait immediately
    const enterFullscreenAndPortrait = () => {
      if (playerContainerRef.current && !isFullscreen) {
        // Try to lock orientation to portrait if supported
        try {
          if (screen.orientation && 'lock' in screen.orientation) {
            (screen.orientation.lock as Function)('portrait')
              .then(() => {
                console.log('Screen locked to portrait mode');
                setIsPortrait(true);
                // Then enter fullscreen
                enterFullscreen();
              })
              .catch(err => {
                console.warn('Failed to lock orientation:', err);
                // Still try fullscreen even if orientation lock fails
                enterFullscreen();
              });
          } else {
            // Fallback for browsers without orientation API
            enterFullscreen();
          }
        } catch (err) {
          console.warn('Orientation API error:', err);
          enterFullscreen();
        }
      }
    };
    
    // Auto-trigger fullscreen and portrait on component mount
    if (videos.length > 0) {
      enterFullscreenAndPortrait();
    }
    
    // Check and handle orientation changes
    const handleOrientationChange = () => {
      const isLandscape = window.orientation === 90 || window.orientation === -90;
      setIsPortrait(!isLandscape);
    };
    
    // Check if device is mobile
    const isMobileDevice = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    // Check initial orientation
    if (window.orientation !== undefined) {
      handleOrientationChange();
    }
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      // Clear any active timers on unmount
      if (videoTimerRef.current) {
        clearTimeout(videoTimerRef.current);
      }
    };
  }, [videos.length, isFullscreen]);

  // Initialize timer when current video changes
  useEffect(() => {
    if (!currentVideo) return;

    // Start timer for non-YouTube videos or as fallback
    const startVideoTimer = () => {
      // Clear any existing timer
      if (videoTimerRef.current) {
        clearTimeout(videoTimerRef.current);
      }
      
      // Get time limit based on video type, default to 30 seconds
      const timeLimit = VIDEO_TIME_LIMITS[currentVideo.type] || 30;
      setRemainingTime(timeLimit);
      
      // Only set timer for Canva or if needed as fallback
      if (currentVideo.type === VideoType.CANVA || timeLimit > 0) {
        console.log(`Setting timer for ${timeLimit} seconds for video type: ${currentVideo.type}`);
        
        // Set countdown timer that ticks every second
        const intervalId = setInterval(() => {
          setRemainingTime(prev => {
            const newTime = prev - 1;
            if (newTime <= 0) {
              clearInterval(intervalId);
              handleVideoEnd();
              return 0;
            }
            return newTime;
          });
        }, 1000);
        
        // Store interval ID for cleanup
        videoTimerRef.current = intervalId as unknown as NodeJS.Timeout;
      }
    };

    // Start timer if video is playing
    if (isPlaying) {
      startVideoTimer();
    }

    return () => {
      // Clean up timer on video change
      if (videoTimerRef.current) {
        clearTimeout(videoTimerRef.current);
      }
    };
  }, [currentVideo, currentIndex, isPlaying]);

  // Function to go to previous video
  const goToPreviousVideo = () => {
    if (videos.length <= 1) return;
    
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex <= 0 ? videos.length - 1 : prevIndex - 1;
      console.log(`Moving to previous video: ${newIndex + 1}/${videos.length}`);
      return newIndex;
    });
  };

  // Function to handle video ending
  const handleVideoEnd = () => {
    console.log("Video ended, advancing to next video");
    // Clear any existing timer
    if (videoTimerRef.current) {
      clearTimeout(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    
    // Always loop through the playlist
    setTimeout(() => {
      goToNextVideo();
      setIsPlaying(true); // Ensure the next video starts playing
    }, 300);
  };

  // Function to advance to the next video
  const goToNextVideo = () => {
    if (videos.length <= 1) return;
    
    setCurrentIndex((prevIndex) => {
      // Always loop back to beginning when we reach the end
      const newIndex = (prevIndex + 1) % videos.length;
      console.log(`Moving to next video: ${newIndex + 1}/${videos.length}`);
      return newIndex;
    });
  };

  // Toggle looping on/off (even though we'll always loop)
  const toggleLooping = () => {
    setLoopEnabled(true); // Always keep looping enabled
    console.log("Looping is always enabled");
  };

  // Enhanced auto-play feature 
  useEffect(() => {
    if (videos.length === 0) return;
    
    // Subscribe to message events from YouTube iframe API
    const handleMessage = (event: MessageEvent) => {
      try {
        // Handle YouTube iframe API events
        if (
          typeof event.data === 'object' &&
          event.data.event === 'onStateChange'
        ) {
          // Video ended (state=0)
          if (event.data.info === 0) {
            console.log("YouTube video ended event detected");
            handleVideoEnd();
          }
          // Video error (state=-1)
          else if (event.data.info === -1) {
            console.log("YouTube video error detected, skipping to next");
            goToNextVideo();
          }
          // Video is playing (state=1)
          else if (event.data.info === 1) {
            setIsPlaying(true);
            // Clear any timer - rely on YouTube events instead
            if (currentVideo?.type === VideoType.YOUTUBE && videoTimerRef.current) {
              clearTimeout(videoTimerRef.current);
            }
          }
          // Video is paused (state=2)
          else if (event.data.info === 2) {
            setIsPlaying(false);
          }
        }
      } catch (error) {
        console.error("Error handling YouTube message:", error);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentIndex, videos, isPlaying, loopEnabled]);

  useEffect(() => {
    // Reset current index when videos change
    if (videos.length > 0 && currentIndex >= videos.length) {
      setCurrentIndex(0);
    }
    
    // Start playing from the beginning when videos are loaded
    if (videos.length > 0 && autoPlay) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [videos, currentIndex, autoPlay]);

  // Improved fullscreen handling
  const enterFullscreen = () => {
    if (!playerContainerRef.current) return;

    try {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else if ((playerContainerRef.current as any).webkitRequestFullscreen) {
        (playerContainerRef.current as any).webkitRequestFullscreen();
      } else if ((playerContainerRef.current as any).msRequestFullscreen) {
        (playerContainerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };
  
  const exitFullscreen = () => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error("Exit fullscreen error:", error);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).msFullscreenElement;
        
      setIsFullscreen(!!fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-96 bg-black/30 rounded-lg">
        <p className="text-white/70">No videos to display</p>
      </div>
    );
  }

  const renderVideo = () => {
    if (currentVideo.type === VideoType.YOUTUBE) {
      const videoId = extractYoutubeId(currentVideo.url);
      if (!videoId) return <div>Invalid YouTube URL</div>;
      
      // YouTube embed with enhanced parameters for auto-play and portrait support
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&modestbranding=1&rel=0&loop=0&controls=0&playsinline=1&playlist=${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="w-full h-full absolute top-0 left-0"
        ></iframe>
      );
    } else if (currentVideo.type === VideoType.CANVA) {
      // Canva embed (using their standard embed approach)
      return (
        <iframe 
          src={`${currentVideo.url}`}
          allowFullScreen
          allow="fullscreen"
          className="w-full h-full absolute top-0 left-0"
        ></iframe>
      );
    }
    
    return <div>Unsupported video type</div>;
  };

  // Apply style adjustments for portrait orientation
  const portraitStyles = isPortrait || isFullscreen ? {
    maxWidth: '100vw',
    width: '100vw',
    height: '100vh',
    margin: '0',
    padding: '0',
    position: 'fixed' as 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: 1000,
  } : {};

  return (
    <div 
      className="relative" 
      ref={playerContainerRef}
      style={portraitStyles}
    >
      <div 
        ref={playerRef}
        className={`video-container ${isFullscreen ? 'fullscreen' : ''}`}
        style={{
          position: 'relative', 
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        {renderVideo()}
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousVideo}
            className="text-white hover:bg-white/20"
            title="Previous video"
          >
            <SkipBack size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextVideo}
            className="text-white hover:bg-white/20"
            title="Next video"
          >
            <SkipForward size={20} />
          </Button>
          <div className="flex flex-col">
            <span className="text-white text-sm">
              {currentVideo.title} ({currentIndex + 1}/{videos.length})
            </span>
            {currentVideo.type === VideoType.CANVA && (
              <span className="text-white/60 text-xs">
                Next in: {remainingTime}s
              </span>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="text-white hover:bg-white/20"
        >
          <Fullscreen size={20} />
        </Button>
      </div>
    </div>
  );
};

export default VideoPlayer;
