import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from '@/components/schoolsafe/glass';
import { Typography } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useAlerts } from '@/context/alerts-context';

type HeaderProps = { compact?: boolean };

export default function Header({ compact: _compact = true }: HeaderProps) {
  const { session, signOut } = useAuth();
  const { telemetryStatus } = useAlerts();
  const telemetryColor = telemetryStatus === 'online' ? '#A8DAB5' : telemetryStatus === 'connecting' ? '#EAB308' : '#777';
  const telemetryLabel = telemetryStatus === 'online' ? 'ONLINE' : telemetryStatus === 'connecting' ? 'CONECTANDO' : telemetryStatus === 'unconfigured' ? 'SEM API' : 'OFFLINE';
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <Glass style={styles.header} borderRadius={22} intensity={52}>
        <View style={styles.row}>
          <Pressable onPress={() => router.replace('/' as any)} style={styles.brand} accessibilityRole="button" accessibilityLabel="Voltar à central">
            <View style={styles.logoBadge}>
              <Image source={require('@/assets/images/seguranca-escolar.png')} style={styles.logoImage} resizeMode="contain" accessibilityLabel="Emblema Segurança Escolar" />
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Segurança Escolar</Text>
              <Text style={styles.subtitle}>MONITORAMENTO ESCOLAR</Text>
            </View>
          </Pressable>
          <View style={styles.right}>
            <View style={styles.onlinePill}><View style={[styles.dot, { backgroundColor: telemetryColor }]} /><Text style={[styles.onlineText, { color: telemetryColor }]}>{telemetryLabel}</Text></View>
            {session && <Pressable onPress={() => { void signOut(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="Sair da conta" style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={18} color="#C1C7D0" />
            </Pressable>}
          </View>
        </View>
      </Glass>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: 'transparent' },
  header: { marginHorizontal: 12, marginTop: 10, paddingHorizontal: 16, paddingVertical: 16, minHeight: 76, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, minHeight: 52 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  logoBadge: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: 50, height: 50, borderRadius: 15 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, fontWeight: '700', fontFamily: Typography.bold, color: '#E3E2E9', letterSpacing: -0.3 },
  subtitle: { fontSize: 8, color: '#C1C7D0', marginTop: 3, letterSpacing: 1.2, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(160,160,160,0.10)', paddingHorizontal: 11, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C1C7D0' },
  onlineText: { color: '#C1C7D0', fontWeight: '700', fontFamily: Typography.semibold, fontSize: 9, letterSpacing: 1 },
  logoutBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
});
