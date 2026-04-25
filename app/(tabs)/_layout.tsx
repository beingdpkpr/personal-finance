import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Slot } from 'expo-router';
import SidebarNav from '../../components/SidebarNav';
import BottomNav from '../../components/BottomNav';
import AddModal from '../../components/AddModal';
import { WIDE_BREAKPOINT } from '../../constants/theme';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_BREAKPOINT;

  return (
    <View style={[styles.root, wide ? styles.rootWide : styles.rootNarrow]}>
      {wide && <SidebarNav />}
      <View style={styles.content}>
        <Slot />
      </View>
      {!wide && <BottomNav />}
      <AddModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  rootWide:   { flexDirection: 'row' },
  rootNarrow: { flexDirection: 'column' },
  content:    { flex: 1 },
});
