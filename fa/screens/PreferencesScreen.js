import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../utils/ThemeContext";
import { TYPOGRAPHY } from "../constants/theme";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PreferencesScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark, toggleTheme } = useTheme();

  const [sessionId] = useState(() => "session_" + Math.random().toString(36).slice(2));
  const [interviewType, setInterviewType] = useState("common");
  const [selectedRole, setSelectedRole] = useState("Software Developer");
  const [customRole, setCustomRole] = useState("");
  const [questionCount, setQuestionCount] = useState(3);
  const [difficulty, setDifficulty] = useState("Medium");
  const [loading, setLoading] = useState(false);

  const roles = [
    { label: "Software Developer", icon: "code" },
    { label: "Frontend Developer", icon: "layout" },
    { label: "Backend Developer", icon: "database" },
    { label: "Product Manager", icon: "briefcase" },
    { label: "Other", icon: "more-horizontal" },
  ];

  const handleTypeChange = (type) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setInterviewType(type);
  };

  const handleStart = async () => {
    const finalRole = selectedRole === "Other" ? customRole.trim() : selectedRole;
    if (interviewType === "role" && !finalRole) {
      Alert.alert("Target Role", "Identify your target role for customized analysis.");
      return;
    }

    try {
      setLoading(true);
      const preferences = {
        type: interviewType,
        role: interviewType === "role" ? finalRole : null,
        count: questionCount,
        difficulty: interviewType === "role" ? difficulty.toLowerCase() : null,
        session_id: sessionId,
      };

      const response = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      
      setLoading(false);
      navigation.navigate("InterviewScreen", {
        data: data.questions,
        role: data.role,
        difficulty: data.difficulty,
        sessionId: sessionId,
      });
    } catch (error) {
      setLoading(false);
      Alert.alert("Engine Offline", "Could not initialize the AI core. Please check your link.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configuration</Text>
        <TouchableOpacity 
          style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]} 
          onPress={toggleTheme}
        >
          <Feather name={isDark ? "sun" : "moon"} size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Style Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>SESSION ARCHITECTURE</Text>
          <View style={[styles.typeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TypeOption 
              active={interviewType === "common"} 
              label="Standard" 
              desc="General behavioral"
              icon="command"
              onPress={() => handleTypeChange("common")}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TypeOption 
              active={interviewType === "role"} 
              label="Specialized" 
              desc="Role-specific technical"
              icon="target"
              onPress={() => handleTypeChange("role")}
              colors={colors}
            />
          </View>
        </View>

        {interviewType === "role" && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>CORE DOMAIN</Text>
            <View style={styles.roleGrid}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.label}
                  style={[
                    styles.roleCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedRole === role.label && { borderColor: colors.primary, backgroundColor: colors.primary + '08' }
                  ]}
                  onPress={() => setSelectedRole(role.label)}
                >
                  <Feather name={role.icon} size={20} color={selectedRole === role.label ? colors.primary : colors.textMuted} />
                  <Text style={[styles.roleLabel, { color: selectedRole === role.label ? colors.text : colors.textSecondary }]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedRole === "Other" && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Specify target domain..."
                placeholderTextColor={colors.textMuted}
                value={customRole}
                onChangeText={setCustomRole}
              />
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>COMPLEXITY & DEPTH</Text>
          <View style={styles.settingsRow}>
            <SettingControl 
              label="Questions" 
              value={questionCount} 
              onMinus={() => setQuestionCount(Math.max(1, questionCount - 1))}
              onPlus={() => setQuestionCount(Math.min(10, questionCount + 1))}
              colors={colors}
            />
            <SettingControl 
              label="Difficulty" 
              value={difficulty} 
              isText
              onMinus={() => setDifficulty(prev => prev === "Hard" ? "Medium" : "Easy")}
              onPlus={() => setDifficulty(prev => prev === "Easy" ? "Medium" : "Hard")}
              colors={colors}
            />
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.text }]}
          onPress={handleStart}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Text style={[styles.primaryButtonText, { color: colors.background }]}>INITIALIZE STUDIO</Text>
              <Feather name="zap" size={18} color={colors.background} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const TypeOption = ({ active, label, desc, icon, onPress, colors }) => (
  <TouchableOpacity style={[styles.typeOption, active && { backgroundColor: colors.primary + '08' }]} onPress={onPress}>
    <View style={[styles.typeIcon, { backgroundColor: active ? colors.primary : colors.surfaceSecondary }]}>
      <Feather name={icon} size={18} color={active ? colors.background : colors.textSecondary} />
    </View>
    <View>
      <Text style={[styles.typeLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.typeDesc, { color: colors.textSecondary }]}>{desc}</Text>
    </View>
  </TouchableOpacity>
);

const SettingControl = ({ label, value, onMinus, onPlus, isText, colors }) => (
  <View style={[styles.settingBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>{label}</Text>
    <View style={styles.controlRow}>
      <TouchableOpacity onPress={onMinus}><Feather name="minus-circle" size={20} color={colors.textMuted} /></TouchableOpacity>
      <Text style={[styles.settingValue, { color: colors.text }]}>{value}</Text>
      <TouchableOpacity onPress={onPlus}><Feather name="plus-circle" size={20} color={colors.textMuted} /></TouchableOpacity>
    </View>
  </View>
);

export default PreferencesScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  backBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  themeToggle: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 120 },
  section: { marginTop: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  typeContainer: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  typeOption: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  typeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 16, fontWeight: '700' },
  typeDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  divider: { height: 1 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: {
    width: (width - 50) / 2,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  roleLabel: { fontSize: 13, fontWeight: '600' },
  input: {
    marginTop: 12,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  settingsRow: { flexDirection: 'row', gap: 12 },
  settingBox: { flex: 1, padding: 20, borderRadius: 20, borderWidth: 1 },
  settingLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingValue: { fontSize: 16, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: 'transparent' },
  primaryButton: {
    height: 72,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
