import React, { useState } from 'react';
import type { OilField } from '../types';
import { calculateEmissionIntensity } from '../utils/dataProcessing';

interface IsometricMapProps {
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

export const IsometricMap: React.FC<IsometricMapProps> = ({
  oilFields,
  currentYear,
  phasedOutFields,
  fieldDividends,
  onFieldClick,
  selectedField,
  metrics = { emissions: 0, energy: 100, happiness: 100, revenue: 0 }
}) => {
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  const mapWidth = 1200;
  const mapHeight = 800;

  // Create hexagonal grid layout with proper spacing for readability
  const getHexPosition = (index: number) => {
    const hexRadius = 50; // Increased from 35 to 50
    const hexWidth = hexRadius * 2;
    const hexHeight = hexRadius * Math.sqrt(3);
    const cols = 10; // Reduced from 12 to 10 for better spacing
    const padding = 15; // Added padding between hexagons
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Hexagonal grid offset (every other row is shifted)
    const xOffset = (row % 2) * ((hexWidth * 0.75) + padding) / 2;
    
    const x = (mapWidth / 2) - (cols * (hexWidth * 0.75 + padding)) / 2 + col * (hexWidth * 0.75 + padding) + xOffset;
    const y = (mapHeight / 2) - (6 * (hexHeight * 0.75 + padding)) / 2 + row * (hexHeight * 0.75 + padding);
    
    return { x, y, z: 0, ringIndex: row };
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

    // Platform size and type
    let platformSize = 'small';
    let scale = 0.8;
    if (production > 20) { platformSize = 'mega'; scale = 1.4; }
    else if (production > 10) { platformSize = 'large'; scale = 1.2; }
    else if (production > 5) { platformSize = 'medium'; scale = 1.0; }

    // Color based on emissions with game-like colors
    let colors = {
      base: '#4ade80',      // Bright green
      shadow: '#22c55e',
      highlight: '#86efac',
      glow: '#4ade8060'
    };

    if (!isActive) {
      colors = { base: '#94a3b8', shadow: '#64748b', highlight: '#cbd5e1', glow: '#94a3b860' };
    } else if (intensity > 30) {
      colors = { base: '#f87171', shadow: '#ef4444', highlight: '#fca5a5', glow: '#f8717160' };
    } else if (intensity > 20) {
      colors = { base: '#fb923c', shadow: '#f97316', highlight: '#fdba74', glow: '#fb923c60' };
    } else if (intensity > 10) {
      colors = { base: '#fbbf24', shadow: '#f59e0b', highlight: '#fcd34d', glow: '#fbbf2460' };
    }

    return {
      platformSize, scale, colors, isActive, isSelected, isHovered,
      production, emissions: currentData?.emission || 0, dividend, intensity
    };
  };

  const renderPlatform = (field: OilField, index: number) => {
    const pos = getHexPosition(index);
    const visuals = getFieldVisuals(field);
    const hoverScale = visuals.isHovered ? 1.1 : 1;
    const selectScale = visuals.isSelected ? 1.2 : 1;
    const finalScale = visuals.scale * hoverScale * selectScale;

    return (
      <g
        key={field.id}
        transform={`translate(${pos.x}, ${pos.y - pos.z}) scale(${finalScale})`}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: visuals.isSelected ? `drop-shadow(0 0 30px ${visuals.colors.glow})` : 'none'
        }}
        onMouseEnter={() => setHoveredField(field.id)}
        onMouseLeave={() => setHoveredField(null)}
        onClick={() => onFieldClick(field)}
      >
        {/* Platform glow */}
        {visuals.isActive && (
          <circle
            cx="0" cy="0" r="40"
            fill={visuals.colors.glow}
            opacity={visuals.isHovered ? 0.8 : 0.4}
          />
        )}

        {/* Water ripples */}
        <ellipse cx="0" cy="25" rx="35" ry="12" fill="rgba(255,255,255,0.1)" opacity="0.6" />
        <ellipse cx="0" cy="27" rx="30" ry="10" fill="rgba(255,255,255,0.08)" opacity="0.4" />

        {/* Platform shadow */}
        <ellipse cx="2" cy="22" rx="28" ry="10" fill="rgba(0,0,0,0.4)" opacity="0.7" />

        {/* Hexagonal Platform base */}
        <g>
          {/* Main hexagon */}
          <path
            d={getHexagonPath(0, 0, 40)}
            fill={visuals.colors.base}
            stroke={visuals.colors.shadow}
            strokeWidth="2"
          />
          
          {/* Inner hexagon for depth */}
          <path
            d={getHexagonPath(0, 0, 32)}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          
          {/* Highlight hexagon */}
          <path
            d={getHexagonPath(0, 0, 28)}
            fill={visuals.colors.highlight}
            opacity="0.4"
          />
        </g>

        {/* Central structure */}
        <g>
          {/* Main tower */}
          <rect x="-4" y="-25" width="8" height="20" fill="#374151" rx="1" />
          <rect x="-3" y="-26" width="6" height="3" fill="#1f2937" rx="1" />
          <polygon points="-5,-25 5,-25 6,-23 -6,-23" fill="#1f2937" />
          
          {/* Tower details */}
          <rect x="-2" y="-22" width="4" height="12" fill="#6b7280" opacity="0.8" />
          <circle cx="0" cy="-18" r="2" fill="#dc2626" />
          <circle cx="0" cy="-18" r="1" fill="#fca5a5" opacity="0.8" />
        </g>

        {/* Field information overlay */}
        <g opacity={visuals.isHovered || visuals.isSelected ? 1 : 0.8}>
          {/* Field name */}
          <text
            x="0" y="15"
            textAnchor="middle"
            fontSize="8"
            fill="white"
            fontWeight="bold"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="0.5"
          >
            {field.name.length > 10 ? field.name.substring(0, 10) + '...' : field.name}
          </text>
          
          {/* Production info */}
          <text
            x="0" y="25"
            textAnchor="middle"
            fontSize="6"
            fill="white"
            opacity="0.9"
          >
            {visuals.production.toFixed(1)}M bbl
          </text>
          
          {/* Emissions info */}
          <text
            x="0" y="33"
            textAnchor="middle"
            fontSize="6"
            fill={visuals.intensity > 20 ? "#fca5a5" : "#86efac"}
            fontWeight="bold"
          >
            {(visuals.emissions / 1000).toFixed(0)}K CO₂
          </text>
        </g>

        {/* Side structures for larger platforms */}
        {(visuals.platformSize === 'large' || visuals.platformSize === 'mega') && (
          <>
            <g transform="translate(-12, 2)">
              <rect x="0" y="0" width="6" height="8" fill="#1e40af" rx="1" />
              <rect x="1" y="1" width="1.5" height="1.5" fill="#3b82f6" />
              <rect x="3.5" y="1" width="1.5" height="1.5" fill="#3b82f6" />
              <rect x="1" y="4" width="4" height="0.5" fill="#60a5fa" />
            </g>
            
            <g transform="translate(6, 2)">
              <rect x="0" y="0" width="6" height="8" fill="#1e40af" rx="1" />
              <rect x="1" y="1" width="1.5" height="1.5" fill="#3b82f6" />
              <rect x="3.5" y="1" width="1.5" height="1.5" fill="#3b82f6" />
              <rect x="1" y="4" width="4" height="0.5" fill="#60a5fa" />
            </g>
          </>
        )}

        {/* Mega platform extras */}
        {visuals.platformSize === 'mega' && (
          <>
            <g transform="translate(-6, -15)">
              <rect x="0" y="0" width="3" height="12" fill="#374151" />
              <rect x="0.5" y="-1" width="2" height="1" fill="#1f2937" />
            </g>
            <g transform="translate(3, -15)">
              <rect x="0" y="0" width="3" height="12" fill="#374151" />
              <rect x="0.5" y="-1" width="2" height="1" fill="#1f2937" />
            </g>
          </>
        )}

        {/* Smokestacks */}
        <g transform="translate(15, -8)">
          <rect x="0" y="0" width="2.5" height="15" fill="#6b7280" />
          <ellipse cx="1.25" cy="0" rx="2" ry="1" fill="#9ca3af" />
        </g>
        
        {visuals.platformSize !== 'small' && (
          <g transform="translate(-17, -5)">
            <rect x="0" y="0" width="2" height="12" fill="#6b7280" />
            <ellipse cx="1" cy="0" rx="1.5" ry="0.8" fill="#9ca3af" />
          </g>
        )}

        {/* Animated smoke */}
        {visuals.isActive && visuals.emissions > 0 && (
          <g opacity="0.7">
            <circle cx="16.25" cy="-10" r="1.5" fill="#ef4444">
              <animate attributeName="cy" values="-10;-18;-10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
              <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
            </circle>
            {visuals.platformSize !== 'small' && (
              <circle cx="-16" cy="-7" r="1" fill="#f87171">
                <animate attributeName="cy" values="-7;-14;-7" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        )}

        {/* Status indicators */}
        {visuals.production > 0 && (
          <g transform="translate(0, -35)">
            <rect x="-15" y="0" width="30" height="10" fill="rgba(0,0,0,0.9)" rx="5" />
            <rect x="-14" y="1" width="28" height="8" fill="rgba(255,255,255,0.1)" rx="4" />
            <text x="0" y="7" textAnchor="middle" fill="white" fontSize="8" fontWeight="600">
              {visuals.production.toFixed(1)}M
            </text>
          </g>
        )}

        {/* Dividend bubble */}
        {visuals.dividend > 0 && (
          <g transform="translate(25, -18)">
            <circle r="8" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
            <text x="0" y="2" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">
              +{Math.round(visuals.dividend / 1e6)}
            </text>
          </g>
        )}

        {/* Emission warning */}
        {visuals.isActive && visuals.intensity > 20 && (
          <g transform="translate(-25, -18)">
            <circle r="8" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
            <text x="0" y="2" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">
              -{Math.round(visuals.intensity)}
            </text>
          </g>
        )}

        {/* Selection ring */}
        {visuals.isSelected && (
          <circle
            cx="0" cy="0" r="35"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeDasharray="10,5"
            opacity="0.9"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 0 0;360 0 0"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Field name */}
        <text
          x="0" y="40"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="700"
          stroke="#000000"
          strokeWidth="0.5"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
          {field.name.length > 8 ? field.name.substring(0, 8) + '...' : field.name}
        </text>
      </g>
    );
  };

  return (
    <div className="game-map-container">

      {/* Main 3D Map */}
      <div className="game-map-3d">
        <svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
          <defs>
            <radialGradient id="oceanGradient3D" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </radialGradient>
            
            <pattern id="waterWaves3D" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 20 Q20 15 40 20 T80 20" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
              <path d="M0 25 Q30 20 60 25 T80 25" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          
          {/* Ocean background */}
          <rect width="100%" height="100%" fill="url(#oceanGradient3D)" />
          <rect width="100%" height="100%" fill="url(#waterWaves3D)" opacity="0.6" />
          
          {/* Animated waves */}
          <g opacity="0.2">
            {Array.from({ length: 5 }).map((_, i) => (
              <path
                key={i}
                d={`M 0 ${150 + i * 100} Q ${mapWidth / 3} ${140 + i * 100} ${mapWidth * 2/3} ${150 + i * 100} T ${mapWidth} ${150 + i * 100}`}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                fill="none"
              >
                <animate
                  attributeName="d"
                  values={`M 0 ${150 + i * 100} Q ${mapWidth / 3} ${140 + i * 100} ${mapWidth * 2/3} ${150 + i * 100} T ${mapWidth} ${150 + i * 100};M 0 ${150 + i * 100} Q ${mapWidth / 3} ${160 + i * 100} ${mapWidth * 2/3} ${150 + i * 100} T ${mapWidth} ${150 + i * 100};M 0 ${150 + i * 100} Q ${mapWidth / 3} ${140 + i * 100} ${mapWidth * 2/3} ${150 + i * 100} T ${mapWidth} ${150 + i * 100}`}
                  dur={`${3 + i * 0.5}s`}
                  repeatCount="indefinite"
                />
              </path>
            ))}
          </g>
          
          {/* Oil platforms */}
          {oilFields.map((field, index) => renderPlatform(field, index))}
        </svg>
      </div>

      {/* Bottom Timeline */}
      <div className="game-timeline">
        <div className="timeline-track">
          <div className="timeline-progress" style={{ width: `${((currentYear - 2024) / (2050 - 2024)) * 100}%` }}></div>
          <div className="timeline-marker" style={{ left: `${((currentYear - 2024) / (2050 - 2024)) * 100}%` }}>
            <div className="year-bubble">{currentYear}</div>
          </div>
        </div>
        <div className="timeline-labels">
          <span>2024</span>
          <span>2050</span>
        </div>
      </div>
    </div>
  );
}; 