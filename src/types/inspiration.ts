export interface GardenInspiration {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  service_id: string;
  service_title?: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GardenInspirationInput {
  title: string;
  description: string;
  image: string;
  alt?: string;
  service_id: string;
  published?: boolean;
  sort_order?: number;
}
