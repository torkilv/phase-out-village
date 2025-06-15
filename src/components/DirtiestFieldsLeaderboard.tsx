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
  // Calculate emissions intensity for each active field (not manually phased out)
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
  });
  
  // Separate producing fields from non-producing fields
  const producingFields = fieldsWithIntensity.filter(field => field.production > 0);
  const nonProducingActiveFields = fieldsWithIntensity.filter(field => field.production === 0);
  
  // Sort by emissions intensity (highest first)
  const sortedFields = producingFields.sort((a, b) => b.intensity - a.intensity);
  
  // Take top 10 dirtiest fields
  const topDirtiestFields = sortedFields.slice(0, 10);

  const handleFieldClick = (fieldId: string) => {
    onToggleFieldForPhaseOut(fieldId);
  };

  return (
    <div style={{
      backgroundColor: '#F7FAFC',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      height: 'fit-content'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px',
        gap: '8px'
      }}>
        <span style={{ fontSize: '24px' }}>🏭</span>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#2D3748'
        }}>
          Dirtiest Fields ({currentYear})
        </h3>
      </div>

      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#4A5568' }}>
        Click fields to select for phase-out
      </div>

      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>

        {topDirtiestFields.length === 0 && nonProducingActiveFields.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#718096',
            fontStyle: 'italic'
          }}>
            🎉 All fields have been manually phased out!
          </div>
        ) : topDirtiestFields.length === 0 && nonProducingActiveFields.length > 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#718096',
            fontStyle: 'italic'
          }}>
            📉 All remaining fields have naturally declined to zero production.
            <br />
            <span style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              {nonProducingActiveFields.length} field{nonProducingActiveFields.length !== 1 ? 's' : ''} still available for phase-out
            </span>
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
                    fontSize: '14px',
                    color: '#2D3748',
                    marginBottom: '4px'
                  }}>
                    {field.name}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#4A5568'
                  }}>
                    <span>
                      <strong>{field.intensity.toFixed(1)}</strong> kg CO₂/barrel
                    </span>
                    <span>
                      <strong>{formatNumber(field.emissions / 1000, '')}</strong>K tonnes/year
                    </span>
                    <span>
                      <strong>{formatNumber(field.production, '')}</strong>M barrels/year
                    </span>
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#3182CE',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#EDF2F7',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#4A5568'
      }}>
        <div>Active fields: {activeFields.length}</div>
        <div>Producing fields: {producingFields.length}</div>
        <div>Naturally declined: {nonProducingActiveFields.length}</div>
        <div>Manually phased out: {phasedOutFields.size}</div>
      </div>
    </div>
  );
}; 