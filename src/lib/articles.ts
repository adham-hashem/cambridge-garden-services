import { supabase } from '@/lib/supabase';
import { apiGet, apiSend, uploadImage } from '@/lib/api';
import type { Article, ArticleInput } from '@/types/article';

export async function fetchPublishedArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching published articles:', error.message);
    return [];
  }

  return (data || []) as Article[];
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching article:', error.message);
    return null;
  }

  return data as Article | null;
}

export async function fetchAllArticles(
  page: number = 0,
  pageSize: number = 10,
  search?: string
): Promise<{ articles: Article[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);

  try {
    const data = await apiGet<{ articles: Article[]; total: number }>(`/api/admin/articles?${params}`);
    return data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return { articles: [], total: 0 };
  }
}

export async function createArticle(input: ArticleInput): Promise<Article | null> {
  try {
    const data = await apiSend<{ article: Article }>('/api/admin/articles', 'POST', { input });
    return data.article;
  } catch (error) {
    console.error('Error creating article:', error);
    return null;
  }
}

export async function updateArticle(id: string, input: Partial<ArticleInput>): Promise<Article | null> {
  try {
    const data = await apiSend<{ article: Article }>('/api/admin/articles', 'PATCH', { id, input });
    return data.article;
  } catch (error) {
    console.error('Error updating article:', error);
    return null;
  }
}

export async function deleteArticle(id: string): Promise<boolean> {
  try {
    await apiSend(`/api/admin/articles?id=${encodeURIComponent(id)}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Error deleting article:', error);
    return false;
  }
}

export async function toggleArticlePublished(id: string, published: boolean): Promise<boolean> {
  try {
    await apiSend('/api/admin/articles', 'PATCH', { id, input: { published } });
    return true;
  } catch (error) {
    console.error('Error toggling article published:', error);
    return false;
  }
}

export async function uploadArticleImage(file: File): Promise<string | null> {
  try {
    return await uploadImage(file, 'articles');
  } catch (error) {
    console.error('Error uploading article image:', error);
    return null;
  }
}
