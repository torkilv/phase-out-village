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
  | { type: 'INITIALIZE_GAME'; payload: { 
      oilFields: OilField[]; 
      investmentOptions: InvestmentOption[]; 
      parisAgreementTargets: ParisAgreementTarget[];
    }};

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
};

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADVANCE_YEAR':
      return {
        ...state,
        currentYear: state.currentYear + 1,
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

    case 'INITIALIZE_GAME':
      return {
        ...state,
        oilFields: action.payload.oilFields,
        investmentOptions: action.payload.investmentOptions,
        parisAgreementTargets: action.payload.parisAgreementTargets,
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
    initializeGame: (data: {
      oilFields: OilField[];
      investmentOptions: InvestmentOption[];
      parisAgreementTargets: ParisAgreementTarget[];
    }) => void;
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
      
      // Base metrics
      const baseMetrics: Metrics = {
        year: state.currentYear,
        emissions: totalEmissions,
        energy: 100, // Base energy security
        happiness: 100, // Base happiness
        equality: 100, // Base equality
        revenue: totalRevenue,
      };
      
      // Apply investment impacts
      const investmentImpact = calculateInvestmentImpact(state.activeInvestments, state.currentYear, baseMetrics);
      
      // Combine base metrics with investment impacts
      const finalMetrics: Metrics = {
        year: state.currentYear,
        emissions: Math.max(0, baseMetrics.emissions + (investmentImpact.emissions || 0)),
        energy: Math.max(0, Math.min(200, baseMetrics.energy + (investmentImpact.energy || 0))),
        happiness: Math.max(0, Math.min(200, baseMetrics.happiness + (investmentImpact.happiness || 0))),
        equality: Math.max(0, Math.min(200, baseMetrics.equality + (investmentImpact.equality || 0))),
        revenue: baseMetrics.revenue + (investmentImpact.revenue || 0) + totalDividends,
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
    initializeGame: (data: {
      oilFields: OilField[];
      investmentOptions: InvestmentOption[];
      parisAgreementTargets: ParisAgreementTarget[];
    }) => dispatch({ type: 'INITIALIZE_GAME', payload: data }),
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