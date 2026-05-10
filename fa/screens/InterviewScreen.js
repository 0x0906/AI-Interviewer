import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Easing,
  BlurView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useTheme } from "../utils/ThemeContext";
import { TYPOGRAPHY } from "../constants/theme";
import { Feather } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const InterviewScreen = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const questions = route?.params?.data || ["Tell me about your background and how it fits this role."];
  const interviewType = route?.params?.interviewType || "common";
  const role = route?.params?.role || null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [records, setRecords] = useState([]);
  const [liveDuration, setLiveDuration] = useState(0); 
  const [metering, setMetering] = useState(-160);

  // Animations
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbOpacity = useRef(new Animated.Value(0.6)).current;
  const pulseAnims = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  
  const countdownRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const setupAudio = async () => {
      await Audio.requestPermissionsAsync();
    };
    setupAudio();
    return () => {
      if (recording) recording.stopAndUnloadAsync().catch(() => {});
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setLiveDuration(prev => prev + 1), 1000);
      
      // Start Ring Pulsing
      pulseAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 1000),
            Animated.timing(anim, {
              toValue: 1,
              duration: 3000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            })
          ])
        ).start();
      });

    } else {
      clearInterval(timerRef.current);
      pulseAnims.forEach(anim => {
        anim.stopAnimation();
        anim.setValue(0);
      });
    }
  }, [isRecording]);

  useEffect(() => {
    const minDb = -60;
    let normalized = 0;
    if (metering > minDb) {
      normalized = Math.min(1, (metering - minDb) / Math.abs(minDb));
    }

    Animated.parallel([
      Animated.spring(orbScale, {
        toValue: isRecording ? 1 + (normalized * 0.4) : 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(orbOpacity, {
        toValue: isRecording ? 0.6 + (normalized * 0.4) : 0.6,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  }, [metering, isRecording]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startCountdown = () => {
    if (isRecording) return;
    let counter = 3;
    setCountdown(counter);
    countdownRef.current = setInterval(() => {
      counter -= 1;
      if (counter === 0) {
        clearInterval(countdownRef.current);
        setCountdown(null);
        startRecording();
      } else setCountdown(counter);
    }, 1000);
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      recording.setOnRecordingStatusUpdate(s => {
        if (s.metering != null) setMetering(s.metering);
      });
      recording.setProgressUpdateInterval(80);
      setRecording(recording);
      setIsRecording(true);
      setLiveDuration(0);
    } catch (err) {
      Alert.alert("Hardware Error", "Could not initialize neuro-mic.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const updated = [...records];
    updated[currentIndex] = ["audio_only", uri];
    setRecords(updated);
    setRecording(null);
    setMetering(-160);
  };

  const handleNext = () => {
    if (!records[currentIndex]) {
      Alert.alert("Locked", "Complete current response to unlock next question.");
      return;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setLiveDuration(0);
    } else {
      navigation.replace("ResponseScreen", { answers: records, questions, interviewType, role });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Dynamic Background */}
      <View style={[styles.bgGlow, { backgroundColor: colors.primary, opacity: isRecording ? 0.08 : 0.03 }]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress Header */}
        <View style={styles.header}>
          <View style={[styles.progressBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.progressText, { color: colors.primary }]}>
              PROGRES: <Text style={{ color: colors.text }}>{currentIndex + 1} / {questions.length}</Text>
            </Text>
          </View>
          <View style={[styles.timerBadge, { backgroundColor: isRecording ? colors.error + '20' : colors.surface, borderColor: isRecording ? colors.error : colors.border }]}>
            <View style={[styles.dot, { backgroundColor: isRecording ? colors.error : colors.textMuted }]} />
            <Text style={[styles.timerText, { color: isRecording ? colors.error : colors.text }]}>{formatTime(liveDuration)}</Text>
          </View>
        </View>

        {/* Question Area */}
        <View style={styles.questionSection}>
          <Feather name="help-circle" size={24} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.question, { color: colors.text }]}>{questions[currentIndex]}</Text>
        </View>

        {/* Advanced Visualizer */}
        <View style={styles.studio}>
          <View style={styles.orbContainer}>
            {pulseAnims.map((anim, i) => (
              <Animated.View 
                key={i}
                style={[
                  styles.pulseRing, 
                  { 
                    borderColor: colors.primary,
                    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }]
                  }
                ]}
              />
            ))}
            
            <Animated.View style={[
              styles.mainOrb, 
              { 
                backgroundColor: isRecording ? colors.primary : colors.surfaceSecondary,
                shadowColor: colors.primary,
                opacity: orbOpacity,
                transform: [{ scale: orbScale }]
              }
            ]}>
              <Feather 
                name={isRecording ? "activity" : countdown ? "clock" : "mic"} 
                size={40} 
                color={isRecording ? colors.background : colors.textMuted} 
              />
            </Animated.View>
          </View>

          <View style={styles.statusBox}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>
              {isRecording ? "LIVE ANALYSIS" : countdown ? `INITIALIZING IN ${countdown}` : "READY FOR INPUT"}
            </Text>
            <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
              {isRecording ? "AI is processing your vocal tonality" : "Speak clearly in a quiet environment"}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.footer}>
          {!isRecording ? (
            <TouchableOpacity 
              style={[styles.recordBtn, { backgroundColor: colors.text }]} 
              onPress={startCountdown}
              activeOpacity={0.9}
            >
              <Feather name={records[currentIndex] ? "refresh-cw" : "play"} size={20} color={colors.background} />
              <Text style={[styles.recordBtnText, { color: colors.background }]}>
                {records[currentIndex] ? "RE-RECORD" : "START RECORDING"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.stopBtn, { backgroundColor: colors.error }]} 
              onPress={stopRecording}
              activeOpacity={0.9}
            >
              <Feather name="square" size={20} color={colors.background} />
              <Text style={[styles.recordBtnText, { color: colors.background }]}>FINISH SESSION</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.nextBtn, { borderColor: colors.border }]} 
            onPress={handleNext}
            disabled={!records[currentIndex]}
          >
            <Text style={[styles.nextBtnText, { color: records[currentIndex] ? colors.text : colors.textMuted }]}>
              {currentIndex === questions.length - 1 ? "FINALIZE & ANALYZE" : "NEXT QUESTION"}
            </Text>
            <Feather name="chevron-right" size={20} color={records[currentIndex] ? colors.text : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default InterviewScreen;

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  safeArea: { flex: 1 },
  bgGlow: { position: 'absolute', width: width, height: width, borderRadius: width/2, top: height/4, left: 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'center',
  },
  progressBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  timerText: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  questionSection: { paddingHorizontal: 32, paddingVertical: 40 },
  question: { ...TYPOGRAPHY.h3, fontSize: 26, lineHeight: 36 },
  studio: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbContainer: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  mainOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 20,
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  statusBox: { alignItems: 'center', marginTop: 60 },
  statusTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  statusSubtitle: { fontSize: 14, fontWeight: '500' },
  footer: { padding: 32, gap: 16 },
  recordBtn: {
    height: 72,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  recordBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  stopBtn: {
    height: 72,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  nextBtn: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
