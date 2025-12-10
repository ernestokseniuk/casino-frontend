import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface LipkoContextType {
  lipkoMode: boolean;
  setLipkoMode: (enabled: boolean) => void;
}

const LipkoContext = createContext<LipkoContextType>({
  lipkoMode: false,
  setLipkoMode: () => {},
});

export function LipkoProvider({ children }: { children: ReactNode }) {
  const [lipkoMode, setLipkoMode] = useState(() => {
    const saved = localStorage.getItem('casino_lipko_mode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('casino_lipko_mode', lipkoMode.toString());
  }, [lipkoMode]);

  return (
    <LipkoContext.Provider value={{ lipkoMode, setLipkoMode }}>
      {children}
    </LipkoContext.Provider>
  );
}

export function useLipko() {
  return useContext(LipkoContext);
}

export default LipkoContext;
