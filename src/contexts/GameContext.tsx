import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Metrics, OilField, InvestmentOption, ParisAgreementTarget } from '../types';
import { 
  calculateOilPrice, 
  calculateFieldDividend, 
  calculateTotalPetroleumRevenue,
  calculateTotalEmissions,
  calculateInvestmentImpact 
} from '../utils/dataProcessing';
import { 
  calculateNorwegianMetrics
} from '../utils/norwegianMetrics';
import { 
  updateFieldsWithProjections 
} from '../utils/productionModeling';

// Game State Interface
interface GameState {
  currentYear: number;
  oilPrice: number;
  phasedOutFields: Set<string>;
  activeInvestments: { investment: InvestmentOption; startYear: number }[];
  fieldDividends: Record<string, number>;
  metrics: Metrics;
  selectedField: OilField | null;
  oilFields: OilField[];
  investmentOptions: InvestmentOption[];
  parisAgreementTargets: ParisAgreementTarget[];
  // New state for enhanced gameplay
  cumulativeMetrics: {
    totalCo2Saved: number;
    totalEnergySaved: number;
    totalEconomicImpact: number;
    yearsActive: number;
  };
  fieldsToPhaseOutThisYear: Set<string>;
  gameScore: number;
}

// Action Types
type GameAction =
  | { type: 'ADVANCE_YEAR' }
  | { type: 'SET_YEAR'; payload: number }
  | { type: 'PHASE_OUT_FIELD'; payload: string }
  | { type: 'START_INVESTMENT'; payload: InvestmentOption }
  | { type: 'SELECT_FIELD'; payload: OilField | null }
  | { type: 'UPDATE_OIL_PRICE'; payload: number }
  | { type: 'UPDATE_METRICS'; payload: Metrics }
  | { type: 'UPDATE_FIELD_DIVIDENDS'; payload: Record<string, number> }
  | { type: 'UPDATE_OIL_FIELDS'; payload: OilField[] }
  | { type: 'INITIALIZE_GAME'; payload: { 
      oilFields: OilField[]; 
      investmentOptions: InvestmentOption[]; 
      parisAgreementTargets: ParisAgreementTarget[];
    }}
  // New actions for enhanced gameplay
  | { type: 'TOGGLE_FIELD_FOR_PHASE_OUT'; payload: string }
  | { type: 'CLEAR_FIELDS_TO_PHASE_OUT' }
  | { type: 'PHASE_OUT_SELECTED_FIELDS' }
  | { type: 'UPDATE_CUMULATIVE_METRICS'; payload: {
      totalCo2Saved: number;
      totalEnergySaved: number;
      totalEconomicImpact: number;
      yearsActive: number;
    }}
  | { type: 'UPDATE_GAME_SCORE'; payload: number };

