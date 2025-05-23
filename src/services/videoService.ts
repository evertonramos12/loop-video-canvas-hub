
import { db } from '@/lib/firebase';
import { Video, VideoFormData, VideoType } from '@/types';
import { 
  addDoc, 
  collection, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  updateDoc, 
  where 
} from 'firebase/firestore';

const videosCollection = 'videos';

export const addVideo = async (userId: string, videoData: VideoFormData): Promise<string> => {
  try {
    console.log('Adding video for user:', userId);
    
    // Validate the URL format before attempting to save
    if (!isValidVideoUrl(videoData.url, videoData.type)) {
      throw new Error(`Invalid ${videoData.type} URL format. Please check and try again.`);
    }
    
    const video: Omit<Video, 'id'> = {
      ...videoData,
      userId,
      createdAt: Date.now(),
    };
    
    // For debugging purposes
    console.log('Video data to be added:', JSON.stringify(video, null, 2));
    
    const docRef = await addDoc(collection(db, videosCollection), video);
    console.log('Video added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error adding video:', error);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Firebase rules may need to be updated. Please check your Firebase console and ensure read/write rules are properly set for videos collection.');
    }
    
    throw error;
  }
};

export const getUserVideos = async (userId: string): Promise<Video[]> => {
  try {
    console.log('Fetching videos for user:', userId);
    
    const q = query(
      collection(db, videosCollection),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const videos: Video[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        id: doc.id,
        title: data.title,
        url: data.url,
        type: data.type,
        createdAt: data.createdAt,
        userId: data.userId,
      });
    });
    
    console.log(`Found ${videos.length} videos for user ${userId}`);
    
    // Sort by creation date (newest first)
    return videos.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    
    if (error.code === 'permission-denied') {
      console.error('Firebase permission denied error. Check security rules.');
      throw new Error('Permission denied. Please check your Firebase security rules for the videos collection.');
    }
    
    throw error;
  }
};

export const updateVideo = async (videoId: string, videoData: Partial<VideoFormData>): Promise<void> => {
  try {
    // Validate URL if it's being updated
    if (videoData.url && videoData.type && !isValidVideoUrl(videoData.url, videoData.type)) {
      throw new Error(`Invalid ${videoData.type} URL format. Please check and try again.`);
    }
    
    const videoRef = doc(db, videosCollection, videoId);
    await updateDoc(videoRef, videoData);
  } catch (error) {
    console.error('Error updating video:', error);
    throw error;
  }
};

export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, videosCollection, videoId));
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};

export const extractYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const extractCanvaId = (url: string): string | null => {
  // Improved regex to handle different URL formats including truncated ones
  const regExp = /\/design\/([A-Za-z0-9_-]+)(\/|$)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export const isValidVideoUrl = (url: string, type: VideoType): boolean => {
  if (!url || url.trim() === '') {
    return false;
  }
  
  if (type === VideoType.YOUTUBE) {
    return extractYoutubeId(url) !== null;
  }
  
  if (type === VideoType.CANVA) {
    // More lenient check for Canva URLs
    return url.includes('canva.com/design/') && extractCanvaId(url) !== null;
  }
  
  return false;
};
