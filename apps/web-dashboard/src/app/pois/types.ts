export interface RawPoi {
  osm_type: string;
  osm_id: number;
  name?: string | null;
  latitude: number;
  longitude: number;
  tags: Record<string, string | undefined>;
  boundaries?: Boundary[];
}

export interface Boundary {
  osm_type: string;
  osm_id: number;
  name: string;
  admin_level: string;
  tags: Record<string, string | undefined>;
}
