import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { uploadInterviewAudios } from "../utils/uploadAudio";
import { useTheme } from "../utils/ThemeContext";
import { TYPOGRAPHY } from "../constants/theme";
import { Feather } from "@expo/vector-icons";

const ResponseScreen = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const { answers = [], questions = [], interviewType = "common", role = null } = route.params || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleGenerateFeedback = async () => {
    setIsProcessing(true);
    Animated.timing(fadeAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }).start();

    try {
      const response = await uploadInterviewAudios(
        answers,
        questions,
        (progress) => setUploadProgress(progress),
        { interview_type: interviewType, role: role }
      );

      const parsedReport = JSON.parse(response.report);
      navigation.replace("FeedbackScreen", {
        feedback: parsedReport,
        interviewType,
        role,
      });

    } catch (error) {
      setIsProcessing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      Alert.alert("Engine Timeout", "The AI core failed to process the uplink. Check your connection.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.primary }]}>DATA SYNCHRONIZATION</Text>
          <Text style={[styles.title, { color: colors.text }]}>Finalize Batch</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {questions.map((q, i) => (
            <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.qDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.qLabel, { color: colors.textSecondary }]}>QUERY {i + 1}</Text>
              </View>
              <Text style={[styles.qText, { color: colors.text }]}>{q}</Text>
              <View style={[styles.statusTag, { backgroundColor: answers[i] ? colors.success + '15' : colors.error + '15' }]}>
                <Feather name={answers[i] ? "check-circle" : "x-circle"} size={12} color={answers[i] ? colors.success : colors.error} />
                <Text style={[styles.statusText, { color: answers[i] ? colors.success : colors.error }]}>
                  {answers[i] ? "ENCODED" : "NULL"}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {isProcessing && (
          <View style={styles.progressBox}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, { color: colors.text }]}>UPLINKING DATA</Text>
              <Text style={[styles.progressPercent, { color: colors.primary }]}>{Math.round(uploadProgress)}%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={[styles.fill, { width: `${uploadProgress}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.text }]}
          onPress={handleGenerateFeedback}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Text style={[styles.primaryButtonText, { color: colors.background }]}>INITIALIZE AI ANALYSIS</Text>
              <Feather name="cpu" size={18} color={colors.background} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ResponseScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: { padding: 32, paddingTop: 10 },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  title: { ...TYPOGRAPHY.h3, fontSize: 32 },
  scroll: { paddingHorizontal: 24, paddingBottom: 180 },
  card: { padding: 24, borderRadius: 28, borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  qDot: { width: 6, height: 6, borderRadius: 3 },
  qLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  qText: { fontSize: 15, fontWeight: '600', marginBottom: 16, lineHeight: 22 },
  statusTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 32, borderTopWidth: 1 },
  progressBox: { marginBottom: 24 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  progressPercent: { fontSize: 11, fontWeight: '900' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
  primaryButton: { height: 72, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryButtonText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
