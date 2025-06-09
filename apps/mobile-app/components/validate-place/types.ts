export interface Place {
  id: string;
  data: { name?: string }[];
}

export interface CameraPermission {
  granted: boolean;
}

export interface ImageInfo {
  uri: string;
  fileName: string;
  mimeType: string;
}
