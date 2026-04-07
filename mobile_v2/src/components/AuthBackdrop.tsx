import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'

/** Soft “3D” ambient backdrop matching web login / signup */
export function AuthBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, styles.blobTL]} />
      <View style={[styles.blob, styles.blobBR]} />
      <LinearGradient
        colors={['rgba(91,155,240,0.12)', 'rgba(0,82,204,0.04)', 'transparent']}
        style={[styles.sphere, styles.sphereTL]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(75,143,232,0.14)', 'rgba(0,82,204,0.06)', 'transparent']}
        style={[styles.sphere, styles.sphereBR]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobTL: {
    top: -120,
    left: -100,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(0,82,204,0.08)',
  },
  blobBR: {
    bottom: -100,
    right: -80,
    width: 340,
    height: 340,
    backgroundColor: 'rgba(0,82,204,0.07)',
  },
  sphere: {
    position: 'absolute',
    borderRadius: 9999,
  },
  sphereTL: {
    top: -40,
    left: -50,
    width: 280,
    height: 280,
  },
  sphereBR: {
    bottom: -60,
    right: -40,
    width: 300,
    height: 300,
  },
})
