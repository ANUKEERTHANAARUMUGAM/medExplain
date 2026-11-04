import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

const Orb = ({ style, duration, delay = 0 }) => {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(drift, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [delay, duration, drift]);
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const scale = drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return <Animated.View pointerEvents="none" style={[styles.orb, style, { transform: [{ translateY }, { scale }] }]} />;
};

export const AmbientHealthBackground = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Orb duration={5200} style={styles.orbOne} />
    <Orb duration={6800} delay={500} style={styles.orbTwo} />
    <View style={styles.glow} />
  </View>
);

const styles = StyleSheet.create({
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.16 },
  orbOne: { width: 190, height: 190, top: -110, right: -72, backgroundColor: colors.mint },
  orbTwo: { width: 145, height: 145, top: 180, left: -112, backgroundColor: colors.sky, opacity: 0.12 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250, backgroundColor: 'rgba(255,255,255,0.08)' },
});
