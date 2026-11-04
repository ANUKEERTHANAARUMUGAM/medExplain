/**
 * ProvidersTab.js
 * Sub-menu 1: Lists insurance providers fetched from Supabase,
 * with expandable plan + benefit + pricing + restriction details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { insuranceService, PROVIDER_TYPE_META } from '../services/insuranceService';
import { Ionicons } from '@expo/vector-icons';

// ─── Filter chip list ───────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',        label: 'All'        },
  { key: 'government', label: 'Government' },
  { key: 'private',    label: 'Private'    },
  { key: 'psu',        label: 'PSU'        },
];

// ─── Single plan row inside a provider card ──────────────────────────────────
const PlanRow = ({ plan, providerType }) => {
  const [open, setOpen] = useState(false);
  const meta = PROVIDER_TYPE_META[providerType] || PROVIDER_TYPE_META.private;
  const pricing = plan.pricing;

  const fmt = val =>
    val !== undefined && val !== null ? `₹${Number(val).toLocaleString('en-IN')}` : '—';

  return (
    <View style={[planStyles.wrapper, { borderLeftColor: meta.color }]}>
      {/* Plan header */}
      <TouchableOpacity
        style={planStyles.header}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.75}
      >
        <View style={planStyles.headerLeft}>
          <Text style={planStyles.planName}>{plan.plan_name}</Text>
          <View style={planStyles.tagRow}>
            <View style={[planStyles.tag, { backgroundColor: meta.badgeBg }]}>
              <Text style={[planStyles.tagText, { color: meta.badgeColor }]}>{plan.plan_type}</Text>
            </View>
            {plan.network_size_tier ? (
              <View style={planStyles.networkTag}>
                <Ionicons name="git-network-outline" size={10} color={colors.textMuted} />
                <Text style={planStyles.networkText}>{plan.network_size_tier} Network</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={meta.color}
        />
      </TouchableOpacity>

      {/* Expanded details */}
      {open && (
        <View style={planStyles.details}>
          {/* Pricing */}
          {pricing && (
            <View style={planStyles.section}>
              <View style={planStyles.sectionHeader}>
                <Ionicons name="cash-outline" size={13} color={colors.primary} />
                <Text style={planStyles.sectionTitle}>Pricing</Text>
              </View>
              <View style={planStyles.pricingGrid}>
                {[
                  { label: 'Base Premium', val: fmt(pricing.base_premium_amount) },
                  { label: 'Ind. Deductible', val: fmt(pricing.individual_deductible) },
                  { label: 'Family Deductible', val: fmt(pricing.family_deductible) },
                  { label: 'Out-of-Pocket Max', val: fmt(pricing.out_of_pocket_maximum) },
                  { label: 'Co-pay', val: fmt(pricing.copay_amount) },
                ].map(item => (
                  <View key={item.label} style={planStyles.pricingItem}>
                    <Text style={planStyles.pricingLabel}>{item.label}</Text>
                    <Text style={planStyles.pricingVal}>{item.val}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Benefits */}
          {plan.benefits?.length > 0 && (
            <View style={planStyles.section}>
              <View style={planStyles.sectionHeader}>
                <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
                <Text style={planStyles.sectionTitle}>Benefits</Text>
              </View>
              {plan.benefits.map((b, i) => (
                <View key={i} style={planStyles.benefitRow}>
                  <Ionicons
                    name={b.is_essential ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={14}
                    color={b.is_essential ? colors.success : colors.textMuted}
                  />
                  <View style={planStyles.benefitText}>
                    <Text style={planStyles.benefitName}>{b.benefit_name}</Text>
                    <Text style={planStyles.benefitDetail}>{b.coverage_details}</Text>
                  </View>
                  {b.is_essential && (
                    <View style={planStyles.essentialBadge}>
                      <Text style={planStyles.essentialText}>Core</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Restrictions */}
          {plan.restrictions?.length > 0 && (
            <View style={planStyles.section}>
              <View style={planStyles.sectionHeader}>
                <Ionicons name="alert-circle-outline" size={13} color={colors.warning} />
                <Text style={planStyles.sectionTitle}>Restrictions</Text>
              </View>
              {plan.restrictions.map((r, i) => (
                <View key={i} style={planStyles.restrictionRow}>
                  <View style={planStyles.restrictionType}>
                    <Text style={planStyles.restrictionTypeText}>{r.restriction_type}</Text>
                  </View>
                  <Text style={planStyles.restrictionDesc}>{r.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Provider card ────────────────────────────────────────────────────────────
const ProviderCard = ({ provider }) => {
  const [expanded, setExpanded] = useState(false);
  const type = provider.type || 'private';
  const meta = PROVIDER_TYPE_META[type] || PROVIDER_TYPE_META.private;

  const handleCall = () => {
    if (!provider.contact_info) return;
    const num = provider.contact_info.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${num}`).catch(() =>
      Alert.alert('Error', 'Unable to initiate call.')
    );
  };

  return (
    <View style={[cardStyles.card, { borderLeftColor: meta.color, borderLeftWidth: 4 }]}>
      {/* Header */}
      <View style={cardStyles.header}>
        <View style={[cardStyles.iconBox, { backgroundColor: meta.colorLight }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>

        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>{provider.provider_name}</Text>
          {provider.contact_info ? (
            <View style={cardStyles.contactRow}>
              <Ionicons name="call-outline" size={11} color={colors.textMuted} />
              <Text style={cardStyles.contactText}>{provider.contact_info}</Text>
            </View>
          ) : null}
        </View>

        <View style={cardStyles.rightCol}>
          <View style={[cardStyles.typeBadge, { backgroundColor: meta.badgeBg }]}>
            <Text style={[cardStyles.typeText, { color: meta.badgeColor }]}>{meta.label}</Text>
          </View>
          <Text style={cardStyles.planCount}>
            {provider.plans?.length || 0} plan{provider.plans?.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Action row */}
      <View style={cardStyles.actionRow}>
        <TouchableOpacity
          style={[cardStyles.callBtn, { backgroundColor: meta.color }]}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={13} color="#fff" />
          <Text style={cardStyles.callBtnText}>Helpline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={cardStyles.expandBtn}
          onPress={() => setExpanded(e => !e)}
          activeOpacity={0.8}
        >
          <Text style={[cardStyles.expandBtnText, { color: meta.color }]}>
            {expanded ? 'Hide Plans' : 'View Plans'}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={meta.color}
          />
        </TouchableOpacity>
      </View>

      {/* Plans */}
      {expanded && provider.plans?.length > 0 && (
        <View style={cardStyles.plansWrapper}>
          {provider.plans.map(plan => (
            <PlanRow key={plan.plan_id} plan={plan} providerType={type} />
          ))}
        </View>
      )}

      {expanded && (!provider.plans || provider.plans.length === 0) && (
        <View style={cardStyles.noPlans}>
          <Text style={cardStyles.noPlansText}>No plans listed for this provider.</Text>
        </View>
      )}
    </View>
  );
};

// ─── Main tab component ───────────────────────────────────────────────────────
export const ProvidersTab = () => {
  const [providers, setProviders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearch]    = useState('');
  const [filterType, setFilter]     = useState('all');
  const [error, setError]           = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await insuranceService.getProviders({ searchQuery, filterType });
      setProviders(data);
    } catch (e) {
      setError('Failed to load providers. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterType]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={tabStyles.container}>
      {/* Search */}
      <View style={tabStyles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={tabStyles.searchInput}
          placeholder="Search provider or plan…"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => load()}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={tabStyles.chipScroll}
        contentContainerStyle={tabStyles.chipContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[tabStyles.chip, filterType === f.key && tabStyles.chipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[tabStyles.chipText, filterType === f.key && tabStyles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={tabStyles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={tabStyles.loadingText}>Loading providers…</Text>
        </View>
      ) : error ? (
        <View style={tabStyles.centered}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
          <Text style={tabStyles.errorText}>{error}</Text>
          <TouchableOpacity style={tabStyles.retryBtn} onPress={() => load()}>
            <Text style={tabStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={tabStyles.list}
          contentContainerStyle={tabStyles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Text style={tabStyles.resultsCount}>
            {providers.length} provider{providers.length !== 1 ? 's' : ''} found
          </Text>

          {providers.length === 0 ? (
            <View style={tabStyles.empty}>
              <Ionicons name="business-outline" size={36} color={colors.textMuted} />
              <Text style={tabStyles.emptyTitle}>No Providers Found</Text>
              <Text style={tabStyles.emptySub}>Try a different search or filter.</Text>
            </View>
          ) : (
            providers.map(p => <ProviderCard key={p.provider_id} provider={p} />)
          )}

          {/* Tips */}
          <View style={tabStyles.tips}>
            <View style={tabStyles.tipsTitleRow}>
              <Ionicons name="bulb" size={15} color={colors.warning} />
              <Text style={tabStyles.tipsTitle}>Smart Tips</Text>
            </View>
            {insuranceService.getTips().map((t, i) => (
              <View key={i} style={tabStyles.tipRow}>
                <Ionicons name={t.icon} size={14} color={colors.primary} />
                <Text style={tabStyles.tipText}>{t.text}</Text>
              </View>
            ))}
          </View>

          <Text style={tabStyles.disclaimer}>
            ⚠ Data is indicative. Verify details with the insurer before purchasing.
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  container:    { flex: 1 },
  searchBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, margin: spacing.md, marginBottom: spacing.xs },
  searchInput:  { flex: 1, fontSize: 13, color: colors.textPrimary },
  chipScroll:   { maxHeight: 42 },
  chipContent:  { paddingHorizontal: spacing.md, paddingBottom: spacing.xs, gap: 6 },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, marginRight: 6 },
  chipActive:   { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:     { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.textWhite, fontWeight: '700' },
  list:         { flex: 1 },
  listContent:  { padding: spacing.md, paddingTop: spacing.sm, paddingBottom: 48 },
  resultsCount: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingText:  { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  errorText:    { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  retryBtn:     { marginTop: spacing.md, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: borderRadius.full },
  retryText:    { fontSize: 13, fontWeight: '700', color: colors.textWhite },
  empty:        { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.bgCard, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  emptyTitle:   { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  emptySub:     { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tips:         { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border },
  tipsTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  tipsTitle:    { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginLeft: 6 },
  tipRow:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  tipText:      { flex: 1, fontSize: 12, color: colors.textSecondary, marginLeft: 8, lineHeight: 17 },
  disclaimer:   { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, lineHeight: 14 },
});

const cardStyles = StyleSheet.create({
  card:         { backgroundColor: colors.bgCard, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  header:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  iconBox:      { width: 42, height: 42, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  info:         { flex: 1 },
  name:         { fontSize: 14, fontWeight: '800', color: colors.textPrimary, lineHeight: 20 },
  contactRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  contactText:  { fontSize: 11, color: colors.textSecondary, marginLeft: 4 },
  rightCol:     { alignItems: 'flex-end' },
  typeBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  typeText:     { fontSize: 10, fontWeight: '800' },
  planCount:    { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  actionRow:    { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  callBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, marginRight: spacing.sm },
  callBtnText:  { fontSize: 12, fontWeight: '700', color: '#fff', marginLeft: 5 },
  expandBtn:    { flexDirection: 'row', alignItems: 'center' },
  expandBtnText:{ fontSize: 12, fontWeight: '700', marginRight: 4 },
  plansWrapper: { marginTop: spacing.sm },
  noPlans:      { paddingTop: spacing.sm, alignItems: 'center' },
  noPlansText:  { fontSize: 12, color: colors.textMuted },
});

const planStyles = StyleSheet.create({
  wrapper:      { borderLeftWidth: 3, borderRadius: borderRadius.sm, backgroundColor: colors.bgMuted, marginBottom: spacing.xs, overflow: 'hidden' },
  header:       { flexDirection: 'row', alignItems: 'center', padding: spacing.sm },
  headerLeft:   { flex: 1 },
  planName:     { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  tagRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  tag:          { paddingHorizontal: 7, paddingVertical: 2, borderRadius: borderRadius.full },
  tagText:      { fontSize: 9, fontWeight: '800' },
  networkTag:   { flexDirection: 'row', alignItems: 'center' },
  networkText:  { fontSize: 9, color: colors.textMuted, marginLeft: 3 },
  details:      { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  section:      { marginTop: spacing.sm },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.textPrimary, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  pricingGrid:  { flexDirection: 'row', flexWrap: 'wrap' },
  pricingItem:  { width: '50%', paddingVertical: 4 },
  pricingLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  pricingVal:   { fontSize: 12, fontWeight: '800', color: colors.textPrimary, marginTop: 1 },
  benefitRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  benefitText:  { flex: 1, marginLeft: 6 },
  benefitName:  { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  benefitDetail:{ fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  essentialBadge:{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.full, alignSelf: 'flex-start' },
  essentialText: { fontSize: 9, fontWeight: '800', color: '#065F46' },
  restrictionRow:{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  restrictionType:{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.full, marginRight: 6, alignSelf: 'flex-start' },
  restrictionTypeText:{ fontSize: 9, fontWeight: '800', color: '#B45309' },
  restrictionDesc:{ flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
});

