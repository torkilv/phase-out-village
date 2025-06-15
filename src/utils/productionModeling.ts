import type { OilField } from '../types';

/**
 * Production decline modeling for Norwegian oil fields
 */

export interface ProductionModel {
  baselineYear: number;
  baselineProduction: number;
  baselineEmissions: number;
  declineRate: number; // Annual decline rate (e.g., 0.05 = 5% per year)
  phaseOutYear?: number; // Year when field is phased out
  fieldCategory: 'mature' | 'established' | 'new';
}

export interface ProjectedProduction {
  productionOil?: number;
  productionGas?: number;
  emission?: number;
}

/**
 * Calculate decline rate based on historical production data
 */
export function calculateDeclineRate(field: OilField): number {
  const years = Object.keys(field.production)
    .map(Number)
    .filter(year => !isNaN(year))
    .sort((a, b) => b - a); // Most recent first

  if (years.length < 3) return 0.05; // Default 5% decline

  // Use last 5 years for trend analysis
  const recentYears = years.slice(0, Math.min(5, years.length));
  let totalDecline = 0;
  let validPairs = 0;

  for (let i = 1; i < recentYears.length; i++) {
    const currentYear = recentYears[i];
    const previousYear = recentYears[i - 1];
    
    const currentData = field.production[currentYear];
    const previousData = field.production[previousYear];

    if (currentData?.productionOil && previousData?.productionOil && 
        currentData.productionOil > 0 && previousData.productionOil > 0) {
      const yearlyDecline = (previousData.productionOil - currentData.productionOil) / previousData.productionOil;
      totalDecline += yearlyDecline;
      validPairs++;
    }
  }

  if (validPairs === 0) return 0.05; // Default decline

  const avgDecline = totalDecline / validPairs;
  
  // Clamp decline rate between 0% and 20% per year
  return Math.max(0, Math.min(0.20, avgDecline));
}

/**
 * Categorize field based on production history
 */
export function categorizeField(field: OilField): 'mature' | 'established' | 'new' {
  const years = Object.keys(field.production)
    .map(Number)
    .filter(year => !isNaN(year))
    .sort();

  if (years.length === 0) return 'new';

  const firstYear = years[0];
  const hasRecentProduction = years.some(year => year >= 2020 && field.production[year]?.productionOil);

  // New fields: started production recently (2015+)
  if (firstYear >= 2015 && hasRecentProduction) {
    return 'new';
  }

  // Mature fields: old fields or declining production
  if (firstYear <= 2000 || !hasRecentProduction) {
    return 'mature';
  }

  // Established fields: middle category
  return 'established';
}

/**
 * Create production model for a field
 */
export function createProductionModel(field: OilField, currentYear: number = 2024): ProductionModel {
  const category = categorizeField(field);
  const declineRate = calculateDeclineRate(field);
  
  // Find best baseline production data - prioritize recent non-zero production
  const years = Object.keys(field.production)
    .map(Number)
    .filter(year => !isNaN(year))
    .sort((a, b) => b - a);

  let baselineYear = currentYear;
  let baselineProduction = 0;
  let baselineEmissions = 0;

  // Strategy 1: Find most recent year with significant production (> 0.1M barrels)
  for (const year of years) {
    const data = field.production[year];
    if (data?.productionOil && data.productionOil > 0.1) {
      baselineYear = year;
      baselineProduction = data.productionOil;
      baselineEmissions = data.emission || 0;
      break;
    }
  }

  // Strategy 2: If no significant recent production, find peak production in last 10 years
  if (baselineProduction === 0) {
    let peakProduction = 0;
    let peakYear = currentYear;
    let peakEmissions = 0;
    
    for (const year of years) {
      if (year >= currentYear - 10) { // Last 10 years only
        const data = field.production[year];
        if (data?.productionOil && data.productionOil > peakProduction) {
          peakProduction = data.productionOil;
          peakYear = year;
          peakEmissions = data.emission || 0;
        }
      }
    }
    
    if (peakProduction > 0) {
      baselineYear = peakYear;
      baselineProduction = peakProduction;
      baselineEmissions = peakEmissions;
    }
  }

  // Strategy 3: If still no production, find any historical production > 0
  if (baselineProduction === 0) {
    for (const year of years) {
      const data = field.production[year];
      if (data?.productionOil && data.productionOil > 0) {
        baselineYear = year;
        baselineProduction = data.productionOil;
        baselineEmissions = data.emission || 0;
        break;
      }
    }
  }

  // Strategy 4: If absolutely no production found, use most recent data (even if zero)
  if (baselineProduction === 0 && years.length > 0) {
    for (const year of years) {
      const data = field.production[year];
      if (data && data.hasOwnProperty('productionOil')) {
        baselineYear = year;
        baselineProduction = data.productionOil || 0;
        baselineEmissions = data.emission || 0;
        break;
      }
    }
  }

  return {
    baselineYear,
    baselineProduction,
    baselineEmissions,
    declineRate,
    fieldCategory: category,
  };
}

/**
 * Project production for a specific year with extended tail modeling
 */
