import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Modal,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFinance } from '../hooks/FinanceContext';
import { spacing, radius, Colors } from '../constants/theme';
import { useColors } from '../hooks/ThemeContext';
import { EXPENSE_CATS, INCOME_CATS } from '../constants/categories';
import { Transaction, uid } from '../lib/data';

export default function AddModal() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { modalVisible, editItem, closeModal, addTxn, editTxn, currency, customCats } = useFinance();

  const [type, setType]       = useState<'expense' | 'income'>('expense');
  const [amount, setAmount]   = useState('');
  const [category, setCat]    = useState('food');
  const [desc, setDesc]       = useState('');
  const [date, setDate]       = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes]     = useState('');
  const [tags, setTags]       = useState('');

  useEffect(() => {
    if (editItem) {
      setType(editItem.type as 'expense' | 'income');
      setAmount(String(editItem.amount));
      setCat(editItem.category);
      setDesc(editItem.description);
      setDate(editItem.date);
      setNotes(editItem.notes ?? '');
      setTags((editItem.tags ?? []).join(', '));
    } else {
      setType('expense'); setAmount(''); setCat('food');
      setDesc(''); setDate(new Date().toISOString().slice(0, 10));
      setNotes(''); setTags('');
    }
  }, [editItem, modalVisible]);

  const defaultCats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const cats = [
    ...defaultCats,
    ...customCats.filter(c => c.txnType === type),
  ];

  function handleSave() {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) return;
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    const txnData = { type, amount: amt, category, description: desc.trim(), date, notes, tags: tagArr };
    if (editItem) {
      editTxn({ ...editItem, ...txnData });
    } else {
      addTxn(txnData);
    }
    closeModal();
  }

  return (
    <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{editItem ? 'Edit Transaction' : 'Add Transaction'}</Text>

          {/* Type toggle */}
          <View style={styles.typeToggle}>
            {(['expense', 'income'] as const).map(v => (
              <Pressable key={v} onPress={() => { setType(v); setCat(v === 'expense' ? 'food' : 'salary'); }}
                style={[styles.typeBtn, type === v && (v === 'expense' ? styles.typeBtnExpense : styles.typeBtnIncome)]}>
                <Text style={[styles.typeBtnText, type === v && { color: v === 'expense' ? colors.red : colors.green }]}>
                  {v === 'expense' ? '↑ Expense' : '↓ Income'}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Amount */}
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>{currency.symbol}</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.muted + '80'}
              />
            </View>

            {/* Category chips */}
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <View style={styles.catRow}>
                {cats.map(c => (
                  <Pressable key={c.id} onPress={() => setCat(c.id)}
                    style={[styles.catChip, category === c.id && { backgroundColor: c.color + '33', borderColor: c.color }]}>
                    <Text style={[styles.catChipText, category === c.id && { color: c.color }]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Description */}
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput style={styles.input} value={desc} onChangeText={setDesc}
              placeholder="What's this for?" placeholderTextColor={colors.muted} />

            {/* Date */}
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} />

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput style={[styles.input, styles.inputMulti]} value={notes} onChangeText={setNotes}
              placeholder="Any additional notes…" placeholderTextColor={colors.muted} multiline numberOfLines={2} />

            {/* Tags */}
            <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
            <TextInput style={styles.input} value={tags} onChangeText={setTags}
              placeholder="e.g. groceries, weekly" placeholderTextColor={colors.muted} />

            <View style={styles.actions}>
              <Pressable onPress={closeModal} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveText}>{editItem ? 'Update' : 'Add'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors: Colors) { return StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(13,16,48,0.4)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
                     padding: spacing.lg, maxHeight: '90%',
                     shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
                     shadowOpacity: 0.08, shadowRadius: 20, elevation: 12 },
  handle:          { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2,
                     alignSelf: 'center', marginBottom: spacing.md },
  title:           { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text, marginBottom: spacing.md },
  typeToggle:      { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radius.pill,
                     padding: 4, marginBottom: spacing.md },
  typeBtn:         { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  typeBtnExpense:  { backgroundColor: colors.redDim },
  typeBtnIncome:   { backgroundColor: colors.greenDim },
  typeBtnText:     { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted },
  fieldLabel:      { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.muted,
                     textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4, marginTop: spacing.sm },
  amountRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                     paddingVertical: spacing.sm, marginBottom: spacing.sm },
  currencySymbol:  { fontSize: 28, fontFamily: 'PlusJakartaSans_700Bold', color: colors.muted, marginRight: 8 },
  amountInput:     { fontSize: 44, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text,
                     minWidth: 120, textAlign: 'center' },
  input:           { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1,
                     borderColor: colors.border, color: colors.text, padding: spacing.sm, fontSize: 15,
                     fontFamily: 'PlusJakartaSans_400Regular' },
  inputMulti:      { minHeight: 60, textAlignVertical: 'top' },
  catScroll:       { marginBottom: spacing.xs },
  catRow:          { flexDirection: 'row', gap: spacing.xs, paddingBottom: spacing.xs },
  catChip:         { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.xl,
                     backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  catChipText:     { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  actions:         { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm,
                     marginTop: spacing.lg, marginBottom: spacing.md },
  cancelBtn:       { paddingHorizontal: spacing.md, paddingVertical: 12 },
  cancelText:      { fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted },
  saveBtn:         { paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: radius.md,
                     backgroundColor: colors.accent },
  saveText:        { fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' },
}); }
