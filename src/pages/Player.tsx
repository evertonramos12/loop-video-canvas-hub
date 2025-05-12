import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Video } from '@/types';
import { getUserVideos } from '@/services/videoService';
import VideoPlayer from '@/components/VideoPlayer';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const Player = () => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const isMobile = useIsMobile();

  // Auto-rotate to landscape and handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.orientation === 90 || window.orientation === -90;
      setIsLandscape(isLandscape);
    };
    
    // Try to force landscape orientation if supported
    const requestLandscapeMode = () => {
      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          (screen.orientation.lock as Function)('landscape')
            .then(() => {
              console.log('Screen locked to landscape mode');
              setIsLandscape(true);
            })
            .catch((err: Error) => {
              console.warn('Failed to lock orientation:', err);
            });
        }
      } catch (err) {
        console.warn('Orientation API error:', err);
      }
    };
    
    // Check if device is mobile
    const isMobileDevice = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    
    // If on mobile device, request landscape mode
    if (isMobileDevice()) {
      requestLandscapeMode();
    }
    
    window.addEventListener('orientationchange', handleOrientationChange);
    // Check initial orientation
    if (window.orientation !== undefined) {
      handleOrientationChange();
    }
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      // Release orientation lock when component unmounts
      try {
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation.unlock as Function)();
        }
      } catch (e) {
        console.warn('Error unlocking orientation:', e);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    const loadVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userVideos = await getUserVideos(currentUser.uid);
        setVideos(userVideos);
        
        if (userVideos.length === 0) {
          setError('No videos found. Add videos from the dashboard.');
        }
      } catch (err) {
        console.error('Error loading videos:', err);
        setError('Failed to load videos. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideos();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/50">Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <p className="text-white mb-4">{error}</p>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link to="/dashboard">
            <Settings size={16} className="mr-2" /> Go to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  // Apply different styling for landscape mode
  const pageStyles = {
    padding: 0,
    margin: 0,
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    position: 'fixed' as 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 9999,
  };

  const adminButtonStyles = {
    position: 'fixed' as 'fixed',
    top: '4px',
    right: '4px',
    zIndex: 10000,
  };

  return (
    <div className="min-h-screen bg-black relative" style={pageStyles}>
      {/* Main video player area */}
      <VideoPlayer videos={videos} autoPlay={true} />
      
      {/* Admin controls overlay */}
      <div className="absolute top-4 right-4 z-10" style={adminButtonStyles}>
        <Button 
          variant="outline" 
          size="sm"
          asChild
          className="bg-black/50 backdrop-blur-sm border-gray-700 text-white hover:bg-black/70"
        >
          <Link to="/dashboard">
            <Settings size={16} className="mr-2" /> Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Player;
