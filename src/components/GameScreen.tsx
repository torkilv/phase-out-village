import { GameControls } from './GameControls';
import { IsometricMap } from './IsometricMap';
import { DirtiestFieldsLeaderboard } from './DirtiestFieldsLeaderboard';
import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { getActiveOilFields, getInvestmentOptions, getParisAgreementTargets } from '../DataLoader';
import { generateStarDisplay } from '../utils/scoringSystem';
import './Game.css';

export const GameScreen = () => {
  const { state, actions } = useGame();

  // Load real data and initialize game on mount
  useEffect(() => {
    const oilFields = getActiveOilFields(state.currentYear);
    const investmentOptions = getInvestmentOptions();
    const parisAgreementTargets = getParisAgreementTargets();
    
    actions.initializeGame({
      oilFields,
      investmentOptions,
      parisAgreementTargets,
    });
  }, []); // Only run once on mount

  // Update oil fields when year changes (without resetting game state)
  useEffect(() => {
    if (state.oilFields.length > 0) { // Only update if already initialized
      const updatedOilFields = getActiveOilFields(state.currentYear);
      // Only update oil fields data, preserve all other game state
      actions.updateOilFields(updatedOilFields);
    }
  }, [state.currentYear]);

  // Helper function to calculate star ratings for metrics
  const getMetricStars = (metric: string, value: number): number => {
    switch (metric) {
      case 'co2':
        // Lower emissions = better (INVERSE rating)
        // Norwegian baseline: ~50M tonnes domestic, ~550M total with exports
        // 5 stars = very low emissions (0-100M tonnes)
        // 1 star = very high emissions (500M+ tonnes)
        const emissionsInMillions = value / 1000000;
        if (emissionsInMillions <= 100) return 5;      // Excellent (0-100M)
        if (emissionsInMillions <= 200) return 4;      // Good (100-200M)
        if (emissionsInMillions <= 350) return 3;      // Average (200-350M)
        if (emissionsInMillions <= 500) return 2;      // Poor (350-500M)
        return 1;                                      // Very Poor (500M+)
      case 'revenue':
        // Higher revenue = better (logarithmic scale)
        return Math.max(1, Math.min(5, Math.round(Math.log10(Math.max(1, value / 1000000000)))));
      case 'energy':
        // 0-100 scale, higher = better
        return Math.max(1, Math.min(5, Math.round(value / 20)));
      case 'happiness':
        // 0-100 scale, higher = better
        return Math.max(1, Math.min(5, Math.round(value / 20)));
      default:
        return 3;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: '#f8fafc',
      padding: '16px',
      gap: '16px'
    }}>
      {/* Header with Game Title and Core Metrics */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Left: Game Title and Year */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>
            🎮 PHASE OUT VILLAGE
          </h1>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4a5568' }}>
            Year: {state.currentYear}
          </div>
          <div style={{ fontSize: '16px', color: '#718096' }}>
            Oil: ${state.oilPrice.toFixed(2)}/barrel
          </div>
        </div>

        {/* Right: Core Metrics */}
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>CO₂ EMISSIONS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{generateStarDisplay(getMetricStars('co2', state.metrics.emissions))}</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e53e3e' }}>
                {(state.metrics.emissions / 1000000).toFixed(0)}M tonnes
              </span>
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>REVENUE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{generateStarDisplay(getMetricStars('revenue', state.metrics.revenue))}</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#3182ce' }}>
                {(state.metrics.revenue / 1000000000).toFixed(0)}B NOK
              </span>
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>ENERGY SURPLUS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{generateStarDisplay(getMetricStars('energy', state.metrics.energy))}</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#38a169' }}>
                {state.metrics.energy.toFixed(0)}/100
              </span>
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>HAPPINESS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{generateStarDisplay(getMetricStars('happiness', state.metrics.happiness))}</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#d69e2e' }}>
                {state.metrics.happiness.toFixed(0)}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div style={{ 
        display: 'flex', 
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Left Column - Map (70%) */}
        <div style={{ 
          flex: '0 0 70%',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <IsometricMap
            oilFields={state.oilFields}
            currentYear={state.currentYear}
            phasedOutFields={state.phasedOutFields}
            fieldsToPhaseOutThisYear={state.fieldsToPhaseOutThisYear}
            onToggleFieldForPhaseOut={actions.toggleFieldForPhaseOut}
          />
        </div>

        {/* Right Column - Leaderboard and Controls (30%) */}
        <div style={{ 
          flex: '0 0 30%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minHeight: 0
        }}>
          {/* Dirtiest Fields Leaderboard */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            flex: 1,
            overflow: 'auto'
          }}>
            <DirtiestFieldsLeaderboard
              oilFields={state.oilFields}
              phasedOutFields={state.phasedOutFields}
              fieldsToPhaseOutThisYear={state.fieldsToPhaseOutThisYear}
              onToggleFieldForPhaseOut={actions.toggleFieldForPhaseOut}
              currentYear={state.currentYear}
            />
          </div>

          {/* Game Controls */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            flexShrink: 0
          }}>
            <GameControls
              currentYear={state.currentYear}
              metrics={state.metrics}
              availableInvestments={state.investmentOptions}
              oilFields={state.oilFields}
              onAdvanceYear={actions.advanceYear}
              onStartInvestment={actions.startInvestment}
              onPhaseOutField={actions.phaseOutField}
              fieldsToPhaseOutThisYear={state.fieldsToPhaseOutThisYear}
              onPhaseOutSelectedFields={actions.phaseOutSelectedFields}
              onClearFieldsToPhaseOut={actions.clearFieldsToPhaseOut}
            />
          </div>
        </div>
      </div>


    </div>
  );
}; 