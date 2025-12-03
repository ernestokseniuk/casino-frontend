import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ADHDContextType {
  adhdMode: boolean;
  setAdhdMode: (enabled: boolean) => void;
}

const ADHDContext = createContext<ADHDContextType>({
  adhdMode: false,
  setAdhdMode: () => {},
});

export function ADHDProvider({ children }: { children: ReactNode }) {
  const [adhdMode, setAdhdMode] = useState(() => {
    const saved = localStorage.getItem('casino_adhd_mode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('casino_adhd_mode', adhdMode.toString());
  }, [adhdMode]);

  return (
    <ADHDContext.Provider value={{ adhdMode, setAdhdMode }}>
      {children}
    </ADHDContext.Provider>
  );
}

export function useADHD() {
  return useContext(ADHDContext);
}

export default ADHDContext;
