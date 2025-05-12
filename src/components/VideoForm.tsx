
import React, { useState } from 'react';
import { VideoFormData, VideoType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from "sonner";
import { isValidVideoUrl, extractYoutubeId, extractCanvaId } from '@/services/videoService';
import { AlertCircle, Check } from 'lucide-react';

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
  const [urlValidated, setUrlValidated] = useState<boolean | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'url') {
      // Reset validation state when URL changes
      setUrlValidated(null);
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as VideoType }));
    // Reset URL validation when type changes
    setUrlValidated(null);
  };

  const validateUrl = () => {
    if (!formData.url.trim()) {
      setUrlValidated(false);
      return;
    }
    
    const valid = isValidVideoUrl(formData.url, formData.type);
    setUrlValidated(valid);
    
    if (!valid) {
      toast.error(
        formData.type === VideoType.YOUTUBE 
        ? 'Please enter a valid YouTube URL. Example: https://www.youtube.com/watch?v=abcdefghijk'
        : 'Please enter a valid Canva design URL. Example: https://www.canva.com/design/ABC123/view'
      );
    } else {
      toast.success('URL format is valid');
    }
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
        ? 'Invalid YouTube URL format. Example: https://www.youtube.com/watch?v=abcdefghijk'
        : 'Invalid Canva design URL format. Example: https://www.canva.com/design/ABC123/view'
      );
      return;
    }
    
    await onSubmit(formData);
  };

  // Parse ID for display purposes
  const getVideoId = () => {
    if (formData.url && formData.type === VideoType.YOUTUBE) {
      return extractYoutubeId(formData.url);
    } else if (formData.url && formData.type === VideoType.CANVA) {
      return extractCanvaId(formData.url);
    }
    return null;
  };

  const videoId = getVideoId();

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
        <div className="flex space-x-2">
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
            className={`bg-gray-800 text-white border-gray-700 flex-1 ${
              urlValidated === true ? 'border-green-500' : 
              urlValidated === false ? 'border-red-500' : ''
            }`}
            disabled={isSubmitting}
            required
          />
          <Button 
            type="button" 
            onClick={validateUrl}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          >
            Validate
          </Button>
        </div>
        {urlValidated !== null && (
          <div className={`flex items-center text-sm mt-1 ${urlValidated ? 'text-green-500' : 'text-red-500'}`}>
            {urlValidated ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                <span>Valid URL format</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-1" />
                <span>
                  Invalid URL format. {
                    formData.type === VideoType.YOUTUBE 
                      ? 'Example: https://www.youtube.com/watch?v=abcdefghijk' 
                      : 'Example: https://www.canva.com/design/ABC123/view'
                  }
                </span>
              </>
            )}
          </div>
        )}
        {videoId && urlValidated && (
          <div className="text-xs text-gray-400 mt-1">
            Detected ID: <span className="text-green-500">{videoId}</span>
          </div>
        )}
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
        <div className="text-xs text-gray-400 mt-1">
          {formData.type === VideoType.YOUTUBE && (
            <div>
              <p>Enter a YouTube video URL in one of these formats:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
                <li>https://youtu.be/VIDEO_ID</li>
                <li>https://www.youtube.com/embed/VIDEO_ID</li>
              </ul>
            </div>
          )}
          {formData.type === VideoType.CANVA && (
            <div>
              <p>Enter a Canva design URL in this format:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>https://www.canva.com/design/DESIGN_ID/view</li>
                <li>https://www.canva.com/design/DESIGN_ID/present</li>
                <li>https://www.canva.com/design/DESIGN_ID/share</li>
              </ul>
            </div>
          )}
        </div>
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
