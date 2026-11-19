import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes</Text>
      <Text style={styles.description}>
        Consulte informações adicionais do monitoramento escolar.
      </Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Voltar para a central</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#111318',
  },
  title: {
    color: '#E3E2E9',
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    color: '#C1C7D0',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 360,
  },
  link: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#A8C7FA',
    marginTop: 8,
  },
  linkText: {
    color: '#111318',
    fontSize: 14,
    fontWeight: '700',
  },
});
