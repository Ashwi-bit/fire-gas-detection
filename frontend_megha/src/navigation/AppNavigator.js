// src/navigation/AppNavigator.js
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import SettingsScreen from '../screens/SettingsScreen';

const AuthStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Analysis" component={AnalysisScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d84b30" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}