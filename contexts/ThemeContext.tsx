import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { storageService } from '@/services/storage';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceSecondary: string;
    primary: string;
    primaryText: string;
    secondaryText: string;
    border: string;
    borderLight: string;
    success: string;
    error: string;
    warning: string;
    overlay: string;
    cardBackground: string;
    buttonBackground: string;
    buttonText: string;
    tabBarBackground: string;
    tabBarActiveText: string;
    tabBarInactiveText: string;
  };
  isDark: boolean;
}

const lightTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceSecondary: '#F5F5F5',
    primary: '#000000',
    primaryText: '#000000',
    secondaryText: '#666666',
    border: '#E0E0E0',
    borderLight: '#F5F5F5',
    success: '#4CAF50',
    error: '#FF3B30',
    warning: '#FF9500',
    overlay: 'rgba(0, 0, 0, 0.5)',
    cardBackground: '#FFFFFF',
    buttonBackground: '#000000',
    buttonText: '#FFFFFF',
    tabBarBackground: '#FFFFFF',
    tabBarActiveText: '#000000',
    tabBarInactiveText: '#666666',
  },
  isDark: false,
};

const darkTheme: Theme = {
  colors: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceSecondary: '#2C2C2E',
    primary: '#FFFFFF',
    primaryText: '#FFFFFF',
    secondaryText: '#8E8E93',
    border: '#38383A',
    borderLight: '#2C2C2E',
    success: '#30D158',
    error: '#FF453A',
    warning: '#FF9F0A',
    overlay: 'rgba(0, 0, 0, 0.7)',
    cardBackground: '#1C1C1E',
    buttonBackground: '#FFFFFF',
    buttonText: '#000000',
    tabBarBackground: '#1C1C1E',
    tabBarActiveText: '#FFFFFF',
    tabBarInactiveText: '#8E8E93',
  },
  isDark: true,
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await storageService.getSetting('dark_mode');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme);
      } else {
        // Use system preference as default
        const systemTheme = Appearance.getColorScheme();
        setIsDarkMode(systemTheme === 'dark');
      }
    } catch (error) {
      console.log('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (isDark: boolean) => {
    try {
      setIsDarkMode(isDark);
      await storageService.setSetting('dark_mode', isDark);
    } catch (error) {
      console.log('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};