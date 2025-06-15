import type { OilField, Metrics } from '../types';

// Norwegian baseline metrics (status quo)
export const NORWEGIAN_BASELINES = {
  // Sovereign Wealth Fund (Government Pension Fund Global)
  sovereignWealthFund: {
    currentValue: 15000000000000, // ~15 trillion NOK (2024)
    baselineGrowthRate: 0.03, // 3% annual growth baseline
    petroleumContributionRate: 0.65, // ~65% of petroleum revenue goes to fund
  },
  
  // UN World Happiness Report - Norway typically ranks 5-7th
  happiness: {
    baselineScore: 7.3, // Norway's typical happiness score (0-10 scale)
    maxScore: 10.0,
    // Factors affecting happiness
    economicSecurity: 0.3, // Weight of economic factors
    environmentalConcern: 0.4, // Weight of environmental factors  
    energySecurity: 0.3, // Weight of energy security
  },
  
  // Energy security baseline
  energy: {
    baselineScore: 85, // Norway has high energy security (0-100 scale)
    renewableShare: 0.98, // 98% renewable electricity
    oilDependency: 0.15, // 15% of economy dependent on oil/gas
  },
  
  // Economic equality (Gini coefficient)
  equality: {
    baselineGini: 0.27, // Norway's Gini coefficient (lower = more equal)
    maxGini: 1.0,
    petroleumJobsShare: 0.05, // ~5% of jobs in petroleum sector
  },
  
  // Environmental targets
  environment: {
    currentDomesticEmissions: 50000000, // ~50M tonnes CO2 annually (2024) - domestic only
    currentExportedEmissions: 500000000, // ~500M tonnes CO2 annually from exported oil/gas
    totalEmissions: 550000000, // Total responsibility including exports
    parisTarget2030: 0.55, // 55% reduction by 2030 vs 1990
    carbonNeutralTarget: 2050,
    population: 5400000, // ~5.4M people
    perCapitaEmissions: 101.85, // tonnes CO2 per person including exports (550M/5.4M)
    globalAveragePerCapita: 4.8, // Global average tonnes CO2 per person
  }
};

/**
 * Calculate happiness score based on Norwegian factors
 */
export function calculateNorwegianHappiness(
  economicImpact: number, // Change in petroleum revenue (NOK)
  environmentalImpact: number, // Change in CO2 emissions (tonnes)
  energySecurityImpact: number // Change in energy security (0-100)
): number {
  const baseline = NORWEGIAN_BASELINES.happiness.baselineScore;
  
  // Economic factor: positive revenue supports happiness, but diminishing returns
  const economicFactor = economicImpact > 0 
    ? Math.log(1 + economicImpact / 100000000000) * 0.1 // Logarithmic scaling
    : -Math.sqrt(Math.abs(economicImpact) / 100000000000) * 0.2; // Steeper negative impact
  
  // Environmental factor: Norwegians care deeply about environment and climate responsibility
  // Include both domestic and exported emissions impact
  const environmentalFactor = environmentalImpact < 0 
    ? Math.sqrt(Math.abs(environmentalImpact) / 100000000) * 0.4 // Positive for emission reductions (including exports)
    : -Math.sqrt(environmentalImpact / 100000000) * 0.5; // Negative for emission increases (including exports)
  
  // Energy security factor
  const energyFactor = energySecurityImpact * 0.01; // Direct scaling
  
  const totalImpact = 
    economicFactor * NORWEGIAN_BASELINES.happiness.economicSecurity +
    environmentalFactor * NORWEGIAN_BASELINES.happiness.environmentalConcern +
    energyFactor * NORWEGIAN_BASELINES.happiness.energySecurity;
  
  return Math.max(0, Math.min(10, baseline + totalImpact));
}

/**
 * Calculate sovereign wealth fund growth rate
 */
export function calculateSovereignWealthFundGrowth(
  petroleumRevenue: number, // Annual petroleum revenue (NOK)
  baseYear: number = 2024
): number {
  const baseline = NORWEGIAN_BASELINES.sovereignWealthFund;
  
  // Calculate petroleum contribution to fund
  const petroleumContribution = petroleumRevenue * baseline.petroleumContributionRate;
  
  // Calculate growth rate: baseline + petroleum contribution effect
  const contributionEffect = petroleumContribution / baseline.currentValue;
  
  return baseline.baselineGrowthRate + contributionEffect;
}

