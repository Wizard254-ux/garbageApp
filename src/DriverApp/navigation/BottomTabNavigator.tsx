import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../shared/context/ThemeContext';

// Import screens
import { ModernDashboard } from '../screens/ModernDashboard/ModernDashboard';
import { PickupsScreen } from '../screens/PickupsScreen/PickupsScreen';
import { ProfileScreen } from '../screens/ProfileScreen/ProfileScreen';
import { BagTransferScreen } from '../screens/BagTransferScreen/BagTransferScreen';
import { TodayHistoryScreen } from '../screens/TodayHistoryScreen/TodayHistoryScreen';
import { WeekHistoryScreen } from '../screens/WeekHistoryScreen/WeekHistoryScreen';
import { ClientRegistrationScreen } from '../screens/ClientRegistrationScreen/ClientRegistrationScreen';
import { RouteSelectionScreen } from '../screens/RouteSelectionScreen/RouteSelectionScreen';

const Tab = createBottomTabNavigator();

// Global navigation state
let globalNavigationState = {
  showClientRegistration: false,
  showRouteSelection: false,
  setShowClientRegistration: (show: boolean) => {},
  setShowRouteSelection: (show: boolean) => {},
};

export const navigateToScreen = (screenName: string) => {
  if (screenName === 'ClientRegistration') {
    globalNavigationState.setShowClientRegistration(true);
  } else if (screenName === 'RouteSelection') {
    globalNavigationState.setShowRouteSelection(true);
  }
};

const DashboardWrapper = () => {
  const handleRegisterClient = () => {
    globalNavigationState.setShowClientRegistration(true);
  };

  const handleSelectRoute = () => {
    console.log('Opening route selection modal');
    globalNavigationState.setShowRouteSelection(true);
  };

  return (
    <ModernDashboard 
      onRegisterClient={handleRegisterClient}
      onSelectRoute={handleSelectRoute}
    />
  );
};

export const BottomTabNavigator: React.FC = () => {
  const { colors } = useTheme();
  const [showClientRegistration, setShowClientRegistration] = useState(false);
  const [showRouteSelection, setShowRouteSelection] = useState(false);

  // Update global navigation state
  globalNavigationState.setShowClientRegistration = setShowClientRegistration;
  globalNavigationState.setShowRouteSelection = setShowRouteSelection;

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;

            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Today':
                iconName = focused ? 'today' : 'today-outline';
                break;
              case 'Week':
                iconName = focused ? 'calendar' : 'calendar-outline';
                break;
              case 'Bags':
                iconName = focused ? 'bag' : 'bag-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'home-outline';
            }

            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            paddingHorizontal: 20,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginBottom: 2,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={DashboardWrapper}
          options={{ title: 'Home' }}
        />
        <Tab.Screen 
          name="Today" 
          component={TodayHistoryScreen}
          options={{ title: 'Today' }}
        />
        <Tab.Screen 
          name="Week" 
          component={WeekHistoryScreen}
          options={{ title: 'Week' }}
        />
        <Tab.Screen 
          name="Bags" 
          component={BagTransferScreen}
          options={{ title: 'Bags' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>

      <Modal
        visible={showClientRegistration}
        animationType="none"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowClientRegistration(false)}
      >
        <ClientRegistrationScreen onClose={() => setShowClientRegistration(false)} />
      </Modal>

      {showRouteSelection && (
        <Modal
          visible={showRouteSelection}
          animationType="none"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowRouteSelection(false)}
        >
          <RouteSelectionScreen key="route-selection" onClose={() => setShowRouteSelection(false)} />
        </Modal>
      )}
    </>
  );
};