// Initial State
const initialState: GameState = {
  currentYear: 2024,
  oilPrice: 80,
  phasedOutFields: new Set(),
  activeInvestments: [],
  fieldDividends: {},
  metrics: {
    year: 2024,
    emissions: 0,
    energy: 100,
    happiness: 100,
    equality: 100,
    revenue: 0,
  },
  selectedField: null,
  oilFields: [],
  investmentOptions: [],
  parisAgreementTargets: [],
  // New initial state
  cumulativeMetrics: {
    totalCo2Saved: 0,
    totalEnergySaved: 0,
    totalEconomicImpact: 0,
    yearsActive: 0,
  },
  fieldsToPhaseOutThisYear: new Set(),
  gameScore: 0,
};

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADVANCE_YEAR':
      const nextYear = state.currentYear + 1;
      
      // Apply production modeling for the new year
      const fieldsForNextYear = updateFieldsWithProjections(
        state.oilFields,
        nextYear,
        state.phasedOutFields
      );
      
      return {
        ...state,
        currentYear: nextYear,
        oilFields: fieldsForNextYear,
      };

    case 'SET_YEAR':
      return {
        ...state,
        currentYear: action.payload,
      };

    case 'PHASE_OUT_FIELD':
      return {
        ...state,
        phasedOutFields: new Set([...state.phasedOutFields, action.payload]),
      };

    case 'START_INVESTMENT':
      return {
        ...state,
        activeInvestments: [
          ...state.activeInvestments,
          { investment: action.payload, startYear: state.currentYear }
        ],
      };

    case 'SELECT_FIELD':
      return {
        ...state,
        selectedField: action.payload,
      };

    case 'UPDATE_OIL_PRICE':
      return {
        ...state,
        oilPrice: action.payload,
      };

    case 'UPDATE_METRICS':
      return {
        ...state,
        metrics: action.payload,
      };

    case 'UPDATE_FIELD_DIVIDENDS':
      return {
        ...state,
        fieldDividends: action.payload,
      };

    case 'UPDATE_OIL_FIELDS':
      // Apply production modeling to update fields with realistic decline curves
      const fieldsWithProjections = updateFieldsWithProjections(
        action.payload,
        state.currentYear,
        state.phasedOutFields
      );
      
      return {
        ...state,
        oilFields: fieldsWithProjections,
      };

    case 'INITIALIZE_GAME':
      return {
        ...state,
        oilFields: action.payload.oilFields,
        investmentOptions: action.payload.investmentOptions,
        parisAgreementTargets: action.payload.parisAgreementTargets,
      };

    case 'TOGGLE_FIELD_FOR_PHASE_OUT':
      const newFieldsToPhaseOut = new Set(state.fieldsToPhaseOutThisYear);
      if (newFieldsToPhaseOut.has(action.payload)) {
        newFieldsToPhaseOut.delete(action.payload);
      } else {
        newFieldsToPhaseOut.add(action.payload);
      }
      return {
        ...state,
        fieldsToPhaseOutThisYear: newFieldsToPhaseOut,
      };

    case 'CLEAR_FIELDS_TO_PHASE_OUT':
      return {
        ...state,
        fieldsToPhaseOutThisYear: new Set(),
      };

    case 'PHASE_OUT_SELECTED_FIELDS':
      const newPhasedOutFields = new Set([...state.phasedOutFields, ...state.fieldsToPhaseOutThisYear]);
      
      // Apply production modeling with updated phased-out fields
      const updatedFieldsAfterPhaseOut = updateFieldsWithProjections(
        state.oilFields,
        state.currentYear,
        newPhasedOutFields
      );
      
      return {
        ...state,
        phasedOutFields: newPhasedOutFields,
        fieldsToPhaseOutThisYear: new Set(),
        oilFields: updatedFieldsAfterPhaseOut,
      };

    case 'UPDATE_CUMULATIVE_METRICS':
      return {
        ...state,
        cumulativeMetrics: action.payload,
      };

    case 'UPDATE_GAME_SCORE':
      return {
        ...state,
        gameScore: action.payload,
      };

    default:
      return state;
  }
}

