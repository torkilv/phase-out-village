// Oil field type
export interface OilField {
  id: string;
  name: string;
  location: { lat: number; lon: number } | { x: number; y: number }; // Support for geo or map coords
  production: Record<string, OilFieldProductionYear>; // year -> data
  phaseOutYearOptions: number[];
}

export interface OilFieldProductionYear {
  productionOil?: number;
  productionGas?: number;
  emission?: number;
}

// Metrics tracked per year
export interface Metrics {
  year: number;
  emissions: number;
  energy: number;
  happiness: number;
  equality: number;
  revenue: number;
}

// Investment options
export type InvestmentType = 'efficiency' | 'oil' | 'renewables' | 'nuclear';

export interface InvestmentOption {
  type: InvestmentType;
  cost: number;
  effect: Partial<Metrics>;
  timeline: number; // years to completion
  description: string;
}

// Paris Agreement targets
export interface ParisAgreementTarget {
  year: number;
  emissionsTarget: number;
}

// Translations
export type Language = 'en' | 'no';
export type TranslationKey = string;
export type Translations = Record<Language, Record<TranslationKey, string>>; 