
import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoType } from '@/types';
import { Fullscreen, Play, Pause, SkipForward, SkipBack, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractYoutubeId } from '@/services/videoService';

interface VideoPlayerProps {
  videos: Video[];
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videos, autoPlay = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  const currentVideo = videos[currentIndex];

  // Function to go to previous video
  const goToPreviousVideo = () => {
    if (videos.length <= 1) return;
    
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex <= 0 ? videos.length - 1 : prevIndex - 1;
      console.log(`Moving to previous video: ${newIndex + 1}/${videos.length}`);
      return newIndex;
    });
  };

  // Function to advance to the next video
  const goToNextVideo = () => {
    if (videos.length <= 1) return;
    
    setCurrentIndex((prevIndex) => {
      // If looping is disabled and we're at the end, don't advance
      if (!loopEnabled && prevIndex >= videos.length - 1) {
        return prevIndex;
      }
      // Otherwise, loop back to beginning when we reach the end
      const newIndex = (prevIndex + 1) % videos.length;
      console.log(`Moving to next video: ${newIndex + 1}/${videos.length}`);
      return newIndex;
    });
  };

  // Toggle looping on/off
  const toggleLooping = () => {
    setLoopEnabled(!loopEnabled);
    console.log(`Looping ${!loopEnabled ? 'enabled' : 'disabled'}`);
  };

  useEffect(() => {
    if (videos.length === 0) return;

    let timer: NodeJS.Timeout;
    
    // Handle video end and advance to next video
    const handleVideoEnd = () => {
      if (isPlaying) {
        console.log("Video ended, advancing to next video");
        // Move to next video when current one ends
        timer = setTimeout(() => {
          // If we're at the last video and looping is disabled, don't advance
          if (!loopEnabled && currentIndex >= videos.length - 1) {
            console.log("Reached end of playlist and looping is disabled");
            return;
          }
          goToNextVideo();
        }, 500); // Small delay before switching
      }
    };

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
          if (event.data.info === -1) {
            console.log("YouTube video error detected, skipping to next");
            goToNextVideo();
          }
        }
      } catch (error) {
        console.error("Error handling YouTube message:", error);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearTimeout(timer);
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

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    try {
      if (!isFullscreen) {
        if (playerContainerRef.current.requestFullscreen) {
          playerContainerRef.current.requestFullscreen();
        } else if ((playerContainerRef.current as any).webkitRequestFullscreen) {
          (playerContainerRef.current as any).webkitRequestFullscreen();
        } else if ((playerContainerRef.current as any).msRequestFullscreen) {
          (playerContainerRef.current as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement || 
        !!(document as any).webkitFullscreenElement || 
        !!(document as any).msFullscreenElement
      );
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
      
      // YouTube embed with parameters optimized for compatibility
      // Using controls=0 as requested but can be set to 1 for more compatibility
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&modestbranding=1&rel=0&loop=0&controls=0&playsinline=1&playlist=${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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

  return (
    <div className="relative" ref={playerContainerRef}>
      <div 
        ref={playerRef}
        className={`video-container ${isFullscreen ? 'fullscreen' : ''}`}
        style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden'}}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLooping}
            className={`text-white hover:bg-white/20 ${loopEnabled ? 'bg-white/20' : ''}`}
            title={loopEnabled ? "Disable looping" : "Enable looping"}
          >
            <Repeat size={20} />
          </Button>
          <span className="text-white text-sm">
            {currentVideo.title} ({currentIndex + 1}/{videos.length})
          </span>
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
