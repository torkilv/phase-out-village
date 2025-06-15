import { data } from '../generated/data';
import type { OilField } from '../types';

// Approximate coordinates for Norwegian oil fields (simplified)
const FIELD_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Aasta Hansteen': { lat: 67.1, lon: 8.3 },
  'Alvheim': { lat: 56.5, lon: 2.9 },
  'Balder': { lat: 60.8, lon: 2.3 },
  'Brage': { lat: 60.5, lon: 2.4 },
  'Draugen': { lat: 64.3, lon: 7.8 },
  'Edvard Grieg': { lat: 56.6, lon: 2.1 },
  'Ekofisk': { lat: 56.5, lon: 3.2 },
  'Eldfisk': { lat: 56.3, lon: 2.9 },
  'Gjøa': { lat: 61.3, lon: 2.1 },
  'Goliat': { lat: 71.3, lon: 22.2 },
  'Grane': { lat: 58.9, lon: 2.1 },
  'Gullfaks': { lat: 61.2, lon: 2.3 },
  'Heidrun': { lat: 65.3, lon: 7.3 },
  'Johan Castberg': { lat: 71.9, lon: 19.9 },
  'Johan Sverdrup': { lat: 56.1, lon: 2.8 },
  'Kristin': { lat: 65.0, lon: 6.6 },
  'Kvitebjørn': { lat: 61.1, lon: 2.5 },
  'Martin Linge': { lat: 56.5, lon: 3.8 },
  'Njord': { lat: 65.1, lon: 6.6 },
  'Norne': { lat: 66.0, lon: 8.1 },
  'Ormen Lange': { lat: 64.1, lon: 5.9 },
  'Oseberg': { lat: 60.5, lon: 2.8 },
  'Sleipner': { lat: 58.4, lon: 1.9 },
  'Snorre': { lat: 61.4, lon: 2.1 },
  'Statfjord': { lat: 61.2, lon: 1.9 },
  'Troll': { lat: 60.6, lon: 3.7 },
  'Urd': { lat: 56.6, lon: 2.1 },
  'Valhall': { lat: 56.3, lon: 3.4 },
  'Visund': { lat: 61.4, lon: 2.3 },
};

// Field categories for different phase-out scenarios
const FIELD_CATEGORIES = {
  MATURE: [2027, 2028, 2029, 2030], // Older fields, earlier phase-out
  ESTABLISHED: [2030, 2031, 2032, 2033, 2034, 2035], // Established fields
  NEW: [2035, 2036, 2037, 2038, 2039, 2040], // Newer fields, later phase-out
};

/**
 * Determine field category based on production history and characteristics
 */
function categorizeField(_fieldName: string, productionData: Record<string, { productionOil?: number; productionGas?: number; emission?: number }>): keyof typeof FIELD_CATEGORIES {
  const years = Object.keys(productionData).map(Number).filter(y => !isNaN(y)).sort();
  const firstYear = years[0];
  const hasRecentProduction = years.some(year => year >= 2020 && productionData[year]?.productionOil);
  
  // New fields (started production recently)
  if (firstYear >= 2015 && hasRecentProduction) {
    return 'NEW';
  }
  
  // Mature fields (older, declining production)
  if (firstYear <= 2010 || !hasRecentProduction) {
    return 'MATURE';
  }
  
  // Established fields (middle category)
  return 'ESTABLISHED';
}

/**
 * Generate a field ID from the field name
 */
function generateFieldId(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Transform raw data into OilField objects
 */
export function transformRawDataToOilFields(): OilField[] {
  return Object.entries(data).map(([fieldName, productionData]) => {
    const fieldId = generateFieldId(fieldName);
    const category = categorizeField(fieldName, productionData);
    const coordinates = FIELD_COORDINATES[fieldName] || { lat: 60.0, lon: 5.0 }; // Default to Norwegian Sea
    
    // Convert string years to numbers and ensure proper typing
    const production: Record<string, { productionOil?: number; productionGas?: number; emission?: number }> = {};
    Object.entries(productionData).forEach(([year, data]) => {
      production[year] = {
        productionOil: data.productionOil,
        productionGas: data.productionGas,
        emission: data.emission,
      };
    });

    // Add projected data for 2024 if not present
    if (!production['2024']) {
      // Use 2022 data as baseline for 2024 projection (simple approach)
      const data2022 = production['2022'];
      const data2021 = production['2021'];
      
      if (data2022 && (data2022.productionOil || data2022.emission)) {
        // Simple projection: use 2022 data with slight decline
        const declineRate = 0.95; // 5% annual decline
        production['2024'] = {
          productionOil: data2022.productionOil ? data2022.productionOil * declineRate * declineRate : undefined,
          productionGas: data2022.productionGas ? data2022.productionGas * declineRate * declineRate : undefined,
          emission: data2022.emission ? data2022.emission * declineRate * declineRate : undefined,
        };
      } else if (data2021 && (data2021.productionOil || data2021.emission)) {
        // Fallback to 2021 data with more decline
        const declineRate = 0.90; // 10% annual decline over 3 years
        production['2024'] = {
          productionOil: data2021.productionOil ? data2021.productionOil * Math.pow(declineRate, 3) : undefined,
          productionGas: data2021.productionGas ? data2021.productionGas * Math.pow(declineRate, 3) : undefined,
          emission: data2021.emission ? data2021.emission * Math.pow(declineRate, 3) : undefined,
        };
      }
    }
    
    return {
      id: fieldId,
      name: fieldName,
      location: coordinates,
      production,
      phaseOutYearOptions: FIELD_CATEGORIES[category],
    };
  });
}

/**
 * Get fields that are currently active (have recent production data)
 */
export function getActiveFields(fields: OilField[], currentYear: number = 2024): OilField[] {
  return fields.filter(field => {
    // Check if field has production data in the last 3 years
    const recentYears = [currentYear - 1, currentYear - 2, currentYear - 3];
    return recentYears.some(year => {
      const yearData = field.production[year.toString()];
      return yearData && (yearData.productionOil || yearData.emission);
    });
  });
}

/**
 * Get total production statistics
 */
export function getProductionStatistics(fields: OilField[]) {
  const stats = {
    totalFields: fields.length,
    activeFields: 0,
    totalOilProduction: 0,
    totalGasProduction: 0,
    totalEmissions: 0,
    yearRange: { start: Infinity, end: -Infinity },
  };
  
  fields.forEach(field => {
    let hasRecentProduction = false;
    
    Object.entries(field.production).forEach(([year, data]) => {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        stats.yearRange.start = Math.min(stats.yearRange.start, yearNum);
        stats.yearRange.end = Math.max(stats.yearRange.end, yearNum);
        
        if (data.productionOil) {
          stats.totalOilProduction += data.productionOil;
          if (yearNum >= 2020) hasRecentProduction = true;
        }
        if (data.productionGas) {
          stats.totalGasProduction += data.productionGas;
        }
        if (data.emission) {
          stats.totalEmissions += data.emission;
        }
      }
    });
    
    if (hasRecentProduction) {
      stats.activeFields++;
    }
  });
  
  return stats;
} 