import React, { createContext, useState, useContext } from 'react';

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
}

export const lightTheme: ThemeColors = {
  primary: '#8B5CF6',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  shadow: '#00000015',
};

export const darkTheme: ThemeColors = {
  primary: '#A78BFA',
  secondary: '#F472B6',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  border: '#334155',
  shadow: '#00000040',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  tokens: {
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    radius: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    shadow: {
      card: object;
      header: object;
    };
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const colors = isDark ? darkTheme : lightTheme;

  const tokens = {
    spacing: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24 },
    radius: { sm: 8, md: 12, lg: 16, xl: 20 },
    shadow: {
      card: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
      },
      header: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 3,
      },
    },
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
