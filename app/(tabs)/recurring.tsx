import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Modal, TextInput } from 'react-native';
import { useFinance } from '../../hooks/FinanceContext';
import { colors, spacing, radius } from '../../constants/theme';
import { fmt } from '../../lib/format';
import { uid, RecurringRule } from '../../lib/data';
import { EXPENSE_CATS, INCOME_CATS } from '../../constants/categories';
import { PlusIcon, TrashIcon, EditIcon } from '../../components/icons';

export default function RecurringScreen() {
  const { recurring, setRecurring, currency } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [type,      setType]      = useState<'expense' | 'income'>('expense');
  const [amount,    setAmount]    = useState('');
  const [category,  setCategory]  = useState('food');
  const [desc,      setDesc]      = useState('');
  const [day,       setDay]       = useState('1');

  function openNew() {
    setEditId(null); setType('expense'); setAmount(''); setCategory('food'); setDesc(''); setDay('1');
    setModalOpen(true);
  }

  function openEdit(r: RecurringRule) {
    setEditId(r.id); setType(r.type as 'expense' | 'income'); setAmount(String(r.amount));
    setCategory(r.category); setDesc(r.description); setDay(String(r.dayOfMonth));
    setModalOpen(true);
  }

  function save() {
    const amt = parseFloat(amount), d = parseInt(day, 10);
    if (!desc || isNaN(amt) || isNaN(d) || d < 1 || d > 28) return;
    const rule: RecurringRule = { id: editId ?? uid(), type, amount: amt, category, description: desc, dayOfMonth: d };
    setRecurring(editId ? recurring.map(r => r.id === editId ? rule : r) : [...recurring, rule]);
    setModalOpen(false);
  }

  function nextDate(dayOfMonth: number) {
    const now = new Date();
    const d   = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
    if (d <= now) d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.heading}>Recurring</Text>
        <Pressable onPress={openNew} style={styles.addBtn}>
          <PlusIcon size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={recurring}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={<Text style={styles.empty}>No recurring rules yet.</Text>}
        renderItem={({ item: r }) => (
          <View style={styles.card}>
            <View style={[styles.typeDot, { backgroundColor: r.type === 'income' ? colors.green : colors.red }]} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardDesc}>{r.description}</Text>
              <Text style={styles.cardMeta}>{r.category} · Day {r.dayOfMonth} of each month</Text>
              <Text style={styles.cardNext}>Next: {nextDate(r.dayOfMonth)}</Text>
            </View>
            <Text style={[styles.cardAmt, { color: r.type === 'income' ? colors.green : colors.red }]}>
              {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
            </Text>
            <Pressable onPress={() => openEdit(r)} style={styles.iconBtn}><EditIcon size={15} color={colors.muted} /></Pressable>
            <Pressable onPress={() => setRecurring(recurring.filter(x => x.id !== r.id))} style={styles.iconBtn}>
              <TrashIcon size={15} color={colors.muted} />
            </Pressable>
          </View>
        )}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editId ? 'Edit' : 'New'} Recurring Rule</Text>

            <View style={styles.typeToggle}>
              {(['expense', 'income'] as const).map(v => (
                <Pressable key={v} onPress={() => { setType(v); setCategory(v === 'expense' ? 'food' : 'salary'); }}
                  style={[styles.typeBtn, type === v && { backgroundColor: v === 'income' ? colors.greenDim : colors.redDim,
                    borderColor: v === 'income' ? colors.green : colors.red }]}>
                  <Text style={[styles.typeBtnText, type === v && { color: v === 'income' ? colors.green : colors.red }]}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput style={styles.input} placeholder="Description" placeholderTextColor={colors.muted}
              value={desc} onChangeText={setDesc} />
            <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder="Day of month (1–28)" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={day} onChangeText={setDay} />

            <Text style={styles.catLabel}>Category</Text>
            <View style={styles.catGrid}>
              {(type === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => (
                <Pressable key={c.id} onPress={() => setCategory(c.id)}
                  style={[styles.catChip, category === c.id && { backgroundColor: c.color + '33', borderColor: c.color }]}>
                  <Text style={[styles.catChipText, category === c.id && { color: c.color }]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{editId ? 'Update' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  heading:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.accent },
  addBtnText:    { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  content:       { paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 },
  empty:         { textAlign: 'center', color: colors.muted, marginTop: spacing.xl, fontFamily: 'PlusJakartaSans_400Regular' },
  card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  typeDot:       { width: 8, height: 8, borderRadius: 4 },
  cardInfo:      { flex: 1 },
  cardDesc:      { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text },
  cardMeta:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  cardNext:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.blue, marginTop: 1 },
  cardAmt:       { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', marginHorizontal: spacing.xs },
  iconBtn:       { padding: 6 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard:     { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  modalTitle:    { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, marginBottom: spacing.xs },
  typeToggle:    { flexDirection: 'row', gap: spacing.sm },
  typeBtn:       { flex: 1, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  typeBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted },
  input:         { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: spacing.sm, fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' },
  modalActions:  { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn:     { paddingHorizontal: spacing.md, paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  saveBtn:       { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.accent },
  saveBtnText:   { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  catLabel:      { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted },
  catGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  catChip:       { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm,
                   backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  catChipText:   { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
});
