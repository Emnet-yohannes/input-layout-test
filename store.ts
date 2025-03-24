import { create } from 'zustand';

export interface Token {
  type: 'variable' | 'number' | 'operator';
  text: string;
  value?: number;
  id?: string;
}

interface FormulaState {
  tokens: Token[];
  addToken: (token: Token, index?: number) => void;
  removeLastToken: () => void;
  removeTokenAt: (index: number) => void;
  updateToken: (index: number, token: Token) => void;
}

export const useFormulaStore = create<FormulaState>((set) => ({
  tokens: [],
  addToken: (token, index) => set((state) => ({
    tokens: index !== undefined && index < state.tokens.length 
      ? [...state.tokens.slice(0, index), token, ...state.tokens.slice(index)]
      : [...state.tokens, token]
  })),
  removeLastToken: () => set((state) => ({ tokens: state.tokens.slice(0, -1) })),
  removeTokenAt: (index) => set((state) => ({
    tokens: state.tokens.filter((_, i) => i !== index)
  })),
  updateToken: (index, token) => set((state) => ({
    tokens: state.tokens.map((t, i) => i === index ? token : t)
  })),
}));