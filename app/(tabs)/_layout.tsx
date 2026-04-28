import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { useColors } from '../../hooks/ThemeContext';
import { DockNav } from '../../components/DockNav';
import AddModal from '../../components/AddModal';

const MAX_CONTENT_WIDTH = 1140;

export default function TabsLayout() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  // On wide screens, pad inward so content stays centred — scrollbar stays at viewport edge
  const hPad = Math.max(0, (width - MAX_CONTENT_WIDTH) / 2);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg, paddingBottom: 72, paddingHorizontal: hPad },
      }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <DockNav />
      </View>
      <AddModal />
    </View>
  );
}
