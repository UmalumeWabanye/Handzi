import React, { createContext, useContext } from 'react';
import { accents, Side } from './theme';

const SideContext = createContext<Side>('client');

export const SideProvider = ({ side, children }: { side: Side; children: React.ReactNode }) => (
  <SideContext.Provider value={side}>{children}</SideContext.Provider>
);

export const useSide = () => useContext(SideContext);
export const useAccent = () => accents[useContext(SideContext)];
