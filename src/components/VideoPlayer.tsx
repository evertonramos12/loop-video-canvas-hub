
import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoType } from '@/types';
import { Fullscreen, Play, Pause } from 'lucide-react';
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
  const playerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  const currentVideo = videos[currentIndex];

  // Function to advance to the next video
  const goToNextVideo = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  useEffect(() => {
    if (videos.length === 0) return;

    let timer: NodeJS.Timeout;
    
    // Handle video end and advance to next video
    const handleVideoEnd = () => {
      if (isPlaying) {
        // Move to next video when current one ends
        timer = setTimeout(() => {
          goToNextVideo();
        }, 500); // Small delay before switching
      }
    };

    // Subscribe to message events from YouTube iframe API
    const handleMessage = (event: MessageEvent) => {
      // Handle YouTube iframe API events
      if (
        typeof event.data === 'object' &&
        event.data.event === 'onStateChange' &&
        event.data.info === 0 // Video ended (state=0)
      ) {
        handleVideoEnd();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
    };
  }, [currentIndex, videos, isPlaying]);

  useEffect(() => {
    // Reset current index when videos change
    if (videos.length > 0 && currentIndex >= videos.length) {
      setCurrentIndex(0);
    }
  }, [videos, currentIndex]);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!isFullscreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
      
      // YouTube embed with autoplay, controls, and enablejsapi for event handling
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&modestbranding=1&rel=0`}
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
