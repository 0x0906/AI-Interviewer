import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { useNavigation } from "@react-navigation/native";
import { useTheme } from '../utils/ThemeContext';
import { TYPOGRAPHY } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

const requirements = [
  { icon: 'wifi', label: 'NETWORK', text: 'Stable connection required' },
  { icon: 'mic', label: 'AUDIO', text: 'Clear mic input detection' },
  { icon: 'eye', label: 'VISUALS', text: 'Well-lit surroundings' }
];

const NoteScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.exp), useNativeDriver: true })
    ]).start();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: micStatus } = await Audio.requestPermissionsAsync();

      if (cameraStatus === 'granted' && micStatus === 'granted') {
        navigation.replace('PreferencesScreen');
      } else {
        Alert.alert("Hardware Access", "The simulator requires camera and microphone permissions to initialize.");
      }
    } catch (error) {
      Alert.alert("System Error", "Failed to initialize hardware protocols.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={[styles.label, { color: colors.primary }]}>PRE-FLIGHT CHECK</Text>
          <Text style={[styles.title, { color: colors.text }]}>System Readiness</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Initialize your environment to ensure peak AI analysis accuracy.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.list, { opacity: fadeAnim }]}>
          {requirements.map((req, i) => (
            <View key={i} style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                <Feather name={req.icon} size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.itemLabel, { color: colors.primary }]}>{req.label}</Text>
                <Text style={[styles.itemText, { color: colors.text }]}>{req.text}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.text }]}
            onPress={requestPermissions}
          >
            <Text style={[styles.primaryButtonText, { color: colors.background }]}>INITIALIZE HARDWARE</Text>
            <Feather name="shield" size={18} color={colors.background} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default NoteScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 32 },
  header: { marginTop: 40, marginBottom: 48 },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  title: { ...TYPOGRAPHY.h2, marginBottom: 16 },
  subtitle: { fontSize: 16, lineHeight: 26, fontWeight: '500' },
  list: { gap: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    gap: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  itemText: { fontSize: 15, fontWeight: '700' },
  footer: { marginTop: 'auto', paddingTop: 40 },
  primaryButton: {
    height: 72,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
