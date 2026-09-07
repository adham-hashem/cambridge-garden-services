import { supabase } from '@/lib/supabase';
import { apiGet, apiSend, uploadImage } from '@/lib/api';
import type {
  ClimateSection,
  ClimateOption,
  ClimateSectionData,
  ClimateSectionInput,
  ClimateOptionInput,
} from '@/types/climate';

const CLIMATE_SECTION_ID = '00000000-0000-0000-0000-000000000001';

export async function fetchClimateSection(): Promise<ClimateSectionData | null> {
  const { data: section, error: sectionError } = await supabase
    .from('climate_section')
    .select('*')
    .eq('id', CLIMATE_SECTION_ID)
    .maybeSingle();

  if (sectionError || !section) {
    console.error('Error fetching climate section:', sectionError?.message);
    return null;
  }

  const { data: options, error: optionsError } = await supabase
    .from('climate_options')
    .select('*')
    .eq('climate_id', CLIMATE_SECTION_ID)
    .order('sort_order', { ascending: true });

  if (optionsError) {
    console.error('Error fetching climate options:', optionsError.message);
    return null;
  }

  return {
    ...(section as ClimateSection),
    options: (options || []) as ClimateOption[],
  };
}

export async function fetchClimateSectionAdmin(): Promise<ClimateSectionData | null> {
  try {
    const data = await apiGet<{ climate: ClimateSectionData | null }>('/api/admin/climate');
    return data.climate;
  } catch (error) {
    console.error('Error fetching climate section:', error);
    return null;
  }
}

export async function updateClimateSection(input: ClimateSectionInput): Promise<boolean> {
  try {
    await apiSend('/api/admin/climate', 'PATCH', { section: input });
    return true;
  } catch (error) {
    console.error('Error updating climate section:', error);
    return false;
  }
}

export async function createClimateOption(input: ClimateOptionInput): Promise<ClimateOption | null> {
  try {
    const data = await apiSend<{ option: ClimateOption }>('/api/admin/climate', 'POST', { option: input });
    return data.option;
  } catch (error) {
    console.error('Error creating climate option:', error);
    return null;
  }
}

export async function updateClimateOption(id: string, input: Partial<ClimateOptionInput>): Promise<boolean> {
  try {
    await apiSend('/api/admin/climate', 'PATCH', { id, option: input });
    return true;
  } catch (error) {
    console.error('Error updating climate option:', error);
    return false;
  }
}

export async function deleteClimateOption(id: string): Promise<boolean> {
  try {
    await apiSend(`/api/admin/climate?id=${encodeURIComponent(id)}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Error deleting climate option:', error);
    return false;
  }
}

export async function uploadClimateImage(file: File): Promise<string | null> {
  try {
    return await uploadImage(file, 'climate');
  } catch (error) {
    console.error('Error uploading climate image:', error);
    return null;
  }
}
