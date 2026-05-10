import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from "@react-navigation/native";
import { useTheme } from '../utils/ThemeContext';
import { TYPOGRAPHY } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { colors, toggleTheme, isDark } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const orbScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 1000, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, { toValue: 1.1, duration: 3000, useNativeDriver: true }),
          Animated.timing(orbScale, { toValue: 1, duration: 3000, useNativeDriver: true }),
        ])
      )
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Decorative Orbs */}
      <Animated.View style={[
        styles.topOrb, 
        { 
          backgroundColor: colors.primary, 
          opacity: isDark ? 0.15 : 0.1,
          transform: [{ scale: orbScale }]
        }
      ]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="cpu" size={20} color={colors.primary} />
            <Text style={[styles.logoText, { color: colors.text }]}>AI.STUDIO</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={toggleTheme}
          >
            <Feather name={isDark ? "sun" : "moon"} size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.heroBadge}>
            <Text style={[styles.heroBadgeText, { color: colors.primary }]}>NEXT-GEN PREPARATION</Text>
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            Master the art of{"\n"}
            <Text style={{ color: colors.primary }}>Interviewing.</Text>
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Experience the world's most advanced AI interview simulator. Get real-time vocal analysis and predictive feedback.
          </Text>

          <View style={styles.featureRow}>
            <Feature icon="mic" label="Vocal Metrics" colors={colors} />
            <Feature icon="zap" label="Real-time AI" colors={colors} />
            <Feature icon="target" label="Role Specific" colors={colors} />
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.text }]}
            activeOpacity={0.9}
            onPress={() => navigation.replace("NoteScreen")}
          >
            <Text style={[styles.primaryButtonText, { color: colors.background }]}>Initialize Experience</Text>
            <Feather name="arrow-right" size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const Feature = ({ icon, label, colors }) => (
  <View style={styles.featureItem}>
    <View style={[styles.featureIcon, { backgroundColor: colors.surfaceSecondary }]}>
      <Feather name={icon} size={14} color={colors.primary} />
    </View>
    <Text style={[styles.featureLabel, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  safeArea: { flex: 1, paddingHorizontal: 28 },
  topOrb: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  logoText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: { flex: 1, justifyContent: 'center' },
  heroBadge: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  title: { ...TYPOGRAPHY.h1, marginBottom: 24 },
  description: { ...TYPOGRAPHY.body, fontSize: 18, color: '#64748B', lineHeight: 28, marginBottom: 40 },
  featureRow: { flexDirection: 'row', gap: 20 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 12, fontWeight: '700' },
  footer: { paddingBottom: 40 },
  primaryButton: {
    height: 68,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  primaryButtonText: { fontSize: 18, fontWeight: '700' },
});
