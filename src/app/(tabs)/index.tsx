import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useIsFocused, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '@/components/schoolsafe/header';
import MonitorCard from '@/components/schoolsafe/monitor-card';
import SchoolMap from '@/components/schoolsafe/school-map';
import { useAlerts, type Sensor } from '@/context/alerts-context';
import { Typography } from '@/constants/theme';
import { useSensorSheet, type SensorOriginRect } from '@/components/schoolsafe/sensor-sheet';

export default function HomeScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  const { sensors, telemetryStatus, telemetryError, lastSyncAt, refreshTelemetry } = useAlerts();
  const { openSensor: openSheet } = useSensorSheet();
  const openSensor = useCallback((sensor: Sensor, originRect?: SensorOriginRect) => {
    const screen = Dimensions.get('window');
    openSheet(sensor.id, originRect ?? { x: screen.width / 2 - 28, y: screen.height / 2 - 28, width: 56, height: 56 });
  }, [openSheet]);
  return <View style={styles.screen}>
    <Header />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>PAINEL DE CONTROLE</Text>
        <Text style={styles.title}>Visão geral</Text>
        <Text style={styles.subtitle}>Acompanhe os sensores e a localização dos dispositivos no térreo.</Text>
      </View>
      <View style={styles.photoHero} accessibilityLabel="Fotografia real de um corredor escolar">
        <Image source={{ uri: 'https://images.unsplash.com/photo-1762888568397-17827294d721?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1400' }} contentFit="cover" transition={250} style={StyleSheet.absoluteFill} />
        <View style={styles.photoShade} />
        <View style={styles.photoCopy}>
          <Text style={styles.photoEyebrow}>AMBIENTE ESCOLAR</Text>
          <Text style={styles.photoTitle}>Proteção em cada espaço</Text>
          <Text style={styles.photoSubtitle}>Acompanhe a segurança da escola em tempo real.</Text>
        </View>
      </View>
      <MonitorCard sensors={sensors} onSelect={openSensor} telemetryStatus={telemetryStatus} telemetryError={telemetryError} lastSyncAt={lastSyncAt} onRefresh={() => void refreshTelemetry()} />
      <SchoolMap sensors={sensors} focused={focused} />
      <Pressable onPress={() => router.push('/registro')} style={styles.history} accessibilityRole="button">
        <View style={styles.historyIcon}><Ionicons name="time-outline" size={19} color="#C1C7D0" /></View>
        <View style={{ flex: 1 }}><Text style={styles.historyTitle}>Registro de eventos</Text><Text style={styles.historySub}>Consulte o histórico de ativações</Text></View>
        <Ionicons name="chevron-forward-outline" size={18} color="#777" />
      </Pressable>
      <Text style={styles.footer}>SCHOOLSAFE · SEGURANÇA ESCOLAR</Text>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 112, gap: 16 },
  intro: { width: '100%', maxWidth: 520, gap: 5 },
  eyebrow: { color: '#C1C7D0', fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  title: { color: '#E3E2E9', fontSize: 28, fontWeight: '700', fontFamily: Typography.bold, letterSpacing: -0.8 },
  subtitle: { color: '#C1C7D0', fontSize: 13, fontFamily: Typography.regular, lineHeight: 19, maxWidth: 420 },
  sectionHead: { width: '100%', maxWidth: 520, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { color: '#E3E2E9', fontSize: 17, fontWeight: '700', fontFamily: Typography.semibold },
  systems: { width: '100%', maxWidth: 520, gap: 10 },
  systemCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.045)', minHeight: 82 },
  systemIcon: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  systemText: { flex: 1, gap: 3 },
  systemTitle: { color: '#E3E2E9', fontSize: 14, fontWeight: '700', fontFamily: Typography.semibold },
  systemDescription: { color: '#C1C7D0', fontSize: 11, fontFamily: Typography.regular },
  systemCount: { color: '#777', fontSize: 10, marginTop: 2 },
  history: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.035)', padding: 13 },
  historyIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  historyTitle: { color: '#E3E2E9', fontSize: 13, fontWeight: '700' },
  historySub: { color: '#888', fontSize: 11, marginTop: 3 },
  photoHero: { width: '100%', maxWidth: 520, height: 158, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end', borderWidth: 1, borderColor: '#343941' },
  photoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,19,24,0.56)' },
  photoCopy: { paddingHorizontal: 18, paddingVertical: 16, gap: 5 },
  photoEyebrow: { color: '#DCE2F0', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  photoTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  photoSubtitle: { color: '#E3E2E9', fontSize: 11, lineHeight: 16 },
  footer: { color: '#8E9199', fontSize: 8, letterSpacing: 1.6, marginTop: 8 },
});
