export interface ClimateOption {
  id: string;
  climate_id: string;
  label: string;
  icon: string;
  image: string;
  image_alt: string;
  solution_title: string;
  solution_text: string;
  sort_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClimateSection {
  id: string;
  title: string;
  description: string;
  final_message: string;
  cta_label: string;
  updated_at: string;
}

export interface ClimateSectionData extends ClimateSection {
  options: ClimateOption[];
}

export interface ClimateSectionInput {
  title: string;
  description: string;
  final_message: string;
  cta_label: string;
}

export interface ClimateOptionInput {
  label: string;
  icon: string;
  image: string;
  image_alt: string;
  solution_title: string;
  solution_text: string;
  sort_order: number;
  enabled: boolean;
}
