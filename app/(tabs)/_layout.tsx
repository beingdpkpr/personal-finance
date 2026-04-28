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
      {/* Content fills full height — scrollbar runs to the very bottom */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 1140 }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg, paddingBottom: 72 } }} />
        </View>
      </View>
      {/* Dock overlays the bottom — transparent so content shows through */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <DockNav />
      </View>
      <AddModal />
    </View>
  );
}
