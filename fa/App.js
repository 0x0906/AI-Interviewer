import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { enableScreens } from 'react-native-screens';
import { ThemeProvider } from "./utils/ThemeContext";

enableScreens();

import WelcomeScreen from "./screens/WelcomeScreen";
import NoteScreen from "./screens/NoteScreen";
import PreferencesScreen from "./screens/PreferencesScreen";
import InterviewScreen from "./screens/InterviewScreen";
import ResponseScreen from "./screens/ResponseScreen";
import FeedbackScreen from "./screens/FeedbackScreen";


const Stack = createNativeStackNavigator();

export default function App() {
  console.log(process.env.EXPO_PUBLIC_SERVER_URL);
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="NoteScreen" component={NoteScreen} />
          <Stack.Screen name="PreferencesScreen" component={PreferencesScreen} />
          <Stack.Screen name="InterviewScreen" component={InterviewScreen} />
          <Stack.Screen name="ResponseScreen" component={ResponseScreen} />
          <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
