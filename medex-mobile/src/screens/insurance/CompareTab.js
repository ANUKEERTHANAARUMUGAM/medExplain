/**
 * CompareTab.js
 * Sub-menu 2: Plan comparison tool.
 * User selects up to 3 plans, then sees a side-by-side comparison table
 * covering pricing, benefits, and restrictions fetched from Supabase.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { insuranceService, PROVIDER_TYPE_META } from '../services/insuranceService';
import { Ionicons } from '@expo/vector-icons';

const MAX_COMPARE = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = val =>
  val !== undefined && val !== null && val !== '' ? `₹${Number(val).toLocaleString('en-IN')}` : '—';

const Check = ({ yes }) => (
  <Ionicons
    name={yes ? 'checkmark-circle' : 'close-circle'}
    size={16}
    color={yes ? colors.success : colors.danger}
  />
);

// ─── Plan selector pill ───────────────────────────────────────────────────────
const PlanPill = ({ plan, selected, onToggle }) => {
  const meta = PROVIDER_TYPE_META[plan.provider_type] || PROVIDER_TYPE_META.private;
  return (
    <TouchableOpacity
      style={[pillStyles.pill, selected && { borderColor: meta.color, backgroundColor: meta.colorLight }]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={pillStyles.left}>
        <Ionicons name={meta.icon} size={14} color={selected ? meta.color : colors.textMuted} />
        <View style={pillStyles.text}>
          <Text style={[pillStyles.planName, selected && { color: meta.color }]} numberOfLines={1}>
            {plan.plan_name}
          </Text>
          <Text style={pillStyles.provName} numberOfLines={1}>{plan.provider_name}</Text>
        </View>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'add-circle-outline'}
        size={18}
        color={selected ? meta.color : colors.textMuted}
      />
    </TouchableOpacity>
  );
};

// ─── Comparison table ─────────────────────────────────────────────────────────
const ComparisonTable = ({ plans }) => {
  const colColors = ['#0D9488', '#6366F1', '#F59E0B'];

  const Cell = ({ children, colIdx, header = false }) => (
    <View style={[tblStyles.cell, header && { backgroundColor: colColors[colIdx] + '15' }]}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={[tblStyles.cellText, header && { fontWeight: '800', color: colColors[colIdx] }]}>
          {children}
        </Text>
      ) : children}
    </View>
  );

  const Row = ({ label, icon, children }) => (
    <View style={tblStyles.row}>
      <View style={tblStyles.labelCell}>
        <Ionicons name={icon} size={12} color={colors.textMuted} />
        <Text style={tblStyles.labelText}>{label}</Text>
      </View>
      {children}
    </View>
  );

  const SectionHead = ({ title }) => (
    <View style={tblStyles.sectionHead}>
      <Text style={tblStyles.sectionHeadText}>{title}</Text>
    </View>
  );

  // Collect all unique benefit names across selected plans
  const allBenefits = [...new Set(
    plans.flatMap(p => (p.benefits || []).map(b => b.benefit_name))
  )];

  // Collect all unique restriction types
  const allRestrictions = [...new Set(
    plans.flatMap(p => (p.restrictions || []).map(r => r.restriction_type))
  )];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={tblStyles.table}>
        {/* Column headers */}
        <View style={tblStyles.row}>
          <View style={[tblStyles.labelCell, { backgroundColor: '#0F172A' }]}>
            <Text style={{ color: colors.textWhite, fontSize: 10, fontWeight: '700' }}>Plan</Text>
          </View>
          {plans.map((p, i) => (
            <View key={i} style={[tblStyles.cell, { backgroundColor: colColors[i] }]}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }} numberOfLines={2}>
                {p.plan_name}
              </Text>
              <Text style={{ color: '#fff', fontSize: 9, opacity: 0.85, marginTop: 2 }} numberOfLines={1}>
                {p.provider_name}
              </Text>
            </View>
          ))}
        </View>

        {/* Plan type */}
        <Row label="Type" icon="list-outline">
          {plans.map((p, i) => <Cell key={i} colIdx={i}>{p.plan_type || '—'}</Cell>)}
        </Row>

        {/* Network tier */}
        <Row label="Network Size" icon="git-network-outline">
          {plans.map((p, i) => <Cell key={i} colIdx={i}>{p.network_size_tier || '—'}</Cell>)}
        </Row>

        {/* ── PRICING ── */}
        <SectionHead title="💰  Pricing" />

        <Row label="Base Premium" icon="cash-outline">
          {plans.map((p, i) => <Cell key={i} colIdx={i}>{fmt(p.pricing?.base_premium_amount)}</Cell>)}
        </Row>
        <Row label="Ind. Deductible" icon="remove-circle-outline">
          {plans.map((p, i) => <Cell key={i} colIdx={i}>{fmt(p.pricing?.individual_deductible)}</Cell>)}
        </Row>
        <Row label="Family Deductible" icon="people-outline">
          {plans.map((p, i) => <Cell key={i} colIdx={i}>{fmt(p.pricing?.family_deductible)}</Cell>)}
        </Row>
        <Row label="Out-of-Pocket Max" icon="wallet-outline">
          {plans.map((p, i) => <Cell key={i} colIdx={i}>{fmt(p.pricing?.out_of_pocket_maximum)}</Cell>)}
        </Row>
        <Row label="Co-pay" icon="receipt-outline">
          {plans.map((p, i) => <Cell key={i} colIdx={i}>{fmt(p.pricing?.copay_amount)}</Cell>)}
        </Row>

        {/* ── BENEFITS ── */}
        {allBenefits.length > 0 && (
          <>
            <SectionHead title="✅  Benefits" />
            {allBenefits.map(bName => (
              <Row key={bName} label={bName} icon="checkmark-circle-outline">
                {plans.map((p, i) => {
                  const benefit = p.benefits?.find(b => b.benefit_name === bName);
                  return (
                    <Cell key={i} colIdx={i}>
                      {benefit ? (
                        <View style={{ alignItems: 'center' }}>
                          <Check yes />
                          <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }} numberOfLines={2}>
                            {benefit.coverage_details}
                          </Text>
                        </View>
                      ) : (
                        <Check yes={false} />
                      )}
                    </Cell>
                  );
                })}
              </Row>
            ))}
          </>
        )}

        {/* ── RESTRICTIONS ── */}
        {allRestrictions.length > 0 && (
          <>
            <SectionHead title="⚠️  Restrictions" />
            {allRestrictions.map(rType => (
              <Row key={rType} label={rType} icon="alert-circle-outline">
                {plans.map((p, i) => {
                  const r = p.restrictions?.find(x => x.restriction_type === rType);
                  return (
                    <Cell key={i} colIdx={i}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center' }}>
                        {r?.description || '—'}
                      </Text>
                    </Cell>
                  );
                })}
              </Row>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
};

// ─── Main tab component ───────────────────────────────────────────────────────
export const CompareTab = () => {
  const [allPlans, setAllPlans]       = useState([]);
  const [selected, setSelected]       = useState([]);   // array of plan objects
  const [loading, setLoading]         = useState(true);
  const [showCompare, setShowCompare] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const plans = await insuranceService.getPlansForComparison();
      setAllPlans(plans);
    } catch {
      setAllPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const togglePlan = plan => {
    setSelected(prev => {
      const isSelected = prev.some(p => p.plan_id === plan.plan_id);
      if (isSelected) return prev.filter(p => p.plan_id !== plan.plan_id);
      if (prev.length >= MAX_COMPARE) return prev; // max 3
      return [...prev, plan];
    });
    setShowCompare(false);
  };

  const isSelected = plan => selected.some(p => p.plan_id === plan.plan_id);

  return (
    <View style={cmpStyles.container}>
      {loading ? (
        <View style={cmpStyles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={cmpStyles.loadingText}>Loading plans…</Text>
        </View>
      ) : (
        <ScrollView
          style={cmpStyles.scroll}
          contentContainerStyle={cmpStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Instructions banner */}
          <View style={cmpStyles.banner}>
            <Ionicons name="git-compare-outline" size={18} color={colors.secondary} />
            <Text style={cmpStyles.bannerText}>
              Select up to {MAX_COMPARE} plans to compare side-by-side.
            </Text>
          </View>

          {/* Selection counter + Compare button */}
          <View style={cmpStyles.selectionRow}>
            <Text style={cmpStyles.selectionLabel}>
              {selected.length} of {MAX_COMPARE} selected
            </Text>
            <View style={cmpStyles.selectionPills}>
              {selected.map((p, i) => {
                const meta = PROVIDER_TYPE_META[p.provider_type] || PROVIDER_TYPE_META.private;
                return (
                  <TouchableOpacity
                    key={p.plan_id}
                    style={[cmpStyles.selectedChip, { backgroundColor: meta.colorLight, borderColor: meta.color }]}
                    onPress={() => togglePlan(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[cmpStyles.selectedChipText, { color: meta.color }]} numberOfLines={1}>
                      {p.plan_name}
                    </Text>
                    <Ionicons name="close-circle" size={13} color={meta.color} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {selected.length >= 2 && (
              <TouchableOpacity
                style={cmpStyles.compareBtn}
                onPress={() => setShowCompare(s => !s)}
                activeOpacity={0.8}
              >
                <Ionicons name="git-compare" size={14} color="#fff" />
                <Text style={cmpStyles.compareBtnText}>
                  {showCompare ? 'Hide Table' : 'Compare'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Comparison table ── */}
          {showCompare && selected.length >= 2 && (
            <View style={cmpStyles.tableCard}>
              <View style={cmpStyles.tableHeader}>
                <Ionicons name="analytics-outline" size={16} color={colors.primary} />
                <Text style={cmpStyles.tableTitle}>Plan Comparison</Text>
              </View>
              <ComparisonTable plans={selected} />
              <Text style={cmpStyles.tableDisclaimer}>
                Scroll horizontally · Data sourced from Supabase / fallback data
              </Text>
            </View>
          )}

          {/* ── Plan picker ── */}
          <Text style={cmpStyles.sectionLabel}>All Plans</Text>
          {allPlans.length === 0 ? (
            <View style={cmpStyles.empty}>
              <Ionicons name="shield-outline" size={36} color={colors.textMuted} />
              <Text style={cmpStyles.emptyText}>No plans available.</Text>
            </View>
          ) : (
            allPlans.map(plan => (
              <PlanPill
                key={plan.plan_id}
                plan={plan}
                selected={isSelected(plan)}
                onToggle={() => togglePlan(plan)}
              />
            ))
          )}

          {selected.length === MAX_COMPARE && (
            <View style={cmpStyles.maxNote}>
              <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
              <Text style={cmpStyles.maxNoteText}>
                Maximum {MAX_COMPARE} plans selected. Remove one to add another.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const pillStyles = StyleSheet.create({
  pill:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: 8 },
  left:       { flexDirection: 'row', alignItems: 'center', flex: 1 },
  text:       { flex: 1, marginLeft: 8 },
  planName:   { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  provName:   { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});

const cmpStyles = StyleSheet.create({
  container:       { flex: 1 },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:     { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  scroll:          { flex: 1 },
  scrollContent:   { padding: spacing.md, paddingBottom: 48 },
  banner:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: '#C7D2FE' },
  bannerText:      { flex: 1, fontSize: 12, color: colors.secondary, marginLeft: 8, fontWeight: '500' },
  selectionRow:    { marginBottom: spacing.sm },
  selectionLabel:  { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  selectionPills:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  selectedChip:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.full, borderWidth: 1.5, maxWidth: 180 },
  selectedChipText:{ fontSize: 11, fontWeight: '700', marginRight: 4, flex: 1 },
  compareBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 9, borderRadius: borderRadius.full },
  compareBtnText:  { fontSize: 13, fontWeight: '700', color: '#fff', marginLeft: 6 },
  tableCard:       { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, overflow: 'hidden' },
  tableHeader:     { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableTitle:      { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginLeft: 6 },
  tableDisclaimer: { fontSize: 9, color: colors.textMuted, textAlign: 'center', paddingVertical: 6 },
  sectionLabel:    { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  empty:           { alignItems: 'center', padding: spacing.xl },
  emptyText:       { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  maxNote:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: borderRadius.sm, padding: spacing.sm, borderWidth: 1, borderColor: '#FDE68A', marginTop: spacing.sm },
  maxNoteText:     { flex: 1, fontSize: 11, color: '#B45309', marginLeft: 6 },
});

const tblStyles = StyleSheet.create({
  table:        { minWidth: 320 },
  row:          { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  labelCell:    { width: 110, padding: 8, justifyContent: 'center', backgroundColor: colors.bgHighlight, flexDirection: 'row', alignItems: 'center' },
  labelText:    { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginLeft: 4, flex: 1 },
  cell:         { width: 130, padding: 8, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: colors.border },
  cellText:     { fontSize: 11, color: colors.textPrimary, textAlign: 'center' },
  sectionHead:  { backgroundColor: '#0F172A', padding: 8 },
  sectionHeadText:{ fontSize: 11, fontWeight: '800', color: colors.textWhite, letterSpacing: 0.5 },
});

