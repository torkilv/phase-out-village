import { Box, VStack, HStack, Heading, Spacer } from '@chakra-ui/react';
import { LanguageToggle } from './LanguageToggle';
import { GameControls } from './GameControls';
import { IsometricMap } from './IsometricMap';
import { FieldDetails } from './FieldDetails';
import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { getActiveOilFields, getInvestmentOptions, getParisAgreementTargets, getOilFieldStatistics } from '../DataLoader';
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

  // Update oil fields when year changes
  useEffect(() => {
    if (state.oilFields.length > 0) { // Only update if already initialized
      const updatedOilFields = getActiveOilFields(state.currentYear);
      actions.initializeGame({
        oilFields: updatedOilFields,
        investmentOptions: state.investmentOptions,
        parisAgreementTargets: state.parisAgreementTargets,
      });
    }
  }, [state.currentYear]);

  const statistics = getOilFieldStatistics();

  return (
    <Box minH="100vh" bg="gray.50">
      <HStack p={4} bg="white" shadow="sm">
        <Heading size="lg" color="teal.600">
          Phase Out Village
        </Heading>
        <Spacer />
        <LanguageToggle />
      </HStack>

      <VStack gap={6} p={6} align="stretch">
        {/* Data Statistics Display */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <Heading size="md" mb={3}>Norwegian Oil Field Data</Heading>
          <HStack gap={8}>
            <Box>
              <strong>Total Fields:</strong> {statistics.totalFields}
            </Box>
            <Box>
              <strong>Active Fields:</strong> {statistics.activeFields}
            </Box>
            <Box>
              <strong>Data Range:</strong> {statistics.yearRange.start} - {statistics.yearRange.end}
            </Box>
            <Box>
              <strong>Total Oil Production:</strong> {statistics.totalOilProduction.toFixed(1)} million barrels
            </Box>
          </HStack>
        </Box>

        {/* Oil Field Map */}
        <IsometricMap
          oilFields={state.oilFields}
          currentYear={state.currentYear}
          phasedOutFields={state.phasedOutFields}
          fieldDividends={state.fieldDividends}
          onFieldClick={actions.selectField}
          selectedField={state.selectedField}
          metrics={state.metrics}
        />

        {/* Selected Field Details */}
        {state.selectedField && (
          <FieldDetails
            field={state.selectedField}
            currentYear={state.currentYear}
            isActive={!state.phasedOutFields.has(state.selectedField.id)}
            dividend={state.fieldDividends[state.selectedField.id] || 0}
            onPhaseOut={actions.phaseOutField}
          />
        )}

        {/* Game Controls */}
        <GameControls
          currentYear={state.currentYear}
          metrics={state.metrics}
          availableInvestments={state.investmentOptions}
          oilFields={state.oilFields}
          onAdvanceYear={actions.advanceYear}
          onStartInvestment={actions.startInvestment}
          onPhaseOutField={actions.phaseOutField}
        />
      </VStack>
    </Box>
  );
}; 