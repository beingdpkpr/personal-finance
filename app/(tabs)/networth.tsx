import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Modal, TextInput } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { spacing, radius, Colors } from '../../constants/theme';
import { useColors } from '../../hooks/ThemeContext';
import { fmtFull } from '../../lib/format';
import { uid, NetWorthItem, NetWorthData } from '../../lib/data';
import { PlusIcon, TrashIcon, EditIcon } from '../../components/icons';

type ItemMode = 'asset' | 'liability';

export default function NetWorthScreen() {
  const colors = useColors();
  const { nw, setNw } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [mode,      setMode]      = useState<ItemMode>('asset');
  const [editId,    setEditId]    = useState<string | null>(null);
  const [name,      setName]      = useState('');
  const [value,     setValue]     = useState('');

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const totalAssets      = nw.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = nw.liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth         = totalAssets - totalLiabilities;

  function openNew(m: ItemMode) {
    setMode(m); setEditId(null); setName(''); setValue(''); setModalOpen(true);
  }

  function openEdit(item: NetWorthItem, m: ItemMode) {
    setMode(m); setEditId(item.id); setName(item.name); setValue(String(item.value)); setModalOpen(true);
  }

  function save() {
    const v = parseFloat(value);
    if (!name || isNaN(v)) return;
    if (editId) {
      const update = (list: NetWorthItem[]) => list.map(i => i.id === editId ? { ...i, name, value: v } : i);
      setNw({
        assets:      mode === 'asset'     ? update(nw.assets)      : nw.assets,
        liabilities: mode === 'liability' ? update(nw.liabilities) : nw.liabilities,
      });
    } else {
      const item = { id: uid(), name, value: v };
      setNw({
        assets:      mode === 'asset'     ? [...nw.assets,      item] : nw.assets,
        liabilities: mode === 'liability' ? [...nw.liabilities, item] : nw.liabilities,
      });
    }
    setModalOpen(false);
  }

  function remove(id: string, m: ItemMode) {
    setNw({
      assets:      m === 'asset'     ? nw.assets.filter(i => i.id !== id)      : nw.assets,
      liabilities: m === 'liability' ? nw.liabilities.filter(i => i.id !== id) : nw.liabilities,
    });
  }

  function renderItem(item: NetWorthItem, m: ItemMode) {
    return (
      <View key={item.id} style={styles.itemRow}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.itemValue, { color: m === 'asset' ? colors.green : colors.red }]}>
          {fmtFull(item.value)}
        </Text>
        <Pressable onPress={() => openEdit(item, m)} style={styles.iconBtn}><EditIcon size={15} color={colors.muted} /></Pressable>
        <Pressable onPress={() => remove(item.id, m)} style={styles.iconBtn}><TrashIcon size={15} color={colors.muted} /></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.netCard}>
        <Text style={styles.netLabel}>Net Worth</Text>
        <Text style={[styles.netValue, { color: netWorth >= 0 ? colors.green : colors.red }]}>
          {fmtFull(netWorth)}
        </Text>
        <View style={styles.netRow}>
          <Text style={styles.netSub}>Assets <Text style={{ color: colors.green }}>{fmtFull(totalAssets)}</Text></Text>
          <Text style={styles.netSub}>  –  Liabilities <Text style={{ color: colors.red }}>{fmtFull(totalLiabilities)}</Text></Text>
        </View>
      </View>

      <FlatList
        data={[1]}
        keyExtractor={() => 'main'}
        contentContainerStyle={styles.content}
        renderItem={() => (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assets</Text>
                <Pressable onPress={() => openNew('asset')} style={styles.addBtn}>
                  <PlusIcon size={14} color={colors.green} />
                  <Text style={[styles.addBtnText, { color: colors.green }]}>Add</Text>
                </Pressable>
              </View>
              {nw.assets.map(a => renderItem(a, 'asset'))}
              {nw.assets.length === 0 && <Text style={styles.empty}>No assets added yet.</Text>}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Liabilities</Text>
                <Pressable onPress={() => openNew('liability')} style={styles.addBtn}>
                  <PlusIcon size={14} color={colors.red} />
                  <Text style={[styles.addBtnText, { color: colors.red }]}>Add</Text>
                </Pressable>
              </View>
              {nw.liabilities.map(l => renderItem(l, 'liability'))}
              {nw.liabilities.length === 0 && <Text style={styles.empty}>No liabilities added yet.</Text>}
            </View>
          </>
        )}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editId ? 'Edit' : 'Add'} {mode === 'asset' ? 'Asset' : 'Liability'}</Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.muted}
              value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Value" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={value} onChangeText={setValue} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: Colors) { return StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  netCard:       { margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center' },
  netLabel:      { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginBottom: 4 },
  netValue:      { fontSize: 32, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  netRow:        { flexDirection: 'row', marginTop: 8 },
  netSub:        { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  content:       { paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 },
  section:       { marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle:  { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.surface2 },
  addBtnText:    { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold' },
  itemRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  itemName:      { flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  itemValue:     { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  iconBtn:       { padding: 6 },
  empty:         { color: colors.muted, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center', paddingVertical: spacing.sm },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  modalTitle:    { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, marginBottom: spacing.xs },
  input:         { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: spacing.sm, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' },
  modalActions:  { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn:     { paddingHorizontal: spacing.md, paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  saveBtn:       { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.accent },
  saveBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
}); }
