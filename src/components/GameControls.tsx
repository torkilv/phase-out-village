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
  // New props for enhanced gameplay
  fieldsToPhaseOutThisYear?: Set<string>;
  onPhaseOutSelectedFields?: () => void;
  onClearFieldsToPhaseOut?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  currentYear,
  oilFields,
  onAdvanceYear,
  fieldsToPhaseOutThisYear = new Set(),
  onPhaseOutSelectedFields,
  onClearFieldsToPhaseOut,
}) => {
  const { state } = useGame();
  
  // Get active fields (not phased out)
  const activeFields = oilFields.filter(field => !state.phasedOutFields.has(field.id));

  // Format emissions
  const formatEmissions = (amount: number) => {
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M tonnes CO₂`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K tonnes CO₂`;
    return `${amount.toFixed(0)} tonnes CO₂`;
  };

  return (
    <div className="game-controls">
      <div className="year-controls">
        {/* Enhanced Year Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {fieldsToPhaseOutThisYear.size > 0 && (
            <div style={{
              padding: '12px',
              backgroundColor: '#FFF3CD',
              border: '1px solid #FFEAA7',
              borderRadius: '8px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Ready to Phase Out: {fieldsToPhaseOutThisYear.size} field{fieldsToPhaseOutThisYear.size !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    if (onPhaseOutSelectedFields) {
                      onPhaseOutSelectedFields();
                      onAdvanceYear();
                    }
                  }}
                  style={{
                    backgroundColor: '#28A745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Phase Out & Advance Year
                </button>
                <button 
                  onClick={onClearFieldsToPhaseOut}
                  style={{
                    backgroundColor: '#6C757D',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={onAdvanceYear}
            style={{
              backgroundColor: fieldsToPhaseOutThisYear.size > 0 ? '#6C757D' : '#007BFF',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {fieldsToPhaseOutThisYear.size > 0 ? 'Advance Year (No Changes)' : 'Advance Year'}
          </button>
        </div>
      </div>

      <div className="dirtiest-fields-section">
        <h3>🏭 Dirtiest Fields</h3>
        <div className="dirtiest-fields-list">
          {activeFields
            .map(field => {
              const currentData = field.production[currentYear.toString()];
              const intensity = currentData ? (currentData.emission || 0) / Math.max(currentData.productionOil || 1, 1) : 0;
              return { field, intensity, emission: currentData?.emission || 0 };
            })
            .sort((a, b) => b.intensity - a.intensity)
            .slice(0, 5)
            .map(({ field, intensity, emission }, index) => (
              <div key={field.id} className="dirty-field-item">
                <div className="field-rank">#{index + 1}</div>
                <div className="field-info">
                  <div className="field-name">{field.name}</div>
                  <div className="field-stats">
                    <span className="intensity">{intensity.toFixed(1)} CO₂/barrel</span>
                    <span className="total-emission">{formatEmissions(emission)}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}; 