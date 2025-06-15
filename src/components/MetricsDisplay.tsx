import React from 'react';
import { formatNumber, generateStarDisplay } from '../utils/scoringSystem';
import { getSovereignWealthFundStatus, NORWEGIAN_BASELINES } from '../utils/norwegianMetrics';

interface MetricsDisplayProps {
  metrics: {
    year: number;
    emissions: number; // tonnes CO2/year
    energy: number; // 0-100 scale
    revenue: number; // NOK/year
    happiness: number; // 0-100 scale
    equality: number; // 0-100 scale
  };
  showCumulative?: boolean;
  cumulativeMetrics?: {
    totalCo2Saved: number;
    totalEnergySaved: number;
    totalEconomicImpact: number;
    yearsActive: number;
  };
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  metrics,
  showCumulative = false,
  cumulativeMetrics,
}) => {
  // Calculate per capita emissions for star rating
  const perCapitaEmissions = metrics.emissions / NORWEGIAN_BASELINES.environment.population;
  const globalAverage = NORWEGIAN_BASELINES.environment.globalAveragePerCapita;
  
  // Star rating based on per capita emissions relative to global average
  // 5 stars = below global average, 1 star = 20x global average or more
  const emissionStars = Math.max(1, Math.min(5, 
    Math.round(5 - Math.log(perCapitaEmissions / globalAverage) / Math.log(4)) // Logarithmic scale
  ));
  
  const energyStars = Math.max(1, Math.min(5, Math.round(metrics.energy / 20)));
  const happinessStars = Math.max(1, Math.min(5, Math.round(metrics.happiness / 20)));
  const equalityStars = Math.max(1, Math.min(5, Math.round(metrics.equality / 20)));
  const economicStars = Math.max(1, Math.min(5, Math.round(Math.log10(Math.max(1, metrics.revenue / 1000000000)))));
  
  // Get sovereign wealth fund status
  const wealthFundStatus = getSovereignWealthFundStatus(metrics.revenue, metrics.year);

  const MetricItem = ({ 
    label, 
    stars, 
    value, 
    unit, 
    tooltip, 
    color = "#4A5568",
    isPositive = true 
  }: {
    label: string;
    stars: number;
    value: number;
    unit: string;
    tooltip: string;
    color?: string;
    isPositive?: boolean;
  }) => (
    <div 
      style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #E2E8F0',
        textAlign: 'center',
        minWidth: '140px',
        cursor: 'help'
      }}
      title={tooltip}
    >
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#718096', marginBottom: '8px' }}>
          {label}
        </div>
        
        {/* Stars Display */}
        <div style={{ fontSize: '18px', lineHeight: '1', marginBottom: '8px' }}>
          {generateStarDisplay(stars)}
        </div>
        
        {/* Actual Value */}
        <div style={{ fontSize: '16px', fontWeight: 'bold', color }}>
          {isPositive ? '' : '-'}{formatNumber(Math.abs(value), unit)}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Current Year Metrics */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#4A5568' }}>
          Current Year Impact
        </h3>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <MetricItem
            label="CO₂ Emissions"
            stars={emissionStars}
            value={metrics.emissions / 1000000} // Convert to millions
            unit="M tonnes CO₂"
            tooltip={`Total CO₂ emissions including exported oil/gas (${perCapitaEmissions.toFixed(1)} tonnes per capita vs global avg ${globalAverage}). Norway has responsibility for downstream emissions.`}
            color={perCapitaEmissions > 50 ? "#E53E3E" : perCapitaEmissions > 20 ? "#DD6B20" : "#38A169"}
            isPositive={true}
          />
          
          <MetricItem
            label="Energy Security"
            stars={energyStars}
            value={metrics.energy}
            unit="/100"
            tooltip="Energy security score. Norway has high renewable electricity but oil provides economic security."
            color={metrics.energy > 80 ? "#38A169" : metrics.energy > 60 ? "#DD6B20" : "#E53E3E"}
            isPositive={true}
          />
          
          <MetricItem
            label="Happiness Index"
            stars={happinessStars}
            value={metrics.happiness}
            unit="/100"
            tooltip="Based on UN World Happiness Report factors. Norway typically ranks 5-7th globally."
            color={metrics.happiness > 70 ? "#38A169" : metrics.happiness > 50 ? "#DD6B20" : "#E53E3E"}
            isPositive={true}
          />
          
          <MetricItem
            label="Economic Equality"
            stars={equalityStars}
            value={metrics.equality}
            unit="/100"
            tooltip="Economic equality score. Norway has low inequality (Gini ~0.27) thanks to strong institutions."
            color={metrics.equality > 70 ? "#38A169" : metrics.equality > 60 ? "#DD6B20" : "#E53E3E"}
            isPositive={true}
          />
          
          <MetricItem
            label="Petroleum Revenue"
            stars={economicStars}
            value={metrics.revenue / 1000000000} // Convert to billions
            unit="B NOK"
            tooltip="Annual petroleum revenue. 78% goes to taxes, 65% of that to the Sovereign Wealth Fund."
            color={metrics.revenue < 0 ? "#E53E3E" : "#3182CE"}
            isPositive={metrics.revenue >= 0}
          />
        </div>
        
        {/* Emissions Breakdown */}
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          backgroundColor: '#FFF5F5', 
          borderRadius: '8px',
          border: '1px solid #FED7D7'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#4A5568', marginBottom: '8px' }}>
            CO₂ Emissions Breakdown
          </h4>
          <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#718096' }}>
            <div>
              <strong>Per Capita:</strong> {perCapitaEmissions.toFixed(1)} tonnes/person
            </div>
            <div>
              <strong>Global Average:</strong> {globalAverage} tonnes/person
            </div>
            <div>
              <strong>Norway Ranking:</strong> {perCapitaEmissions > 50 ? "Among world's highest" : perCapitaEmissions > 20 ? "Very high" : "High"}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#A0AEC0', marginTop: '8px' }}>
            *Includes downstream emissions from exported oil and gas
          </div>
        </div>

        {/* Sovereign Wealth Fund Status */}
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          backgroundColor: '#F7FAFC', 
          borderRadius: '8px',
          border: '1px solid #E2E8F0'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#4A5568', marginBottom: '8px' }}>
            Government Pension Fund Global (Oil Fund)
          </h4>
          <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#718096' }}>
            <div>
              <strong>Fund Value:</strong> {formatNumber(wealthFundStatus.currentValue / 1000000000000, 'T NOK')}
            </div>
            <div>
              <strong>Growth Rate:</strong> {(wealthFundStatus.growthRate * 100).toFixed(1)}%
            </div>
            <div>
              <strong>Petroleum Contribution:</strong> {formatNumber(wealthFundStatus.petroleumContribution / 1000000000, 'B NOK')}
            </div>
          </div>
        </div>
      </div>

      {/* Cumulative Metrics */}
      {showCumulative && cumulativeMetrics && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#4A5568' }}>
            Cumulative Impact ({cumulativeMetrics.yearsActive} years)
          </h3>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <MetricItem
              label="Total CO₂ Saved"
              stars={Math.min(5, Math.floor(cumulativeMetrics.totalCo2Saved / 20000000) + 1)}
              value={cumulativeMetrics.totalCo2Saved}
              unit="tonnes CO₂"
              tooltip="Total CO₂ emissions avoided compared to business-as-usual scenario."
              color="#38A169"
              isPositive={true}
            />
            
            <MetricItem
              label="Total Energy Saved"
              stars={Math.min(5, Math.floor(cumulativeMetrics.totalEnergySaved / 100) + 1)}
              value={cumulativeMetrics.totalEnergySaved}
              unit="TWh"
              tooltip="Total electricity saved for other uses instead of offshore oil production."
              color="#38A169"
              isPositive={true}
            />
            
            <MetricItem
              label="Economic Trade-off"
              stars={Math.min(5, Math.floor(Math.abs(cumulativeMetrics.totalEconomicImpact) / 100000000000) + 1)}
              value={cumulativeMetrics.totalEconomicImpact}
              unit="NOK"
              tooltip="Total economic impact of phase-out decisions. Shows the cost of climate action."
              color={cumulativeMetrics.totalEconomicImpact < 0 ? "#E53E3E" : "#3182CE"}
              isPositive={cumulativeMetrics.totalEconomicImpact >= 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 