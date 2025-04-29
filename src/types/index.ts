
export enum VideoType {
  YOUTUBE = 'youtube',
  CANVA = 'canva',
}

export interface Video {
  id: string;
  title: string;
  url: string;
  type: VideoType;
  createdAt: number;
  userId: string;
}

export interface VideoFormData {
  title: string;
  url: string;
  type: VideoType;
}
