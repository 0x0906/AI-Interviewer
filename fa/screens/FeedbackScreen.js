import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../utils/ThemeContext";
import { TYPOGRAPHY } from "../constants/theme";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const FeedbackScreen = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const feedback = route?.params?.feedback;

  const {
    decisionSummary = {},
    overallScores = {},
    questionBreakdown = [],
  } = feedback || {};

  const decisionColor = useMemo(() => {
    const rec = decisionSummary.hireRecommendation;
    if (rec?.includes("Hire") && !rec?.includes("No")) return colors.success;
    if (rec === "Borderline") return colors.warning;
    return colors.error;
  }, [decisionSummary.hireRecommendation, colors]);

  if (!feedback) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.primary }]}>INTELLIGENCE REPORT</Text>
          <Text style={[styles.title, { color: colors.text }]}>Evaluation Summary</Text>
        </View>

        {/* Hero Performance Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.statusRow]}>
            <View style={[styles.statusIndicator, { backgroundColor: decisionColor }]} />
            <Text style={[styles.statusText, { color: decisionColor }]}>{decisionSummary.hireRecommendation?.toUpperCase()}</Text>
          </View>
          
          <Text style={[styles.heroText, { color: colors.text }]}>{decisionSummary.finalSummary}</Text>
          
          <View style={[styles.recommendationBox, { backgroundColor: colors.surfaceSecondary }]}>
            <Feather name="info" size={16} color={colors.primary} />
            <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
              {decisionSummary.whyThisRecommendation}
            </Text>
          </View>
        </View>

        {/* Metrics Section */}
        <View style={styles.metricsContainer}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CORE METRICS</Text>
          <View style={styles.metricsGrid}>
            <MetricCard label="COMMUNICATION" value={overallScores.overallCommunicationScore} icon="message-square" colors={colors} />
            <MetricCard label="TECHNICAL" value={overallScores.overallTechnicalScore} icon="cpu" colors={colors} />
            <MetricCard label="CONFIDENCE" value={overallScores.overallConfidenceScore} icon="shield" colors={colors} />
            <MetricCard label="RELEVANCE" value={overallScores.overallRelevanceScore} icon="crosshair" colors={colors} />
          </View>
        </View>

        {/* Detailed Insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DOMAIN PERFORMANCE</Text>
          {questionBreakdown.map((q, i) => (
            <View key={i} style={[styles.insightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.insightHeader}>
                <View style={[styles.qIndex, { backgroundColor: colors.primary }]}>
                  <Text style={styles.qIndexText}>{i + 1}</Text>
                </View>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Technical Response Analysis</Text>
              </View>

              <View style={styles.scoreStrip}>
                <ScoreMini label="DEPTH" value={q.technicalDepthScore} colors={colors} />
                <ScoreMini label="CLARITY" value={q.clarityScore} colors={colors} />
                <ScoreMini label="FLOW" value={q.confidenceScore} colors={colors} />
              </View>

              <View style={styles.bulletSection}>
                <View style={styles.bulletCol}>
                  <Text style={[styles.bulletLabel, { color: colors.success }]}>STRENGTHS</Text>
                  {q.whatWentWell?.map((item, idx) => (
                    <Text key={idx} style={[styles.bulletItem, { color: colors.textSecondary }]}>• {item}</Text>
                  ))}
                </View>
                <View style={styles.bulletCol}>
                  <Text style={[styles.bulletLabel, { color: colors.error }]}>CRITICAL FIXES</Text>
                  {q.whatNeedsImprovement?.map((item, idx) => (
                    <Text key={idx} style={[styles.bulletItem, { color: colors.textSecondary }]}>• {item}</Text>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.text }]}
          onPress={() => navigation.replace("Welcome")}
        >
          <Text style={[styles.primaryButtonText, { color: colors.background }]}>TERMINATE SESSION</Text>
          <Feather name="log-out" size={18} color={colors.background} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const MetricCard = ({ label, value, icon, colors }) => (
  <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Feather name={icon} size={16} color={colors.primary} />
    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[styles.metricValue, { color: colors.text }]}>{value}<Text style={{ fontSize: 12, color: colors.textMuted }}>/10</Text></Text>
  </View>
);

const ScoreMini = ({ label, value, colors }) => (
  <View style={styles.miniScore}>
    <Text style={[styles.miniLabel, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[styles.miniValue, { color: colors.text }]}>{value}/10</Text>
  </View>
);

export default FeedbackScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { padding: 24, paddingTop: 10 },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title: { ...TYPOGRAPHY.h3, fontSize: 32, marginTop: 4 },
  heroCard: { margin: 24, padding: 24, borderRadius: 28, borderWidth: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroText: { fontSize: 18, fontWeight: '700', lineHeight: 26 },
  recommendationBox: { marginTop: 24, padding: 16, borderRadius: 16, flexDirection: 'row', gap: 12 },
  recommendationText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 20 },
  metricsContainer: { paddingHorizontal: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { width: (width - 60) / 2, padding: 20, borderRadius: 20, borderWidth: 1, gap: 12 },
  metricLabel: { fontSize: 10, fontWeight: '800' },
  metricValue: { fontSize: 24, fontWeight: '900' },
  section: { padding: 24, marginTop: 10 },
  insightCard: { padding: 24, borderRadius: 24, borderWidth: 1, marginBottom: 16 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  qIndex: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qIndexText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  insightTitle: { fontSize: 15, fontWeight: '800' },
  scoreStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#eee' },
  miniScore: { alignItems: 'center' },
  miniLabel: { fontSize: 9, fontWeight: '800', marginBottom: 4 },
  miniValue: { fontSize: 14, fontWeight: '800' },
  bulletSection: { marginTop: 20, gap: 20 },
  bulletLabel: { fontSize: 11, fontWeight: '900', marginBottom: 8 },
  bulletItem: { fontSize: 13, fontWeight: '500', lineHeight: 18, marginBottom: 4 },
  primaryButton: { margin: 24, height: 72, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryButtonText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
