import React, { useState } from 'react';
import type { OilField } from '../types';
import { calculateEmissionIntensity } from '../utils/dataProcessing';

interface HexagonalMapProps {
  oilFields: OilField[];
  currentYear: number;
  phasedOutFields: Set<string>;
  fieldDividends: Record<string, number>;
  onFieldClick: (field: OilField) => void;
  selectedField?: OilField | null;
  metrics?: {
    emissions: number;
    energy: number;
    happiness: number;
    revenue: number;
  };
}

export const HexagonalMap: React.FC<HexagonalMapProps> = ({
  oilFields,
  currentYear,
  phasedOutFields,
  fieldDividends,
  onFieldClick,
  selectedField
}) => {
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  const mapWidth = 1200;
  const mapHeight = 800;
  const hexRadius = 45; // Radius of each hexagon
  const hexWidth = hexRadius * 2;
  const hexHeight = hexRadius * Math.sqrt(3);

  // Generate hexagonal grid positions
  const getHexPosition = (index: number) => {
    const cols = 12; // Number of columns in the hex grid
    const rows = 8;   // Number of rows
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Hexagonal grid offset (every other row is shifted)
    const xOffset = (row % 2) * (hexWidth * 0.75) / 2;
    
    const x = (mapWidth / 2) - (cols * hexWidth * 0.75) / 2 + col * (hexWidth * 0.75) + xOffset;
    const y = (mapHeight / 2) - (rows * hexHeight) / 2 + row * (hexHeight * 0.75);
    
    return { x, y };
  };

  // Generate hexagon path
  const getHexagonPath = (centerX: number, centerY: number, radius: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')} Z`;
  };

  const getFieldVisuals = (field: OilField) => {
    const currentData = field.production[currentYear.toString()];
    const isActive = !phasedOutFields.has(field.id);
    const isSelected = selectedField?.id === field.id;
    const isHovered = hoveredField === field.id;
    const intensity = calculateEmissionIntensity(field, currentYear);
    const dividend = fieldDividends[field.id] || 0;
    const production = currentData?.productionOil || 0;

    // Color based on emissions intensity
    let colors = {
      fill: '#10b981',      // Green for clean
      stroke: '#059669',
      glow: '#10b98140'
    };

    if (!isActive) {
      colors = { fill: '#9ca3af', stroke: '#6b7280', glow: '#9ca3af40' };
    } else if (intensity > 30) {
      colors = { fill: '#ef4444', stroke: '#dc2626', glow: '#ef444440' };
    } else if (intensity > 20) {
      colors = { fill: '#f97316', stroke: '#ea580c', glow: '#f9731640' };
    } else if (intensity > 10) {
      colors = { fill: '#eab308', stroke: '#ca8a04', glow: '#eab30840' };
    }

    // Size based on production
    let size = 0.7;
    if (production > 20) size = 1.2;
    else if (production > 10) size = 1.0;
    else if (production > 5) size = 0.85;

    return {
      colors, size, isActive, isSelected, isHovered,
      production, emissions: currentData?.emission || 0, dividend, intensity
    };
  };

  const renderHexagon = (field: OilField, index: number) => {
    const pos = getHexPosition(index);
    const visuals = getFieldVisuals(field);
    const hoverScale = visuals.isHovered ? 1.1 : 1;
    const selectScale = visuals.isSelected ? 1.15 : 1;
    const finalScale = visuals.size * hoverScale * selectScale;
    const finalRadius = hexRadius * finalScale;

    return (
      <g
        key={field.id}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.2s ease-out'
        }}
        onMouseEnter={() => setHoveredField(field.id)}
        onMouseLeave={() => setHoveredField(null)}
        onClick={() => onFieldClick(field)}
      >
        {/* Glow effect for selected/hovered */}
        {(visuals.isSelected || visuals.isHovered) && (
          <path
            d={getHexagonPath(pos.x, pos.y, finalRadius + 8)}
            fill={visuals.colors.glow}
            opacity={visuals.isSelected ? 0.8 : 0.5}
          />
        )}

        {/* Main hexagon */}
        <path
          d={getHexagonPath(pos.x, pos.y, finalRadius)}
          fill={visuals.colors.fill}
          stroke={visuals.colors.stroke}
          strokeWidth={visuals.isSelected ? 4 : 2}
          opacity={visuals.isActive ? 1 : 0.6}
        />

        {/* Inner hexagon for depth */}
        <path
          d={getHexagonPath(pos.x, pos.y, finalRadius * 0.8)}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />

        {/* Oil platform icon in center */}
        {visuals.isActive && (
          <g transform={`translate(${pos.x}, ${pos.y})`}>
            {/* Platform base */}
            <circle r="8" fill="#374151" />
            <circle r="6" fill="#4b5563" />
            
            {/* Tower */}
            <rect x="-2" y="-12" width="4" height="10" fill="#1f2937" rx="1" />
            <rect x="-1.5" y="-13" width="3" height="2" fill="#111827" rx="0.5" />
            
            {/* Light */}
            <circle cx="0" cy="-8" r="1.5" fill="#dc2626" />
            <circle cx="0" cy="-8" r="0.8" fill="#fca5a5" opacity="0.8" />
            
            {/* Production indicator */}
            {visuals.production > 10 && (
              <>
                <rect x="-6" y="-2" width="3" height="6" fill="#1e40af" rx="0.5" />
                <rect x="3" y="-2" width="3" height="6" fill="#1e40af" rx="0.5" />
              </>
            )}
          </g>
        )}

        {/* Field name label */}
        <text
          x={pos.x}
          y={pos.y + finalRadius + 15}
          textAnchor="middle"
          fontSize="10"
          fill="#374151"
          fontWeight="bold"
          opacity={visuals.isHovered || visuals.isSelected ? 1 : 0.7}
        >
          {field.name.length > 8 ? field.name.substring(0, 8) + '...' : field.name}
        </text>

        {/* Production/emissions info on hover */}
        {visuals.isHovered && (
          <g transform={`translate(${pos.x + finalRadius + 10}, ${pos.y - 20})`}>
            <rect
              x="0" y="0" width="120" height="60"
              fill="rgba(0,0,0,0.9)"
              rx="4"
            />
            <text x="8" y="15" fill="white" fontSize="10" fontWeight="bold">
              {field.name}
            </text>
            <text x="8" y="28" fill="#10b981" fontSize="9">
              Production: {visuals.production.toFixed(1)}M bbl
            </text>
            <text x="8" y="40" fill="#f87171" fontSize="9">
              Emissions: {(visuals.emissions / 1000).toFixed(1)}K tonnes
            </text>
            <text x="8" y="52" fill="#fbbf24" fontSize="9">
              Intensity: {visuals.intensity.toFixed(1)} CO₂/bbl
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div style={{ 
      backgroundColor: '#f0f9ff', 
      borderRadius: '12px', 
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      border: '1px solid #e0e7ff'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#1e40af',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🛢️ Norwegian Oil Fields ({currentYear})
        </h3>
        <p style={{ 
          fontSize: '14px', 
          color: '#64748b',
          margin: '4px 0 0 0'
        }}>
          Click hexagons to select fields. Hover for details. Color indicates emissions intensity.
        </p>
      </div>

      <svg 
        width={mapWidth} 
        height={mapHeight}
        style={{ 
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          border: '2px solid #bfdbfe'
        }}
      >
        {/* Ocean background pattern */}
        <defs>
          <pattern id="waves" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0,20 Q10,10 20,20 T40,20" stroke="#93c5fd" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M0,25 Q10,15 20,25 T40,25" stroke="#93c5fd" strokeWidth="1" fill="none" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#waves)" />

        {/* Render hexagonal oil fields */}
        {oilFields.slice(0, 96).map((field, index) => renderHexagon(field, index))}
        
        {/* Legend */}
        <g transform="translate(50, 50)">
          <rect x="0" y="0" width="200" height="120" fill="rgba(255,255,255,0.95)" rx="8" stroke="#cbd5e1" />
          <text x="10" y="20" fontSize="12" fontWeight="bold" fill="#374151">Emissions Intensity</text>
          
          <circle cx="20" cy="35" r="8" fill="#10b981" />
          <text x="35" y="40" fontSize="10" fill="#374151">Low (&lt;10 CO₂/bbl)</text>
          
          <circle cx="20" cy="55" r="8" fill="#eab308" />
          <text x="35" y="60" fontSize="10" fill="#374151">Medium (10-20)</text>
          
          <circle cx="20" cy="75" r="8" fill="#f97316" />
          <text x="35" y="80" fontSize="10" fill="#374151">High (20-30)</text>
          
          <circle cx="20" cy="95" r="8" fill="#ef4444" />
          <text x="35" y="100" fontSize="10" fill="#374151">Very High (&gt;30)</text>
        </g>
      </svg>
    </div>
  );
}; 