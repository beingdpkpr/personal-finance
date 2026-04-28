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
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </View>
      <DockNav />
      <AddModal />
    </View>
  );
}
