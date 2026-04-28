import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal, TextInput } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFinance } from '../../hooks/FinanceContext';
import { spacing, radius, Colors } from '../../constants/theme';
import { useColors } from '../../hooks/ThemeContext';
import { fmtFull } from '../../lib/format';
import { uid, Goal } from '../../lib/data';
import { PlusIcon, TrashIcon, EditIcon } from '../../components/icons';

function AnimatedArcGauge({ pct, size = 88, stroke = 8 }: { pct: number; size?: number; stroke?: number }) {
  const colors = useColors();
  const r      = (size - stroke * 2) / 2;
  const circ   = 2 * Math.PI * r;
  const center = size / 2;
  const color  = pct >= 1 ? colors.green : pct >= 0.7 ? colors.blue : colors.accent;

  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    setAnimPct(0);
    let frame = 0;
    const target = Math.min(pct, 1);
    const frames = 50;
    const timer = setInterval(() => {
      frame++;
      const t = frame / frames;
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimPct(target * eased);
      if (frame >= frames) { setAnimPct(target); clearInterval(timer); }
    }, 20);
    return () => clearInterval(timer);
  }, [pct]);

  const offset = circ * (1 - animPct);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} fill="none" stroke={colors.border} strokeWidth={stroke} />
        <Circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" rotation="-90" origin={`${center},${center}`} />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_800ExtraBold', color }}>
          {(animPct * 100).toFixed(0)}%
        </Text>
      </View>
    </View>
  );
}

export default function GoalsScreen() {
  const colors = useColors();
  const { goals, setGoals } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Goal | null>(null);
  const [name,      setName]      = useState('');
  const [target,    setTarget]    = useState('');
  const [current,   setCurrent]   = useState('');
  const [deadline,  setDeadline]  = useState('');

  const styles = useMemo(() => makeStyles(colors), [colors]);

  function openNew() {
    setEditing(null); setName(''); setTarget(''); setCurrent(''); setDeadline('');
    setModalOpen(true);
  }

  function openEdit(g: Goal) {
    setEditing(g); setName(g.name); setTarget(String(g.target));
    setCurrent(String(g.current)); setDeadline(g.deadline ?? '');
    setModalOpen(true);
  }

  function save() {
    const t = parseFloat(target), c = parseFloat(current);
    if (!name || isNaN(t) || isNaN(c)) return;
    if (editing) {
      setGoals(goals.map(g => g.id === editing.id
        ? { ...g, name, target: t, current: c, deadline: deadline || undefined }
        : g));
    } else {
      setGoals([...goals, { id: uid(), name, target: t, current: c, deadline: deadline || undefined }]);
    }
    setModalOpen(false);
  }

  function remove(id: string) { setGoals(goals.filter(g => g.id !== id)); }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.heading}>Savings Goals</Text>
        <Pressable onPress={openNew} style={styles.addBtn}>
          <PlusIcon size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Goal</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {goals.length === 0 && <Text style={styles.empty}>No goals yet. Add one to start tracking!</Text>}
        {goals.map(g => {
          const pct = g.target > 0 ? g.current / g.target : 0;
          return (
            <View key={g.id} style={styles.card}>
              <View style={styles.cardTop}>
                <AnimatedArcGauge pct={pct} />
                <View style={styles.cardInfo}>
                  <Text style={styles.goalName}>{g.name}</Text>
                  <Text style={styles.goalProgress}>
                    {fmtFull(g.current)} <Text style={styles.goalOf}>of</Text> {fmtFull(g.target)}
                  </Text>
                  <Text style={styles.goalPct}>{(pct * 100).toFixed(1)}% complete</Text>
                  {g.deadline && <Text style={styles.goalDeadline}>Deadline: {g.deadline}</Text>}
                </View>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => openEdit(g)} style={styles.iconBtn}><EditIcon size={16} color={colors.muted} /></Pressable>
                  <Pressable onPress={() => remove(g.id)} style={styles.iconBtn}><TrashIcon size={16} color={colors.muted} /></Pressable>
                </View>
              </View>
              <View style={styles.progBg}>
                <View style={[styles.progFill, {
                  width: `${Math.min(pct * 100, 100)}%` as any,
                  backgroundColor: pct >= 1 ? colors.green : pct >= 0.7 ? colors.blue : colors.accent,
                }]} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Goal' : 'New Goal'}</Text>
            <TextInput style={styles.input} placeholder="Goal name" placeholderTextColor={colors.muted}
              value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Target amount" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={target} onChangeText={setTarget} />
            <TextInput style={styles.input} placeholder="Current amount" placeholderTextColor={colors.muted}
              keyboardType="numeric" value={current} onChangeText={setCurrent} />
            <TextInput style={styles.input} placeholder="Deadline (YYYY-MM-DD, optional)"
              placeholderTextColor={colors.muted} value={deadline} onChangeText={setDeadline} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{editing ? 'Update' : 'Create'}</Text>
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
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  heading:       { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: colors.text },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.accent },
  addBtnText:    { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#fff' },
  content:       { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xl * 2 },
  empty:         { textAlign: 'center', color: colors.muted, marginTop: spacing.xl, fontFamily: 'PlusJakartaSans_400Regular' },
  card:          { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardTop:       { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardInfo:      { flex: 1, marginLeft: spacing.md },
  goalName:      { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text },
  goalProgress:  { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  goalOf:        { color: colors.muted },
  goalPct:       { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent, marginTop: 2 },
  goalDeadline:  { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: colors.muted, marginTop: 2 },
  cardActions:   { gap: spacing.xs },
  iconBtn:       { padding: 6 },
  progBg:        { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progFill:      { height: 6, borderRadius: 3 },
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
