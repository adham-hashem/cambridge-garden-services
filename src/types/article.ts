export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
  cover_image: string;
  cover_alt: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ArticleInput {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
  cover_image: string;
  cover_alt: string;
  published: boolean;
  sort_order: number;
}
