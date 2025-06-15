import React from 'react';
import type { OilField } from '../types';
import { formatNumber } from '../utils/scoringSystem';

interface DirtiestFieldsLeaderboardProps {
  oilFields: OilField[];
  phasedOutFields: Set<string>;
  fieldsToPhaseOutThisYear: Set<string>;
  onToggleFieldForPhaseOut: (fieldId: string) => void;
  currentYear: number;
}

export const DirtiestFieldsLeaderboard: React.FC<DirtiestFieldsLeaderboardProps> = ({
  oilFields,
  phasedOutFields,
  fieldsToPhaseOutThisYear,
  onToggleFieldForPhaseOut,
  currentYear,
}) => {
  // Calculate emissions intensity for each active field
  const activeFields = oilFields.filter(field => !phasedOutFields.has(field.id));
  
  const fieldsWithIntensity = activeFields.map(field => {
    // Find current year data
    const yearData = field.production[currentYear.toString()];
    if (!yearData || !yearData.productionOil || yearData.productionOil <= 0) {
      return { ...field, intensity: 0, emissions: 0, production: 0 };
    }
    
    // Calculate emissions intensity (tonnes CO2 per barrel)
    const emissions = yearData.emission || 0;
    const production = yearData.productionOil || 0;
    const intensity = production > 0 ? emissions / production : 0;
    
    return {
      ...field,
      intensity,
      emissions,
      production,
    };
  }).filter(field => field.production > 0); // Only show producing fields
  
  // Sort by emissions intensity (highest first)
  const sortedFields = fieldsWithIntensity.sort((a, b) => b.intensity - a.intensity);
  
  // Take top 10 dirtiest fields
  const topDirtiestFields = sortedFields.slice(0, 10);

  const handleFieldClick = (fieldId: string) => {
    onToggleFieldForPhaseOut(fieldId);
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      border: '1px solid #E2E8F0'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#2D3748', 
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🏭 Dirtiest Fields ({currentYear})
        </h3>
        <p style={{ 
          fontSize: '14px', 
          color: '#718096',
          margin: 0
        }}>
          Fields with highest CO₂ emissions per barrel. Consider phasing these out first for maximum climate impact.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {topDirtiestFields.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#718096',
            fontStyle: 'italic'
          }}>
            🎉 All fields have been phased out or are not producing this year!
          </div>
        ) : (
          topDirtiestFields.map((field, index) => {
            const isSelected = fieldsToPhaseOutThisYear.has(field.id);
            const rank = index + 1;
            
            return (
              <div
                key={field.id}
                onClick={() => handleFieldClick(field.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `2px solid ${isSelected ? '#3182CE' : '#E2E8F0'}`,
                  backgroundColor: isSelected ? '#EBF8FF' : '#F7FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#CBD5E0';
                    e.currentTarget.style.backgroundColor = '#EDF2F7';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.backgroundColor = '#F7FAFC';
                  }
                }}
              >
                {/* Rank */}
                <div style={{
                  minWidth: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: rank <= 3 ? '#FED7D7' : '#E2E8F0',
                  color: rank <= 3 ? '#C53030' : '#4A5568',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {rank}
                </div>

                {/* Field Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#2D3748',
                    fontSize: '16px',
                    marginBottom: '4px'
                  }}>
                    {field.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#718096',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <span>
                      <strong>Intensity:</strong> {field.intensity.toFixed(2)} tonnes CO₂/barrel
                    </span>
                    <span>
                      <strong>Annual Emissions:</strong> {formatNumber(field.emissions, 'tonnes CO₂')}
                    </span>
                    <span>
                      <strong>Production:</strong> {formatNumber(field.production, 'barrels')}
                    </span>
                  </div>
                </div>

                {/* Selection Indicator */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  border: `2px solid ${isSelected ? '#3182CE' : '#CBD5E0'}`,
                  backgroundColor: isSelected ? '#3182CE' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {isSelected && '✓'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {fieldsToPhaseOutThisYear.size > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#EBF8FF',
          borderRadius: '8px',
          border: '1px solid #BEE3F8'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            color: '#2B6CB0',
            marginBottom: '4px'
          }}>
            Selected for Phase-out: {fieldsToPhaseOutThisYear.size} field{fieldsToPhaseOutThisYear.size !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '12px', color: '#2C5282' }}>
            Click "Advance Year" to phase out selected fields and see the impact.
          </div>
        </div>
      )}
    </div>
  );
}; 