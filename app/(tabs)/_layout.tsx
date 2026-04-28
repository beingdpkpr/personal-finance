import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useColors } from '../../hooks/ThemeContext';
import { DockNav } from '../../components/DockNav';
import AddModal from '../../components/AddModal';

export default function TabsLayout() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { paddingBottom: 80, backgroundColor: colors.bg } }} />
      <DockNav />
      <AddModal />
    </View>
  );
}
