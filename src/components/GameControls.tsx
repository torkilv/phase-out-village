import React from 'react';
import { useGame } from '../contexts/GameContext';
import type { Metrics, InvestmentOption, OilField } from '../types';

interface GameControlsProps {
  currentYear: number;
  metrics: Metrics;
  availableInvestments: InvestmentOption[];
  oilFields: OilField[];
  onAdvanceYear: () => void;
  onStartInvestment: (investment: InvestmentOption) => void;
  onPhaseOutField: (fieldId: string) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  currentYear,
  metrics,
  availableInvestments,
  oilFields,
  onAdvanceYear,
  onStartInvestment,
  onPhaseOutField,
}) => {
  const { state } = useGame();
  
  // Get active fields (not phased out)
  const activeFields = oilFields.filter(field => !state.phasedOutFields.has(field.id));
  
  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  // Format emissions
  const formatEmissions = (amount: number) => {
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M tonnes CO₂`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K tonnes CO₂`;
    return `${amount.toFixed(0)} tonnes CO₂`;
  };

  return (
    <div className="game-controls">
      <div className="year-controls">
        <h2>Year: {currentYear}</h2>
        <div className="oil-price-display">
          <strong>Oil Price: ${state.oilPrice.toFixed(2)}/barrel</strong>
        </div>
        <button onClick={onAdvanceYear}>Advance Year</button>
      </div>

      <div className="metrics-display">
        <h3>Current Metrics</h3>
        <div className="metrics-grid">
          <div>
            <h4>Emissions</h4>
            <p>{formatEmissions(metrics.emissions)}</p>
          </div>
          <div>
            <h4>Energy Security</h4>
            <p>{metrics.energy.toFixed(1)}%</p>
          </div>
          <div>
            <h4>Public Happiness</h4>
            <p>{metrics.happiness.toFixed(1)}%</p>
          </div>
          <div>
            <h4>Economic Equality</h4>
            <p>{metrics.equality.toFixed(1)}%</p>
          </div>
          <div>
            <h4>Total Revenue</h4>
            <p>{formatCurrency(metrics.revenue)}</p>
          </div>
        </div>
      </div>

      <div className="oil-fields-section">
        <h3>Oil Fields ({activeFields.length} active, {state.phasedOutFields.size} phased out)</h3>
        <div className="fields-grid">
          {oilFields.slice(0, 10).map(field => { // Show first 10 fields
            const isActive = !state.phasedOutFields.has(field.id);
            const dividend = state.fieldDividends[field.id] || 0;
            const currentData = field.production[currentYear.toString()];
            
            return (
              <div key={field.id} className={`field-card ${isActive ? 'active' : 'phased-out'}`}>
                <h4>{field.name}</h4>
                <div className="field-info">
                  {currentData?.productionOil && (
                    <p>Production: {currentData.productionOil.toFixed(2)}M barrels</p>
                  )}
                  {currentData?.emission && (
                    <p>Emissions: {formatEmissions(currentData.emission)}</p>
                  )}
                  {dividend > 0 && (
                    <p>Dividend: {formatCurrency(dividend)}</p>
                  )}
                </div>
                {isActive && (
                  <div className="field-actions">
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          onPhaseOutField(field.id);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Phase out year...</option>
                      {field.phaseOutYearOptions.map(year => (
                        <option key={year} value={year}>
                          Phase out in {year}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!isActive && (
                  <div className="phased-out-indicator">
                    <span>Phased Out</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {oilFields.length > 10 && (
          <p className="more-fields-note">
            ... and {oilFields.length - 10} more fields
          </p>
        )}
      </div>

      <div className="investments-section">
        <h3>Investment Options</h3>
        <div className="investment-options">
          {availableInvestments.map((investment, index) => (
            <div key={index} className="investment-option">
              <h4>{investment.type.charAt(0).toUpperCase() + investment.type.slice(1)}</h4>
              <p>{investment.description}</p>
              <div className="investment-details">
                <p><strong>Cost:</strong> {formatCurrency(investment.cost)}</p>
                <p><strong>Timeline:</strong> {investment.timeline} years</p>
                <div className="effects">
                  <strong>Effects:</strong>
                  {Object.entries(investment.effect).map(([key, value]) => (
                    value !== undefined && (
                      <span key={key} className={`effect ${value > 0 ? 'positive' : 'negative'}`}>
                        {key}: {value > 0 ? '+' : ''}{value}
                      </span>
                    )
                  ))}
                </div>
              </div>
              <button 
                onClick={() => onStartInvestment(investment)}
                className="start-investment-btn"
              >
                Start Investment
              </button>
            </div>
          ))}
        </div>
      </div>

      {state.activeInvestments.length > 0 && (
        <div className="active-investments-section">
          <h3>Active Investments ({state.activeInvestments.length})</h3>
          <div className="active-investments">
            {state.activeInvestments.map((item, index) => {
              const yearsActive = currentYear - item.startYear;
              const progress = Math.min(100, (yearsActive / item.investment.timeline) * 100);
              
              return (
                <div key={index} className="active-investment">
                  <h4>{item.investment.type}</h4>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p>
                    Year {yearsActive + 1} of {item.investment.timeline} 
                    ({progress.toFixed(0)}% complete)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 