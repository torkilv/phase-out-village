import type { OilField, ParisAgreementTarget, InvestmentOption } from './types';
import { transformRawDataToOilFields, getActiveFields, getProductionStatistics } from './utils/dataTransformation';

// Cache for transformed data
let cachedOilFields: OilField[] | null = null;

/**
 * Get all Norwegian oil fields with real production data
 */
export function getOilFields(): OilField[] {
  if (!cachedOilFields) {
    cachedOilFields = transformRawDataToOilFields();
  }
  return cachedOilFields;
}

/**
 * Get only currently active oil fields
 */
export function getActiveOilFields(currentYear: number = 2024): OilField[] {
  const allFields = getOilFields();
  return getActiveFields(allFields, currentYear);
}

/**
 * Get production statistics for all fields
 */
export function getOilFieldStatistics() {
  const allFields = getOilFields();
  return getProductionStatistics(allFields);
}

/**
 * Get a specific oil field by ID
 */
export function getOilFieldById(id: string): OilField | undefined {
  const allFields = getOilFields();
  return allFields.find(field => field.id === id);
}

/**
 * Paris Agreement targets based on Norwegian commitments
 */
const parisAgreementTargets: ParisAgreementTarget[] = [
  { year: 2030, emissionsTarget: 0.45 }, // 55% reduction from 1990 levels
  { year: 2035, emissionsTarget: 0.25 }, // 75% reduction from 1990 levels  
  { year: 2040, emissionsTarget: 0.10 }, // 90% reduction from 1990 levels
  { year: 2050, emissionsTarget: 0.05 }, // Net zero target
];

/**
 * Investment options for the energy transition
 */
const investmentOptions: InvestmentOption[] = [
  {
    type: 'renewables',
    cost: 50000000000, // 50 billion NOK
    effect: {
      energy: 15,
      emissions: -20,
      happiness: 10,
      equality: 5,
    },
    timeline: 5,
    description: 'Massive offshore wind expansion program',
  },
  {
    type: 'efficiency',
    cost: 20000000000, // 20 billion NOK
    effect: {
      emissions: -10,
      energy: 5,
      revenue: 5000000000, // 5 billion NOK annual savings
    },
    timeline: 3,
    description: 'Energy efficiency improvements across all sectors',
  },
  {
    type: 'nuclear',
    cost: 100000000000, // 100 billion NOK
    effect: {
      energy: 25,
      emissions: -30,
      happiness: -5, // Some public resistance
      equality: 0,
    },
    timeline: 10,
    description: 'Small modular reactor program',
  },
  {
    type: 'oil',
    cost: 30000000000, // 30 billion NOK
    effect: {
      revenue: 10000000000, // 10 billion NOK annual revenue
      emissions: 5, // Increased emissions
      energy: -5, // Less focus on alternatives
      happiness: 5, // Short-term economic benefits
      equality: -3, // Benefits concentrated
    },
    timeline: 7,
    description: 'Enhanced oil recovery and new field development',
  },
];

export function getParisAgreementTargets(): ParisAgreementTarget[] {
  return parisAgreementTargets;
}

export function getInvestmentOptions(): InvestmentOption[] {
  return investmentOptions;
}

/**
 * Get baseline emissions for calculating reduction targets
 */
export function getBaselineEmissions(): number {
  // Calculate baseline from recent years (2020-2022 average)
  const allFields = getOilFields();
  const baselineYears = ['2020', '2021', '2022'];
  
  let totalEmissions = 0;
  let yearCount = 0;
  
  baselineYears.forEach(year => {
    let yearEmissions = 0;
    allFields.forEach(field => {
      const yearData = field.production[year];
      if (yearData?.emission) {
        yearEmissions += yearData.emission;
      }
    });
    if (yearEmissions > 0) {
      totalEmissions += yearEmissions;
      yearCount++;
    }
  });
  
  return yearCount > 0 ? totalEmissions / yearCount : 0;
} 