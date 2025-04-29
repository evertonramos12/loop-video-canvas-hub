
import React from 'react';
import { Video, VideoType } from '@/types';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Youtube, Video as VideoIcon } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

interface VideoListProps {
  videos: Video[];
  onEdit: (video: Video) => void;
  onDelete: (videoId: string) => void;
}

const VideoList: React.FC<VideoListProps> = ({ videos, onEdit, onDelete }) => {
  if (videos.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed border-gray-700 rounded-lg">
        <p className="text-gray-400">No videos added yet. Add your first video!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <Card key={video.id} className="bg-gray-800 border-gray-700 overflow-hidden">
          <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-base line-clamp-1 text-white">
                {video.title}
              </CardTitle>
              <CardDescription className="text-xs flex items-center text-gray-400 gap-1">
                {video.type === VideoType.YOUTUBE ? (
                  <><Youtube size={14} /> YouTube</>
                ) : (
                  <><VideoIcon size={14} /> Canva</>
                )}
              </CardDescription>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => onEdit(video)}
              >
                <Edit size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-gray-700"
                onClick={() => onDelete(video.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-xs text-gray-400 truncate">
              {video.url}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VideoList;
