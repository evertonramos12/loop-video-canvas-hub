
import React, { useState } from 'react';
import { VideoFormData, VideoType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from "sonner";
import { isValidVideoUrl } from '@/services/videoService';

interface VideoFormProps {
  initialData?: Partial<VideoFormData>;
  onSubmit: (data: VideoFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const VideoForm: React.FC<VideoFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<VideoFormData>({
    title: initialData?.title || '',
    url: initialData?.url || '',
    type: initialData?.type || VideoType.YOUTUBE,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as VideoType }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!formData.url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    if (!isValidVideoUrl(formData.url, formData.type)) {
      toast.error(
        formData.type === VideoType.YOUTUBE 
        ? 'Please enter a valid YouTube URL'
        : 'Please enter a valid Canva design URL'
      );
      return;
    }
    
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter video title"
          className="bg-gray-800 text-white border-gray-700"
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="url">Video URL</Label>
        <Input
          id="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
          placeholder={
            formData.type === VideoType.YOUTUBE
              ? 'https://www.youtube.com/watch?v=example'
              : 'https://www.canva.com/design/YOUR_DESIGN_ID/view'
          }
          className="bg-gray-800 text-white border-gray-700"
          disabled={isSubmitting}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>Video Type</Label>
        <RadioGroup 
          value={formData.type} 
          onValueChange={handleTypeChange}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value={VideoType.YOUTUBE} 
              id="youtube" 
              disabled={isSubmitting}
            />
            <Label htmlFor="youtube" className="cursor-pointer">YouTube</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value={VideoType.CANVA} 
              id="canva" 
              disabled={isSubmitting}
            />
            <Label htmlFor="canva" className="cursor-pointer">Canva</Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-gray-400 mt-1">
          {formData.type === VideoType.YOUTUBE 
            ? 'Enter a YouTube video URL (e.g., https://www.youtube.com/watch?v=example)'
            : 'Enter a Canva design URL (e.g., https://www.canva.com/design/YOUR_DESIGN_ID/view)'}
        </p>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-gray-700 text-white hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? 'Saving...' : initialData?.title ? 'Update' : 'Add Video'}
        </Button>
      </div>
    </form>
  );
};

export default VideoForm;
