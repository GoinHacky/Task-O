import { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

type StatCardProps = {
  label: string
  value: string
  color: string
  icon: ReactNode
}

export function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>{icon}</View>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.labelBox}>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 32,
    padding: 22,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  value: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '400',
    letterSpacing: -1,
  },
  labelBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
})
