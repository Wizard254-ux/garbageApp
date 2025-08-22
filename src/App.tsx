import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import { Loading } from './shared/components';
import { Login } from './shared/screens/Login/Login';
import DriverApp from './DriverApp';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderAppByRole = () => {
    switch (user?.role) {
      case 'driver':
        return <DriverApp />;
      case 'client':
        return <DriverApp />; // Clients use simplified driver interface
      default:
        return <Login />;
    }
  };

  return (
    <NavigationContainer>
      {renderAppByRole()}
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;