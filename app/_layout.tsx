import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect } from 'react';
import 'react-native-reanimated';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import { ReportsProvider } from "../context/ReportsContext";

async function prepareSplash() {
  try {
    await SplashScreen.preventAutoHideAsync();
  } catch (e) {
    console.warn("Splash screen already handled");
  }
}

prepareSplash();

function AppContent() {
  const { isLoggedIn, authLoading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      SplashScreen.hideAsync().catch(() => {
      });
    }
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (!isLoggedIn && inTabsGroup) {
      router.replace('/loginscreen');
    } else if (isLoggedIn && segments[0] === 'loginscreen') {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, authLoading, segments]);

  if (authLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="loginscreen" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      <Stack.Screen 
        name="report" 
        options={{ 
          headerShown: false, 
          presentation: 'card'
        }} 
      />

      <Stack.Screen 
        name="createReport" 
        options={{ 
          headerShown: false, 
          presentation: 'modal',
          animation: 'slide_from_bottom' 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ReportsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppContent />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </ReportsProvider>
    </AuthProvider>
  );
}