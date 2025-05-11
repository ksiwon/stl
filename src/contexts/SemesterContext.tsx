// src/contexts/SemesterContext.tsx
import React, { createContext, useState, ReactNode, useContext } from 'react';

export interface SemesterContextType {
  currentSemester: string;
  setCurrentSemester: (semester: string) => void;
}

// 기본값 설정
const defaultContext: SemesterContextType = {
  currentSemester: 'Spring 2025',
  setCurrentSemester: () => {}
};

export const SemesterContext = createContext<SemesterContextType>(defaultContext);

export const useSemester = () => useContext(SemesterContext);

interface SemesterProviderProps {
  children: ReactNode;
}

export const SemesterProvider: React.FC<SemesterProviderProps> = ({ children }) => {
  const [currentSemester, setCurrentSemester] = useState<string>('Spring 2025');

  return (
    <SemesterContext.Provider value={{ currentSemester, setCurrentSemester }}>
      {children}
    </SemesterContext.Provider>
  );
};