export function projectProduction(
  model: ProductionModel, 
  targetYear: number,
  phasedOutFields: Set<string>,
  fieldId: string
): ProjectedProduction {
  // If field is phased out, return zero production
  if (phasedOutFields.has(fieldId)) {
    return {
      productionOil: 0,
      productionGas: 0,
      emission: 0,
    };
  }

  // If field is scheduled for phase-out, check if it's past the phase-out year
  if (model.phaseOutYear && targetYear >= model.phaseOutYear) {
    return {
      productionOil: 0,
      productionGas: 0,
      emission: 0,
    };
  }

  const yearsDiff = targetYear - model.baselineYear;
  
  // For past years or baseline year, return baseline
  if (yearsDiff <= 0) {
    return {
      productionOil: model.baselineProduction,
      emission: model.baselineEmissions,
    };
  }

  // Special handling for fields with old baselines - apply gradual decline from baseline year
  // This prevents sudden jumps when baseline is from several years ago
  let adjustedBaseline = model.baselineProduction;
  if (model.baselineYear < targetYear - 5) {
    // If baseline is more than 5 years old, apply moderate decline to current year first
    const yearsToPresent = Math.min(targetYear - 5, 2024) - model.baselineYear;
    if (yearsToPresent > 0) {
      const moderateDecline = Math.pow(1 - Math.min(model.declineRate, 0.08), yearsToPresent);
      adjustedBaseline = model.baselineProduction * moderateDecline;
    }
  }

  // Enhanced decline curve with long tail modeling
  let projectedProduction: number;
  
  if (adjustedBaseline === 0) {
    projectedProduction = 0;
  } else {
    // Use different decline models based on field category and time horizon
    const effectiveDeclineRate = getEffectiveDeclineRate(model, yearsDiff);
    
    // Apply exponential decline with asymptotic tail
    const exponentialDecline = Math.pow(1 - effectiveDeclineRate, yearsDiff);
    
    // Add asymptotic tail - fields can produce at very low levels for decades
    // Minimum production threshold based on field category
    const minProductionRatio = getMinimumProductionRatio(model.fieldCategory);
    const asymptote = adjustedBaseline * minProductionRatio;
    
    // Combine exponential decline with asymptotic approach
    const declinedProduction = adjustedBaseline * exponentialDecline;
    projectedProduction = Math.max(declinedProduction, asymptote);
    
    // For very long time horizons (>30 years), add additional tail modeling
    if (yearsDiff > 30) {
      const longTermDecline = Math.pow(0.98, yearsDiff - 30); // Very slow decline after 30 years
      projectedProduction = Math.max(projectedProduction * longTermDecline, asymptote * 0.1);
    }
  }
  
  // Calculate emissions based on production (maintain intensity ratio)
  const emissionIntensity = model.baselineProduction > 0 
    ? model.baselineEmissions / model.baselineProduction 
    : 0;
  const projectedEmissions = projectedProduction * emissionIntensity;

  // Production can't go below zero, but can be very small
  return {
    productionOil: Math.max(0, projectedProduction),
    emission: Math.max(0, projectedEmissions),
  };
}

/**
 * Get effective decline rate that changes over time
 */
function getEffectiveDeclineRate(model: ProductionModel, yearsDiff: number): number {
  let baseRate = model.declineRate;
  
  // Decline rate changes over time - faster initially, then slower
  if (yearsDiff <= 5) {
    // First 5 years: use base rate
    return baseRate;
  } else if (yearsDiff <= 15) {
    // Years 6-15: gradually reduce decline rate
    const reductionFactor = 0.7 + (0.3 * (15 - yearsDiff) / 10);
    return baseRate * reductionFactor;
  } else {
    // After 15 years: much slower decline
    return baseRate * 0.3;
  }
}

/**
 * Get minimum production ratio for long-term tail
 */
function getMinimumProductionRatio(category: 'mature' | 'established' | 'new'): number {
  switch (category) {
    case 'mature':
      return 0.02; // Can produce at 2% of peak for decades
    case 'established':
      return 0.05; // Can produce at 5% of peak
    case 'new':
      return 0.08; // Newer fields have higher minimum production
    default:
      return 0.02;
  }
}

/**
 * Update oil field with projected production data for a specific year
 */
export function updateFieldWithProjection(
  field: OilField,
  targetYear: number,
  phasedOutFields: Set<string>
): OilField {
  const model = createProductionModel(field, 2024);
  const projection = projectProduction(model, targetYear, phasedOutFields, field.id);
  
  // Create updated field with projected data
  const updatedField: OilField = {
    ...field,
    production: {
      ...field.production,
      [targetYear.toString()]: projection,
    },
  };

  return updatedField;
}

/**
 * Update all fields with production projections for a specific year
 */
export function updateFieldsWithProjections(
  fields: OilField[],
  targetYear: number,
  phasedOutFields: Set<string>
): OilField[] {
  return fields.map(field => updateFieldWithProjection(field, targetYear, phasedOutFields));
}

/**
 * Calculate total production decline impact
 */
export function calculateDeclineImpact(
  fields: OilField[],
  fromYear: number,
  toYear: number,
  phasedOutFields: Set<string>
): {
  productionLoss: number;
  emissionReduction: number;
  revenueImpact: number;
} {
  let productionLoss = 0;
  let emissionReduction = 0;

  fields.forEach(field => {
    const model = createProductionModel(field, fromYear);
    
    const fromProduction = projectProduction(model, fromYear, new Set(), field.id);
    const toProduction = projectProduction(model, toYear, phasedOutFields, field.id);
    
    productionLoss += (fromProduction.productionOil || 0) - (toProduction.productionOil || 0);
    emissionReduction += (fromProduction.emission || 0) - (toProduction.emission || 0);
  });

  // Estimate revenue impact (simplified)
  const avgOilPrice = 80; // USD per barrel
  const revenueImpact = productionLoss * 1000000 * avgOilPrice; // Convert to barrels and multiply by price

  return {
    productionLoss,
    emissionReduction,
    revenueImpact,
  };
} 