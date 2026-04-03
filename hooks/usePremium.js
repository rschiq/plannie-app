import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PremiumContext = createContext(null);

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremiumState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@plannie_is_premium')
      .then(val => { if (val === 'true') setIsPremiumState(true); });
  }, []);

  const setIsPremium = async (val) => {
    setIsPremiumState(val);
    await AsyncStorage.setItem('@plannie_is_premium', val ? 'true' : 'false');
  };

  return (
    <PremiumContext.Provider value={{ isPremium, setIsPremium }}>
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be inside PremiumProvider');
  return ctx;
};