export interface Project {
  id: string;
  service_id: string;
  title: string;
  location: string;
  description: string;
  before_image: string;
  after_image: string;
  before_alt: string;
  after_alt: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectInput {
  service_id: string;
  title: string;
  location: string;
  description: string;
  before_image: string;
  after_image: string;
  before_alt: string;
  after_alt: string;
  published: boolean;
  sort_order: number;
}
