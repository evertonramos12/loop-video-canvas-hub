
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Video, VideoFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  addVideo, 
  deleteVideo, 
  getUserVideos, 
  updateVideo 
} from '@/services/videoService';
import VideoList from '@/components/VideoList';
import VideoForm from '@/components/VideoForm';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { LogOut, Play, Plus, Settings } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    const loadVideos = async () => {
      try {
        setLoading(true);
        const userVideos = await getUserVideos(currentUser.uid);
        setVideos(userVideos);
      } catch (error: any) {
        console.error('Error loading videos:', error);
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
          toast.error('Firebase permissions error: You may need to update database rules');
        } else {
          toast.error('Failed to load videos');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadVideos();
  }, [currentUser]);

  const handleAddVideo = () => {
    setCurrentVideo(null);
    setFormDialogOpen(true);
  };

  const handleEditVideo = (video: Video) => {
    setCurrentVideo(video);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      setCurrentVideo(video);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentVideo) return;
    
    try {
      await deleteVideo(currentVideo.id);
      setVideos(videos.filter(v => v.id !== currentVideo.id));
      toast.success('Video deleted successfully');
    } catch (error: any) {
      console.error('Error deleting video:', error);
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        toast.error('Firebase permissions error: You may need to update database rules');
      } else {
        toast.error('Failed to delete video');
      }
    } finally {
      setDeleteDialogOpen(false);
      setCurrentVideo(null);
    }
  };

  const handleFormSubmit = async (data: VideoFormData) => {
    if (!currentUser) return;
    
    try {
      setFormSubmitting(true);
      
      if (currentVideo) {
        // Update existing video
        await updateVideo(currentVideo.id, data);
        setVideos(videos.map(v => 
          v.id === currentVideo.id 
            ? { ...v, ...data } 
            : v
        ));
        toast.success('Video updated successfully');
      } else {
        // Add new video
        const newVideoId = await addVideo(currentUser.uid, data);
        const newVideo: Video = {
          id: newVideoId,
          ...data,
          userId: currentUser.uid,
          createdAt: Date.now(),
        };
        setVideos([newVideo, ...videos]);
        toast.success('Video added successfully');
      }
      
      setFormDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving video:', error);
      
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        toast.error('Firebase permissions error: You may need to update database rules in Firebase Console');
      } else {
        toast.error('Failed to save video');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Video Hub</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Link to="/player">
                <Play size={16} className="mr-1" /> Play Videos
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut size={16} className="mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">My Videos</h2>
            <p className="text-gray-400 text-sm">
              {currentUser?.email} • {videos.length} videos
            </p>
          </div>
          <Button 
            onClick={handleAddVideo}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus size={16} className="mr-1" /> Add Video
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-400">Loading videos...</p>
          </div>
        ) : (
          <VideoList 
            videos={videos}
            onEdit={handleEditVideo}
            onDelete={handleDeleteClick}
          />
        )}
      </main>
      
      {/* Add/Edit Video Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {currentVideo ? 'Edit Video' : 'Add New Video'}
            </DialogTitle>
          </DialogHeader>
          <VideoForm
            initialData={currentVideo || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormDialogOpen(false)}
            isSubmitting={formSubmitting}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{currentVideo?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-white hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
