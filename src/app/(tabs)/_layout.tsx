import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/auth-context';
import Dock from '@/components/schoolsafe/dock';
import { SensorSheetProvider } from '@/components/schoolsafe/sensor-sheet';

export default function TabLayout() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login' as any);
    }
  }, [isAuthenticated, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111318' }}>
        <ActivityIndicator color="#C1C7D0" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111318', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C1C7D0" />
      </View>
    );
  }

  return (
    <SensorSheetProvider>
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="smoke" />
          <Stack.Screen name="motion" />
          <Stack.Screen name="registro" />
        </Stack>
        <Dock />
      </View>
    </SensorSheetProvider>
  );
}
