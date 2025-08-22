import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, StatusBar, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { Button, Input } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import { apiService } from '../../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { reloadAuth } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('Starting login process...');
    setLoading(true);
    try {
      console.log('Calling API login with:', { email });
      const response = await apiService.login({ email, password });
      console.log('API login successful:', response.data);

      const { token, user: userData } = response.data;
      console.log('Storing token and user data...');

      await Promise.all([
        AsyncStorage.setItem('accessToken', token),
        AsyncStorage.setItem('user', JSON.stringify(userData)),
      ]);

      console.log('Token and user data stored successfully');
      console.log('Triggering AuthContext to reload...');

      // Trigger AuthContext to reload from storage
      await reloadAuth();

    } catch (error: any) {
      console.error('Login failed:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Login Failed', error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      {/* Background decorative elements */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>GL</Text>
            </View>
            <View style={styles.logoGlow} />
          </View>

          <Text style={styles.title}>GreenLife</Text>
          <Text style={styles.subtitle}>Garbage Collection System</Text>

          {/*<View style={styles.welcomeContainer}>*/}
          {/*  <Text style={styles.welcomeText}>Welcome Back!</Text>*/}
          {/*  <Text style={styles.welcomeSubtext}>Sign in to continue your eco-journey</Text>*/}
          {/*</View>*/}
        </View>

        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                showPasswordToggle
                style={styles.input}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Secure Login</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our eco-friendly practices
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#2E7D32',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#4CAF50',
    top: height * 0.3,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#66BB6A',
    bottom: 100,
    right: -50,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: height * 0.08,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    opacity: 0.2,
    top: -10,
    left: -10,
    zIndex: -1,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#4CAF50',
    textAlign: 'center',
    // marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#66BB6A',
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.8,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 4,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8F5E8',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#81C784',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#81C784',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});