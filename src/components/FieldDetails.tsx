import React from 'react';
import type { OilField } from '../types';
import { calculateEmissionIntensity } from '../utils/dataProcessing';

interface FieldDetailsProps {
  field: OilField;
  currentYear: number;
  isActive: boolean;
  dividend: number;
  onPhaseOut: (fieldId: string) => void;
}

export const FieldDetails: React.FC<FieldDetailsProps> = ({
  field,
  currentYear,
  isActive,
  dividend,
  onPhaseOut,
}) => {
  const currentData = field.production[currentYear.toString()];
  const emissionIntensity = calculateEmissionIntensity(field, currentYear);
  
  // Get recent years data for trend analysis
  const recentYears = [currentYear - 2, currentYear - 1, currentYear]
    .filter(year => field.production[year.toString()])
    .map(year => ({
      year,
      data: field.production[year.toString()]
    }));

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatEmissions = (amount: number) => {
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M tonnes CO₂`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K tonnes CO₂`;
    return `${amount.toFixed(0)} tonnes CO₂`;
  };

  return (
    <div className="field-details">
      <div className="field-header">
        <h3>{field.name}</h3>
        <div className={`status-badge ${isActive ? 'active' : 'phased-out'}`}>
          {isActive ? 'Active' : 'Phased Out'}
        </div>
      </div>

      <div className="field-info-grid">
        <div className="info-section">
          <h4>Location</h4>
          <p>
            {'lat' in field.location 
              ? `${field.location.lat.toFixed(2)}°N, ${field.location.lon.toFixed(2)}°E`
              : `${field.location.x}, ${field.location.y}`
            }
          </p>
        </div>

        {currentData && (
          <>
            <div className="info-section">
              <h4>Current Production ({currentYear})</h4>
              {currentData.productionOil && (
                <p>Oil: {currentData.productionOil.toFixed(2)} million barrels</p>
              )}
              {currentData.productionGas && (
                <p>Gas: {currentData.productionGas.toFixed(2)} billion m³</p>
              )}
            </div>

            <div className="info-section">
              <h4>Environmental Impact</h4>
              {currentData.emission && (
                <p>Emissions: {formatEmissions(currentData.emission)}</p>
              )}
              {emissionIntensity > 0 && (
                <p>Intensity: {emissionIntensity.toFixed(1)} kg CO₂/barrel</p>
              )}
            </div>
          </>
        )}

        {dividend > 0 && (
          <div className="info-section">
            <h4>Economic Impact</h4>
            <p>Annual Dividend: {formatCurrency(dividend)}</p>
          </div>
        )}
      </div>

      {recentYears.length > 1 && (
        <div className="production-trend">
          <h4>Recent Production Trend</h4>
          <div className="trend-chart">
            {recentYears.map(({ year, data }) => (
              <div key={year} className="trend-item">
                <div className="trend-year">{year}</div>
                <div className="trend-data">
                  {data.productionOil && (
                    <div>Oil: {data.productionOil.toFixed(1)}M</div>
                  )}
                  {data.emission && (
                    <div>CO₂: {(data.emission / 1000).toFixed(0)}K</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isActive && (
        <div className="phase-out-section">
          <h4>Phase-out Options</h4>
          <div className="phase-out-options">
            {field.phaseOutYearOptions.map(year => (
              <button
                key={year}
                className="phase-out-btn"
                onClick={() => onPhaseOut(field.id)}
              >
                Phase out in {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 