import React, { useState, useEffect } from 'react';
import type { OilField } from '../types';
import { calculateEmissionIntensity } from '../utils/dataProcessing';

interface IsometricMapProps {
  oilFields: OilField[];
  currentYear: number;
  phasedOutFields: Set<string>;
  fieldDividends?: Record<string, number>;
  onFieldClick?: (field: OilField) => void;
  selectedField?: OilField | null;
  fieldsToPhaseOutThisYear?: Set<string>;
  onToggleFieldForPhaseOut?: (fieldId: string) => void;
  metrics?: {
    emissions: number;
    energy: number;
    happiness: number;
    revenue: number;
  };
}

interface FieldCardProps {
  field: OilField;
  currentYear: number;
  isActive: boolean;
  production: number;
  emissions: number;
  intensity: number;
  isSelectedForPhaseOut: boolean;
  onTogglePhaseOut: () => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const FieldCard: React.FC<FieldCardProps> = ({
  field,
  currentYear,
  isActive,
  production,
  emissions,
  intensity,
  isSelectedForPhaseOut,
  onTogglePhaseOut,
  onClose,
  position
}) => {
  // Calculate future production projections for next 5 years
  const futureYears = Array.from({length: 5}, (_, i) => currentYear + i + 1);
  const projections = futureYears.map(year => {
    const data = field.production[year.toString()];
    return {
      year,
      production: data?.productionOil || 0,
      emissions: data?.emission || 0
    };
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    if (num >= 1) return num.toFixed(1);
    return num.toFixed(2);
  };

  // Smart positioning to ensure card is always visible
  const cardWidth = 240;
  const cardHeight = 280;
  const margin = 16;
  
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  let left = position.x - cardWidth / 2; // Center the card on click position
  let top = position.y - 60; // Position above click point
  
  // Adjust horizontal position
  if (left + cardWidth + margin > screenWidth) {
    left = screenWidth - cardWidth - margin;
  }
  if (left < margin) {
    left = margin;
  }
  
  // Adjust vertical position
  if (top + cardHeight + margin > screenHeight) {
    top = position.y - cardHeight - 20; // Try above first
    if (top < margin) {
      top = position.y + 20; // Then below if needed
      if (top + cardHeight + margin > screenHeight) {
        top = screenHeight - cardHeight - margin; // Finally force fit
      }
    }
  }
  if (top < margin) {
    top = margin;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: `${cardWidth}px`,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {/* Compact Header */}
      <div style={{
        background: isActive ? 
          (production > 0 ? 'linear-gradient(135deg, #64748b, #475569)' : 'linear-gradient(135deg, #92400e, #78350f)') :
          'linear-gradient(135deg, #374151, #1f2937)',
        color: 'white',
        padding: '10px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1'
          }}
        >
          ×
        </button>
        <h3 style={{ margin: '0 0 3px 0', fontSize: '15px', fontWeight: 'bold', paddingRight: '32px' }}>
          {field.name}
        </h3>
        <div style={{ fontSize: '10px', opacity: 0.9 }}>
          {isActive ? (production > 0 ? 'Active Production' : 'Naturally Declined') : 'Phased Out'}
        </div>
      </div>

      {/* Compact Current Status */}
      <div style={{ padding: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
          <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
              {formatNumber(production)}M
            </div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>barrels/year</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#fef2f2', borderRadius: '4px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>
              {formatNumber(emissions / 1000)}K
            </div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>tonnes CO₂/year</div>
          </div>
        </div>

        {/* Compact Emission Intensity */}
        <div style={{ 
          padding: '6px', 
          backgroundColor: intensity > 30 ? '#fef2f2' : intensity > 20 ? '#fefbf2' : '#f0fdf4',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
            {intensity.toFixed(1)} kg CO₂/barrel
          </div>
          <div style={{ 
            height: '3px', 
            backgroundColor: '#e2e8f0', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (intensity / 50) * 100)}%`,
              backgroundColor: intensity > 30 ? '#dc2626' : intensity > 20 ? '#f59e0b' : '#22c55e',
              borderRadius: '2px'
            }} />
          </div>
        </div>

        {/* Compact Future Projections */}
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#374151' }}>
            Production Projections
          </h4>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'end', height: '35px' }}>
            {projections.map((proj) => (
              <div key={proj.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  height: `${Math.max(3, (proj.production / Math.max(...projections.map(p => p.production), 1)) * 30)}px`,
                  backgroundColor: proj.production > 0 ? '#3b82f6' : '#e2e8f0',
                  width: '100%',
                  borderRadius: '1px 1px 0 0',
                  marginBottom: '2px'
                }} />
                <div style={{ fontSize: '7px', color: '#64748b', textAlign: 'center' }}>
                  {proj.year}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compact Phase Out Button */}
        {isActive && (
          <button
            onClick={onTogglePhaseOut}
            style={{
              width: '100%',
              padding: '7px',
              backgroundColor: isSelectedForPhaseOut ? '#dc2626' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isSelectedForPhaseOut ? '✓ Selected for Phase-Out' : 'Select for Phase-Out'}
          </button>
        )}
      </div>
    </div>
  );
};

export const IsometricMap: React.FC<IsometricMapProps> = ({
  oilFields,
  currentYear,
  phasedOutFields,
  fieldsToPhaseOutThisYear = new Set(),
  onToggleFieldForPhaseOut
}) => {
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [cardField, setCardField] = useState<{ field: OilField; position: { x: number; y: number } } | null>(null);
  const [animationTime, setAnimationTime] = useState(0);

  // Animation loop for pollution effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTime(prev => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const mapWidth = 1400;
  const mapHeight = 900;

  // Enhanced positioning with no overlaps - prioritizes visibility over realism
  const getFieldPosition = (index: number, _field: OilField) => {
    // Create a grid that ensures no overlaps
    const platformSize = 120; // Minimum space needed per platform including text
    const cols = Math.floor((mapWidth - 100) / platformSize); // Calculate columns based on map width
    const startX = 50; // Left margin
    const startY = 80; // Top margin
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Calculate position with guaranteed spacing
    const x = startX + col * platformSize + (platformSize / 2);
    const y = startY + row * platformSize + (platformSize / 2);
    
    return { x, y, z: 0 };
  };

  const getFieldVisuals = (field: OilField) => {
    const currentData = field.production[currentYear.toString()];
    const isActive = !phasedOutFields.has(field.id);
    const isSelectedForPhaseOut = fieldsToPhaseOutThisYear.has(field.id);
    const isHovered = hoveredField === field.id;
    const intensity = calculateEmissionIntensity(field, currentYear);
    const production = currentData?.productionOil || 0;
    const emissions = currentData?.emission || 0;

    // Determine if field is electrified (simplified: newer fields or low emission intensity)
    const isElectrified = intensity < 15 || field.name.toLowerCase().includes('johan');

    // Platform type based on production and age
    let platformType: 'fixed' | 'floating' | 'subsea' = 'fixed';
    let scale = 1.0;
    
    if (production > 50) { 
      platformType = 'fixed'; 
      scale = 1.6; 
    } else if (production > 20) { 
      platformType = 'floating'; 
      scale = 1.3; 
    } else if (production > 5) { 
      platformType = 'fixed'; 
      scale = 1.1; 
    } else if (production > 0.1) { 
      platformType = 'subsea'; 
      scale = 0.9; 
    } else { 
      platformType = 'subsea'; 
      scale = 0.7; 
    }

    // Realistic industrial color scheme based on status and emissions
    let colors = {
      primary: '#64748b',    // Steel gray - default industrial
      secondary: '#475569',  // Darker steel
      accent: '#94a3b8',     // Light steel
      glow: '#64748b40'
    };

    if (!isActive) {
      // Phased out fields - dark gray/black
      colors = { primary: '#374151', secondary: '#1f2937', accent: '#6b7280', glow: '#37415140' };
    } else if (isSelectedForPhaseOut) {
      // Selected for phase-out - blue
      colors = { primary: '#3b82f6', secondary: '#2563eb', accent: '#93c5fd', glow: '#3b82f660' };
    } else if (production === 0) {
      // Naturally declined fields - rust/brown
      colors = { primary: '#92400e', secondary: '#78350f', accent: '#d97706', glow: '#92400e40' };
    } else if (isElectrified) {
      // Electrified fields - clean blue-gray
      colors = { primary: '#0f766e', secondary: '#134e4a', accent: '#5eead4', glow: '#0f766e60' };
    } else if (intensity > 30) {
      // High pollution - dark industrial with red accents
      colors = { primary: '#7c2d12', secondary: '#991b1b', accent: '#fca5a5', glow: '#7c2d1260' };
    } else if (intensity > 20) {
      // Medium pollution - orange-brown industrial
      colors = { primary: '#9a3412', secondary: '#c2410c', accent: '#fdba74', glow: '#9a341260' };
    } else {
      // Low pollution - standard steel with slight blue tint
      colors = { primary: '#475569', secondary: '#334155', accent: '#cbd5e1', glow: '#47556960' };
    }

    return {
      platformType, scale, colors, isActive, isSelectedForPhaseOut, isHovered, isElectrified,
      production, emissions, intensity
    };
  };

  // Simplified text positioning since platforms won't overlap
  const calculateTextPositions = (fields: OilField[]) => {
    const positions = new Map<string, { x: number; y: number }>();
    
    fields.forEach((field, index) => {
      const basePos = getFieldPosition(index, field);
      // Use standard text position since platforms are well-spaced
      positions.set(field.id, { x: basePos.x, y: basePos.y + 55 });
    });
    
    return positions;
  };

  const textPositions = calculateTextPositions(oilFields);

  const renderPlatform = (field: OilField, index: number) => {
    const pos = getFieldPosition(index, field);
    const visuals = getFieldVisuals(field);
    const hoverScale = visuals.isHovered ? 1.15 : 1;
    const selectScale = visuals.isSelectedForPhaseOut ? 1.2 : 1;
    const finalScale = visuals.scale * hoverScale * selectScale;

         const handleClick = (e: React.MouseEvent) => {
       e.stopPropagation();
       const rect = (e.currentTarget.closest('svg') as SVGElement)?.getBoundingClientRect();
       const svgX = rect ? e.clientX - rect.left : e.clientX;
       const svgY = rect ? e.clientY - rect.top : e.clientY;
       
       setCardField({
         field,
         position: { 
           x: rect ? rect.left + svgX : e.clientX, 
           y: rect ? rect.top + svgY : e.clientY 
         }
       });
     };

    return (
      <g
        key={field.id}
        transform={`translate(${pos.x}, ${pos.y}) scale(${finalScale})`}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => setHoveredField(field.id)}
        onMouseLeave={() => setHoveredField(null)}
        onClick={handleClick}
      >
        {/* Selection ring */}
        {visuals.isSelectedForPhaseOut && (
          <circle
            cx="0" cy="0" r="60"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeDasharray="12,6"
            opacity="0.8"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0;360"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Water surface and ripples */}
        <ellipse cx="0" cy="35" rx="45" ry="15" fill="rgba(59, 130, 246, 0.3)" opacity="0.6" />
        <ellipse cx="0" cy="37" rx="40" ry="12" fill="rgba(59, 130, 246, 0.2)" opacity="0.4">
          <animate attributeName="rx" values="40;45;40" dur="3s" repeatCount="indefinite" />
          <animate attributeName="ry" values="12;15;12" dur="3s" repeatCount="indefinite" />
        </ellipse>

        {/* Platform shadow */}
        <ellipse cx="3" cy="32" rx="35" ry="12" fill="rgba(0,0,0,0.3)" opacity="0.6" />

        {/* Platform structure based on type */}
        {visuals.platformType === 'fixed' && (
          <g>
            {/* Main platform deck */}
            <rect x="-40" y="-15" width="80" height="30" rx="8" 
                  fill={visuals.colors.primary} stroke={visuals.colors.secondary} strokeWidth="2" />
            
            {/* Support legs */}
            <rect x="-35" y="15" width="8" height="20" fill={visuals.colors.secondary} />
            <rect x="-10" y="15" width="8" height="20" fill={visuals.colors.secondary} />
            <rect x="15" y="15" width="8" height="20" fill={visuals.colors.secondary} />
            <rect x="27" y="15" width="8" height="20" fill={visuals.colors.secondary} />
            
            {/* Drilling derrick */}
            <polygon points="-5,-15 5,-15 3,-45 -3,-45" fill="#374151" />
            <rect x="-6" y="-45" width="12" height="4" fill="#1f2937" />
            
            {/* Helipad */}
            <circle cx="25" cy="-5" r="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
            <text x="25" y="-2" textAnchor="middle" fontSize="8" fill="#92400e">H</text>
          </g>
        )}

        {visuals.platformType === 'floating' && (
          <g>
            {/* Floating hull */}
            <ellipse cx="0" cy="10" rx="45" ry="18" fill={visuals.colors.primary} stroke={visuals.colors.secondary} strokeWidth="2" />
            
            {/* Upper deck */}
            <rect x="-35" y="-10" width="70" height="20" rx="6" 
                  fill={visuals.colors.primary} stroke={visuals.colors.secondary} strokeWidth="2" />
            
            {/* Drilling tower */}
            <polygon points="-4,-10 4,-10 2,-35 -2,-35" fill="#374151" />
            
            {/* Mooring lines */}
            <line x1="-40" y1="25" x2="-60" y2="40" stroke="#64748b" strokeWidth="2" opacity="0.6" />
            <line x1="40" y1="25" x2="60" y2="40" stroke="#64748b" strokeWidth="2" opacity="0.6" />
            
            {/* Helipad */}
            <circle cx="20" cy="0" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
          </g>
        )}

        {visuals.platformType === 'subsea' && (
          <g>
            {/* Subsea template */}
            <rect x="-25" y="5" width="50" height="25" rx="4" 
                  fill={visuals.colors.primary} stroke={visuals.colors.secondary} strokeWidth="2" opacity="0.8" />
            
            {/* Wellheads */}
            <circle cx="-10" cy="15" r="4" fill="#374151" />
            <circle cx="0" cy="15" r="4" fill="#374151" />
            <circle cx="10" cy="15" r="4" fill="#374151" />
            
            {/* Umbilical */}
            <path d="M 0,5 Q -20,-10 -40,-5" stroke="#64748b" strokeWidth="3" fill="none" opacity="0.7" />
          </g>
        )}

        {/* Electrification indicator */}
        {visuals.isElectrified && visuals.isActive && (
          <g transform="translate(30, -25)">
            <circle r="8" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
            <text x="0" y="2" textAnchor="middle" fontSize="10" fill="white">⚡</text>
          </g>
        )}

        {/* Pollution animation */}
        {visuals.isActive && visuals.emissions > 0 && (
          <g opacity="0.7">
            {/* Main smokestack */}
            <rect x="15" y="-25" width="4" height="20" fill="#6b7280" />
            
            {/* Animated smoke particles */}
            {[0, 1, 2].map(i => (
              <circle
                key={i}
                cx={17 + Math.sin(animationTime + i) * 3}
                cy={-30 - i * 8 - Math.sin(animationTime * 2 + i) * 5}
                r={2 + Math.sin(animationTime + i) * 1}
                fill={visuals.intensity > 30 ? "#ef4444" : visuals.intensity > 20 ? "#f59e0b" : "#64748b"}
                opacity={0.6 - i * 0.15}
              >
                <animate attributeName="cy" 
                  values={`${-30 - i * 8};${-50 - i * 8};${-30 - i * 8}`} 
                  dur={`${3 + i * 0.5}s`} 
                  repeatCount="indefinite" />
                <animate attributeName="opacity" 
                  values="0.6;0.2;0.6" 
                  dur={`${3 + i * 0.5}s`} 
                  repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        )}

                 {/* Field name with clear outline */}
         <text
           x={textPositions.get(field.id)?.x ? textPositions.get(field.id)!.x - pos.x : 0}
           y={textPositions.get(field.id)?.y ? textPositions.get(field.id)!.y - pos.y : 55}
           textAnchor="middle"
           fill="white"
           fontSize="12"
           fontWeight="bold"
           stroke="rgba(0,0,0,0.9)"
           strokeWidth="2"
           paintOrder="stroke fill"
         >
           {field.name.length > 12 ? field.name.substring(0, 12) + '...' : field.name}
         </text>

                 {/* Status indicators with clear outline */}
         {!visuals.isActive && (
           <text 
             x={textPositions.get(field.id)?.x ? textPositions.get(field.id)!.x - pos.x : 0} 
             y={textPositions.get(field.id)?.y ? textPositions.get(field.id)!.y - pos.y + 15 : 70} 
             textAnchor="middle" 
             fontSize="10" 
             fill="#94a3b8" 
             fontWeight="bold"
             stroke="rgba(0,0,0,0.9)"
             strokeWidth="1.5"
             paintOrder="stroke fill"
           >
             PHASED OUT
           </text>
         )}
         {visuals.isActive && visuals.production === 0 && (
           <text 
             x={textPositions.get(field.id)?.x ? textPositions.get(field.id)!.x - pos.x : 0} 
             y={textPositions.get(field.id)?.y ? textPositions.get(field.id)!.y - pos.y + 15 : 70} 
             textAnchor="middle" 
             fontSize="10" 
             fill="#64748b" 
             fontWeight="bold"
             stroke="rgba(0,0,0,0.9)"
             strokeWidth="1.5"
             paintOrder="stroke fill"
           >
             DEPLETED
           </text>
         )}
      </g>
    );
  };

  return (
    <div className="game-map-container" style={{ position: 'relative' }}>
      {/* Main Map */}
      <div className="game-map-3d">
        <svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
          <defs>
            <radialGradient id="oceanGradient" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="40%" stopColor="#0284c7" />
              <stop offset="80%" stopColor="#0c4a6e" />
              <stop offset="100%" stopColor="#082f49" />
            </radialGradient>
            
            <pattern id="waves" x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
              <path d="M0 25 Q25 20 50 25 T100 25" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none">
                <animate attributeName="d" 
                  values="M0 25 Q25 20 50 25 T100 25;M0 25 Q25 30 50 25 T100 25;M0 25 Q25 20 50 25 T100 25" 
                  dur="4s" 
                  repeatCount="indefinite" />
              </path>
            </pattern>
          </defs>
          
          {/* Ocean background */}
          <rect width="100%" height="100%" fill="url(#oceanGradient)" />
          <rect width="100%" height="100%" fill="url(#waves)" opacity="0.4" />
          
          {/* Oil platforms */}
          {oilFields.map((field, index) => renderPlatform(field, index))}
        </svg>
      </div>

      {/* Timeline */}
      <div className="game-timeline">
        <div className="timeline-track">
          <div className="timeline-progress" style={{ width: `${((currentYear - 2024) / (2070 - 2024)) * 100}%` }}></div>
          <div className="timeline-marker" style={{ left: `${((currentYear - 2024) / (2070 - 2024)) * 100}%` }}>
            <div className="year-bubble">{currentYear}</div>
          </div>
        </div>
        <div className="timeline-labels">
          <span>2024</span>
          <span>2070</span>
        </div>
      </div>

      {/* Field Card Popup */}
      {cardField && (
        <FieldCard
          field={cardField.field}
          currentYear={currentYear}
          isActive={!phasedOutFields.has(cardField.field.id)}
          production={cardField.field.production[currentYear.toString()]?.productionOil || 0}
          emissions={cardField.field.production[currentYear.toString()]?.emission || 0}
          intensity={calculateEmissionIntensity(cardField.field, currentYear)}
          isSelectedForPhaseOut={fieldsToPhaseOutThisYear.has(cardField.field.id)}
          onTogglePhaseOut={() => {
            if (onToggleFieldForPhaseOut) {
              onToggleFieldForPhaseOut(cardField.field.id);
            }
          }}
          onClose={() => setCardField(null)}
          position={cardField.position}
        />
      )}

      {/* Click outside to close card */}
      {cardField && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setCardField(null)}
        />
      )}
    </div>
  );
}; 