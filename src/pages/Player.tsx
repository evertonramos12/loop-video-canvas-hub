
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Video } from '@/types';
import { getUserVideos } from '@/services/videoService';
import VideoPlayer from '@/components/VideoPlayer';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Player = () => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.orientation === 90 || window.orientation === -90);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    // Check initial orientation
    if (window.orientation !== undefined) {
      handleOrientationChange();
    }
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
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

  // Apply different styling when in landscape mode
  const pageStyles = isLandscape ? {
    padding: 0,
    margin: 0,
    height: '100vh',
    width: '100vw',
    overflow: 'hidden'
  } : {};

  const adminButtonStyles = isLandscape ? {
    position: 'fixed' as 'fixed',
    top: '4px',
    right: '4px',
    zIndex: 2000,
  } : {};

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
