export interface Testimonial {
  id: string;
  name: string;
  rating: number; // 1 to 5
  comment: string;
  customer_photo: string;
  customer_photo_alt: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TestimonialInput {
  name: string;
  rating: number;
  comment: string;
  customer_photo?: string;
  customer_photo_alt?: string;
  published?: boolean;
  sort_order?: number;
}
