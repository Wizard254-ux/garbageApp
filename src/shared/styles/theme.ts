export const theme = {
  colors: {
    primary: '#2E7D32',
    secondary: '#4CAF50',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#212529',
    textSecondary: '#6C757D',
    border: '#DEE2E6',
    muted: '#ADB5BD',
  },
  typography: {
    h1: { fontSize: 24, fontWeight: 'bold' as const },
    h2: { fontSize: 20, fontWeight: 'bold' as const },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: 'normal' as const },
    caption: { fontSize: 14, fontWeight: 'normal' as const },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
};