// Context
interface GameContextType {
  state: GameState;
  actions: {
    advanceYear: () => void;
    setYear: (year: number) => void;
    phaseOutField: (fieldId: string) => void;
    startInvestment: (investment: InvestmentOption) => void;
    selectField: (field: OilField | null) => void;
    updateOilFields: (oilFields: OilField[]) => void;
    initializeGame: (data: {
      oilFields: OilField[];
      investmentOptions: InvestmentOption[];
      parisAgreementTargets: ParisAgreementTarget[];
    }) => void;
    // New actions for enhanced gameplay
    toggleFieldForPhaseOut: (fieldId: string) => void;
    clearFieldsToPhaseOut: () => void;
    phaseOutSelectedFields: () => void;
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider Component
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Calculate and update metrics whenever relevant state changes
  useEffect(() => {
    if (state.oilFields.length === 0) return; // Wait for initialization

    const calculateCurrentMetrics = (): Metrics => {
      const activeFields = state.oilFields.filter(field => !state.phasedOutFields.has(field.id));
      
      // Calculate total emissions from active fields
      const totalEmissions = calculateTotalEmissions(activeFields, state.currentYear, state.phasedOutFields);
      
      // Calculate total petroleum revenue
      const totalRevenue = calculateTotalPetroleumRevenue(activeFields, state.currentYear, state.oilPrice);
      
      // Calculate field-specific dividends
      const dividends: Record<string, number> = {};
      let totalDividends = 0;
      activeFields.forEach(field => {
        const dividend = calculateFieldDividend(field, state.currentYear, state.oilPrice);
        dividends[field.id] = dividend;
        totalDividends += dividend;
      });
      
      // Update field dividends
      dispatch({ type: 'UPDATE_FIELD_DIVIDENDS', payload: dividends });
      
      // Calculate Norwegian-based metrics
      const norwegianMetrics = calculateNorwegianMetrics(
        state.oilFields,
        state.currentYear,
        state.phasedOutFields,
        totalRevenue,
        totalEmissions,
        state.metrics // Previous metrics for change calculation
      );
      
      // Apply investment impacts
      const investmentImpact = calculateInvestmentImpact(state.activeInvestments, state.currentYear, norwegianMetrics);
      
      // Combine Norwegian metrics with investment impacts
      const finalMetrics: Metrics = {
        year: state.currentYear,
        emissions: Math.max(0, norwegianMetrics.emissions + (investmentImpact.emissions || 0)),
        energy: Math.max(0, Math.min(100, norwegianMetrics.energy + (investmentImpact.energy || 0))),
        happiness: Math.max(0, Math.min(100, norwegianMetrics.happiness + (investmentImpact.happiness || 0))),
        equality: Math.max(0, Math.min(100, norwegianMetrics.equality + (investmentImpact.equality || 0))),
        revenue: norwegianMetrics.revenue + (investmentImpact.revenue || 0) + totalDividends,
      };
      
      return finalMetrics;
    };

    const metrics = calculateCurrentMetrics();
    dispatch({ type: 'UPDATE_METRICS', payload: metrics });
  }, [state.currentYear, state.oilPrice, state.phasedOutFields, state.activeInvestments, state.oilFields]);

  // Update oil price when year changes
  useEffect(() => {
    const newPrice = calculateOilPrice(state.currentYear, 2024);
    dispatch({ type: 'UPDATE_OIL_PRICE', payload: newPrice });
  }, [state.currentYear]);

  // Actions
  const actions = {
    advanceYear: () => dispatch({ type: 'ADVANCE_YEAR' }),
    setYear: (year: number) => dispatch({ type: 'SET_YEAR', payload: year }),
    phaseOutField: (fieldId: string) => dispatch({ type: 'PHASE_OUT_FIELD', payload: fieldId }),
    startInvestment: (investment: InvestmentOption) => dispatch({ type: 'START_INVESTMENT', payload: investment }),
    selectField: (field: OilField | null) => dispatch({ type: 'SELECT_FIELD', payload: field }),
    updateOilFields: (oilFields: OilField[]) => dispatch({ type: 'UPDATE_OIL_FIELDS', payload: oilFields }),
    initializeGame: (data: {
      oilFields: OilField[];
      investmentOptions: InvestmentOption[];
      parisAgreementTargets: ParisAgreementTarget[];
    }) => dispatch({ type: 'INITIALIZE_GAME', payload: data }),
    // New actions for enhanced gameplay
    toggleFieldForPhaseOut: (fieldId: string) => dispatch({ type: 'TOGGLE_FIELD_FOR_PHASE_OUT', payload: fieldId }),
    clearFieldsToPhaseOut: () => dispatch({ type: 'CLEAR_FIELDS_TO_PHASE_OUT' }),
    phaseOutSelectedFields: () => dispatch({ type: 'PHASE_OUT_SELECTED_FIELDS' }),
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
};

// Hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}; 