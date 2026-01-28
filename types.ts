
export interface StagingStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
  isCustom?: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  styleId: string;
  timestamp: number;
  label?: string; // e.g., "Master Bedroom", "Kitchen"
  originalUrl?: string;
  rating?: number;
  feedback?: string;
}

export interface Listing {
  id: string;
  address: string;
  targetStyleId: string;
  images: GeneratedImage[];
  createdAt: number;
}

export type AppStatus = 'idle' | 'uploading' | 'staging' | 'completed' | 'error';
export type ViewMode = 'dashboard' | 'listing_detail';
