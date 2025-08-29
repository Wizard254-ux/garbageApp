import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  colors: typeof lightColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
}

const typography = {
  h1: { fontSize: 24, fontWeight: 'bold' as const },
  h2: { fontSize: 20, fontWeight: 'bold' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  caption: { fontSize: 14, fontWeight: 'normal' as const },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
};

const lightColors = {
  primary: '#10B981',
  secondary: '#3B82F6', 
  warning: '#F59E0B',
  error: '#EF4444',
  success: '#10B981',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  headerBackground: '#FFFFFF',
  headerText: '#10B981',
  cardBackground: '#FFFFFF',
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#10B981',
  tabBarInactive: '#6B7280',
};

const darkColors = {
  primary: '#10B981',
  secondary: '#3B82F6',
  warning: '#F59E0B', 
  error: '#EF4444',
  success: '#10B981',
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  headerBackground: '#0F172A',
  headerText: '#FFFFFF',
  cardBackground: '#1F2937',
  tabBarBackground: '#1F2937',
  tabBarActive: '#10B981',
  tabBarInactive: '#9CA3AF',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    try {
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  React.useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
          setMode(savedMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };
    loadTheme();
  }, []);

  const colors = mode === 'light' ? lightColors : darkColors;

  const value: ThemeContextType = {
    mode,
    toggleTheme,
    colors,
    typography,
    spacing,
    borderRadius,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};