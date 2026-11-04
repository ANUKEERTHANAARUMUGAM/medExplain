import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/colors';
import { storageService } from '../services/storageService';

const shortcuts = [
  { id: 'explain', title: 'Understand a report', subtitle: 'Lab results, made clear', icon: 'document-text-outline', tint: '#E3F5F0' },
  { id: 'remind', title: 'Medicine routine', subtitle: 'Doses and follow-ups', icon: 'medkit-outline', tint: '#E8EEFF' },
  { id: 'lexicon', title: 'Health library', subtitle: 'Terms, anatomy, medicines', icon: 'book-outline', tint: '#FFF1DD' },
  { id: 'hospitals', title: 'Find care nearby', subtitle: 'Hospitals and emergency lines', icon: 'location-outline', tint: '#FCE9E8' },
];

export const HomeScreen = ({ onNavigate }) => {
  const [name, setName] = useState('there');
  const [reportCount, setReportCount] = useState(0);
  const [medicineCount, setMedicineCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    Promise.all([storageService.getUserProfile(), storageService.getReports(), storageService.getPrescriptions()])
      .then(([profile, reports, prescriptions]) => {
        if (!mounted) return;
        setName((profile.name || 'there').split(' ')[0]);
        setReportCount(reports.length);
        setMedicineCount(prescriptions.flatMap(item => item.medicines || []).length);
      }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topLine}>
        <View>
          <Text style={styles.brand}>MEDEX <Text style={styles.brandDot}>●</Text></Text>
          <Text style={styles.hello}>Good to see you, {name}</Text>
          <Text style={styles.date}>Your health, all in one place</Text>
        </View>
        <TouchableOpacity style={styles.profile} onPress={() => onNavigate('settings')} accessibilityLabel="Open profile and settings">
          <Ionicons name="person-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={styles.eyebrow}><Ionicons name="heart" size={13} color="#B8F2E5" /><Text style={styles.eyebrowText}>CARE THAT CONNECTS</Text></View>
          <Text style={styles.heroTitle}>A clearer view{ '\n' }of your health.</Text>
          <Text style={styles.heroBody}>Understand reports, stay on track, and find care with confidence.</Text>
          <TouchableOpacity style={styles.heroButton} onPress={() => onNavigate('explain')}>
            <Text style={styles.heroButtonText}>Explore your health</Text><Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
          </TouchableOpacity>
        </View>
        <View style={styles.heartArt}>
          <View style={styles.heartRing}><Ionicons name="heart" size={42} color="#D5FFF2" /></View>
          <View style={styles.pulseLine}><View style={styles.pulseSegment} /></View>
          <View style={styles.artDot} />
        </View>
        <View style={styles.heroOrb} />
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your health snapshot</Text><TouchableOpacity onPress={() => onNavigate('settings')}><Text style={styles.seeAll}>Profile <Ionicons name="chevron-forward" size={12} /></Text></TouchableOpacity></View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: '#E2F4EE' }]}><Ionicons name="document-text-outline" size={18} color={colors.primary} /></View><Text style={styles.statValue}>{reportCount}</Text><Text style={styles.statLabel}>Saved reports</Text></View>
        <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: '#EAEFFF' }]}><Ionicons name="medkit-outline" size={18} color={colors.secondary} /></View><Text style={styles.statValue}>{medicineCount}</Text><Text style={styles.statLabel}>Medicine entries</Text></View>
        <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: '#FFF2DE' }]}><Ionicons name="shield-checkmark-outline" size={18} color={colors.warning} /></View><Text style={styles.statValue}>24/7</Text><Text style={styles.statLabel}>Care finder</Text></View>
      </View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Explore MedEx</Text><Text style={styles.sectionHint}>Made for your everyday care</Text></View>
      <View style={styles.featureGrid}>
        {shortcuts.map(item => <TouchableOpacity key={item.id} style={styles.featureCard} onPress={() => onNavigate(item.id)} activeOpacity={0.78}>
          <View style={[styles.featureIcon, { backgroundColor: item.tint }]}><Ionicons name={item.icon} size={21} color={colors.primaryDark} /></View>
          <Text style={styles.featureTitle}>{item.title}</Text><Text style={styles.featureSubtitle}>{item.subtitle}</Text>
          <View style={styles.featureArrow}><Ionicons name="arrow-up-right" size={17} color={colors.primary} /></View>
        </TouchableOpacity>)}
      </View>
      <View style={styles.note}><Ionicons name="information-circle-outline" size={17} color={colors.primary} /><Text style={styles.noteText}>MedEx supports informed conversations with your care team. It does not replace professional medical advice.</Text></View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' }, content: { padding: spacing.md, paddingBottom: 28, maxWidth: 760, width: '100%', alignSelf: 'center' },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  brand: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 2 }, brandDot: { color: '#8ACCB9', fontSize: 8 }, hello: { marginTop: 8, fontSize: 25, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.6 }, date: { marginTop: 3, color: colors.textSecondary, fontSize: 13 },
  profile: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  hero: { minHeight: 226, borderRadius: 26, backgroundColor: '#0E625D', overflow: 'hidden', padding: 21, marginBottom: 23, flexDirection: 'row', alignItems: 'center' }, heroCopy: { flex: 1, zIndex: 2, maxWidth: 400 }, eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, eyebrowText: { color: '#B8F2E5', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 }, heroTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 31, fontWeight: '800', marginTop: 12, letterSpacing: -0.6 }, heroBody: { color: '#D1EAE5', fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 285 }, heroButton: { alignSelf: 'flex-start', marginTop: 15, backgroundColor: '#D7F5EB', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 }, heroButtonText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  heartArt: { width: 90, height: 112, alignItems: 'center', justifyContent: 'center', zIndex: 1 }, heartRing: { width: 74, height: 74, borderRadius: 37, borderWidth: 1, borderColor: 'rgba(215,245,235,0.42)', backgroundColor: 'rgba(215,245,235,0.12)', alignItems: 'center', justifyContent: 'center' }, pulseLine: { width: 102, height: 2, position: 'absolute', top: 57, backgroundColor: 'rgba(178,239,219,0.65)' }, pulseSegment: { width: 20, height: 7, backgroundColor: '#B8F2E5', transform: [{ skewX: '-30deg' }] }, artDot: { position: 'absolute', right: 2, top: 2, width: 8, height: 8, borderRadius: 5, backgroundColor: '#B8F2E5' }, heroOrb: { position: 'absolute', width: 240, height: 240, borderRadius: 120, right: -100, top: -105, backgroundColor: 'rgba(147,223,202,0.13)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }, sectionTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 16 }, sectionHint: { color: colors.textMuted, fontSize: 10 }, seeAll: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 24 }, statCard: { flex: 1, minHeight: 98, padding: 11, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border }, statIcon: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, statValue: { color: colors.textPrimary, fontWeight: '800', fontSize: 18, marginTop: 7 }, statLabel: { color: colors.textSecondary, fontSize: 10, marginTop: 1 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, featureCard: { width: '48.5%', flexGrow: 1, minHeight: 126, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 13, position: 'relative' }, featureIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }, featureTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '800' }, featureSubtitle: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 3, paddingRight: 12 }, featureArrow: { position: 'absolute', top: 13, right: 12 },
  note: { marginTop: 17, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.75)', flexDirection: 'row', alignItems: 'flex-start', gap: 7 }, noteText: { color: colors.textSecondary, flex: 1, fontSize: 10, lineHeight: 15 },
});