/**
 * Calculate energy security score
 */
export function calculateEnergySecurityScore(
  activeOilFields: OilField[],
  year: number,
  phasedOutFields: Set<string>
): number {
  const baseline = NORWEGIAN_BASELINES.energy.baselineScore;
  
  // Calculate remaining oil production capacity
  const totalProduction = activeOilFields.reduce((sum, field) => {
    if (phasedOutFields.has(field.id)) return sum;
    const yearData = field.production[year.toString()];
    return sum + (yearData?.productionOil || 0);
  }, 0);
  
  // Norway's energy security is high due to renewables, but oil provides economic security
  // Gradual phase-out maintains security, rapid phase-out reduces it
  const productionFactor = Math.min(1, totalProduction / 100); // Normalize to 0-1
  const securityImpact = productionFactor * 15; // Max 15 point impact
  
  return Math.max(0, Math.min(100, baseline + securityImpact));
}

/**
 * Calculate economic equality score
 */
export function calculateEqualityScore(
  petroleumRevenue: number,
  unemploymentFromPhaseOut: number = 0
): number {
  const baseline = NORWEGIAN_BASELINES.equality;
  
  // Higher petroleum revenue can increase inequality (resource curse effect)
  // But Norway's strong institutions mitigate this
  const revenueEffect = petroleumRevenue > 0 
    ? Math.log(1 + petroleumRevenue / 1000000000000) * 0.02 // Small negative effect
    : 0;
  
  // Unemployment from phase-out affects equality
  const unemploymentEffect = unemploymentFromPhaseOut * 0.1;
  
  // Convert Gini to 0-100 scale (lower Gini = higher equality score)
  const adjustedGini = baseline.baselineGini + revenueEffect + unemploymentEffect;
  const equalityScore = (1 - adjustedGini) * 100;
  
  return Math.max(0, Math.min(100, equalityScore));
}

/**
 * Calculate comprehensive Norwegian metrics
 */
export function calculateNorwegianMetrics(
  oilFields: OilField[],
  year: number,
  phasedOutFields: Set<string>,
  petroleumRevenue: number,
  totalEmissions: number,
  previousMetrics?: Metrics
): Metrics {
  // Calculate changes from previous year
  const economicChange = previousMetrics 
    ? petroleumRevenue - previousMetrics.revenue 
    : 0;
  
  const emissionChange = previousMetrics 
    ? totalEmissions - previousMetrics.emissions 
    : 0;
  
  // Calculate individual metrics
  const energyScore = calculateEnergySecurityScore(oilFields, year, phasedOutFields);
  const energyChange = previousMetrics ? energyScore - previousMetrics.energy : 0;
  
  const happinessScore = calculateNorwegianHappiness(
    economicChange,
    emissionChange,
    energyChange
  );
  
  const equalityScore = calculateEqualityScore(petroleumRevenue);
  
  return {
    year,
    emissions: totalEmissions,
    energy: energyScore,
    happiness: happinessScore * 10, // Convert to 0-100 scale for consistency
    equality: equalityScore,
    revenue: petroleumRevenue,
  };
}

/**
 * Get sovereign wealth fund status
 */
export function getSovereignWealthFundStatus(
  petroleumRevenue: number,
  year: number,
  baseYear: number = 2024
): {
  currentValue: number;
  growthRate: number;
  petroleumContribution: number;
} {
  const baseline = NORWEGIAN_BASELINES.sovereignWealthFund;
  const yearsDiff = year - baseYear;
  
  const growthRate = calculateSovereignWealthFundGrowth(petroleumRevenue);
  const petroleumContribution = petroleumRevenue * baseline.petroleumContributionRate;
  
  // Project fund value
  const currentValue = baseline.currentValue * Math.pow(1 + growthRate, yearsDiff);
  
  return {
    currentValue,
    growthRate,
    petroleumContribution,
  };
} 