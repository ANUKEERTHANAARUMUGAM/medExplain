import React, { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Header } from '../components/Header';
import { TermCard } from '../components/TermCard';
import { Badge } from '../components/Badge';
import { fetchBodyParts, fetchMedicines, fetchTerms } from '../services/medicineService';
import { Ionicons } from '@expo/vector-icons';

// Case-insensitive A→Z (or Z→A when desc) by the given name field
const sortByName = (list, key, desc) =>
  [...list].sort((a, b) =>
    (desc ? -1 : 1) * a[key].localeCompare(b[key], 'en', { sensitivity: 'base' })
  );

export const MedLexiconScreen = () => {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms', 'body', 'meds'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]); // applied filter; empty = all
  const [draftCategories, setDraftCategories] = useState([]); // selections inside the sheet
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [sortDesc, setSortDesc] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [terms, setTerms] = useState([]);
  const [bodyParts, setBodyParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchMedicines(), fetchTerms(), fetchBodyParts()])
      .then(([meds, termRows, bodyRows]) => {
        if (!active) return;
        setMedicines(meds);
        setTerms(termRows);
        setBodyParts(bodyRows);
      })
      .catch(e => { if (active) setLoadError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Category chips come from the categories joined onto the fetched terms
  const categories = useMemo(
    () => [...new Set(terms.map(t => t.category).filter(Boolean))],
    [terms]
  );

  // Filter terms
  const filteredTerms = sortByName(terms.filter(item => {
    const matchesSearch = 
      item.english_term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tamil_term.includes(searchQuery) ||
      (item.tamil_transliteration && item.tamil_transliteration.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.simple_english.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = selectedCategories.length === 0 || selectedCategories.includes(item.category);
    return matchesSearch && matchesCat;
  }), 'english_term', sortDesc);

  // Filter body parts
  const filteredBodyParts = sortByName(bodyParts.filter(bp =>
    bp.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bp.name_ta.includes(searchQuery) ||
    (bp.body_system && bp.body_system.toLowerCase().includes(searchQuery.toLowerCase()))
  ), 'name_en', sortDesc);

  // Filter medicines
  const filteredMedicines = sortByName(medicines.filter(med =>
    med.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.name_ta && med.name_ta.includes(searchQuery)) ||
    (med.brand_names && med.brand_names.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()))) ||
    med.uses_en.toLowerCase().includes(searchQuery.toLowerCase())
  ), 'generic_name', sortDesc);

  return (
    <View style={styles.container}>
      <Header 
        title="MedLexicon" 
        subtitle="Medical Dictionary & Medicines Database"
        icon="book"
      />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'terms' ? "Search medical term or Tamil term..." :
              activeTab === 'body' ? "Search body organ or system..." :
              "Search medicine (e.g. Paracetamol, Dolo, Metformin)..."
            }
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'terms' && styles.tabBtnActive]}
            onPress={() => setActiveTab('terms')}
          >
            <Ionicons name="text-outline" size={14} color={activeTab === 'terms' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
              Terms ({filteredTerms.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'body' && styles.tabBtnActive]}
            onPress={() => setActiveTab('body')}
          >
            <Ionicons name="body-outline" size={14} color={activeTab === 'body' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'body' && styles.tabTextActive]}>
              Anatomy ({filteredBodyParts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'meds' && styles.tabBtnActive]}
            onPress={() => setActiveTab('meds')}
          >
            <Ionicons name="medkit-outline" size={14} color={activeTab === 'meds' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'meds' && styles.tabTextActive]}>
              Medicines ({filteredMedicines.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Compact category filter for Terms, opens a sheet */}
        <View style={styles.controlRow}>
        {activeTab === 'terms' && (
          <TouchableOpacity
            style={[styles.filterBar, styles.filterFlex]}
            activeOpacity={0.8}
            onPress={() => {
              setDraftCategories(selectedCategories);
              setCategorySheetOpen(true);
            }}
          >
            <Ionicons name="funnel-outline" size={14} color={colors.primary} />
            <Text style={styles.filterBarText}>
              Category: {selectedCategories.length === 0
                ? 'All'
                : selectedCategories.length === 1
                  ? selectedCategories[0]
                  : `${selectedCategories.length} selected`}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.sortBtn} activeOpacity={0.8} onPress={() => setSortDesc(d => !d)}>
          <Ionicons name="swap-vertical" size={14} color={colors.primary} />
          <Text style={styles.sortBtnText}>{sortDesc ? 'Z → A' : 'A → Z'}</Text>
        </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptySub}>Loading from database...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cloud-offline-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Could not load data</Text>
            <Text style={styles.emptySub}>{loadError}</Text>
          </View>
        ) : (
          <>
        {/* Terms Tab */}
        {activeTab === 'terms' && (
          <View>
            {filteredTerms.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="search-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Medical Terms Found</Text>
                <Text style={styles.emptySub}>Try searching another term like "Anemia", "Hypertension", or "ECG".</Text>
              </View>
            ) : (
              filteredTerms.map(term => (
                <TermCard key={term.id} term={term} />
              ))
            )}
          </View>
        )}

        {/* Body Anatomy Tab */}
        {activeTab === 'body' && (
          <View>
            {filteredBodyParts.map(bp => (
              <View key={bp.id} style={styles.bodyCard}>
                <View style={styles.bodyHeader}>
                  <View style={styles.bodyIconCircle}>
                    <Ionicons name="fitness-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bodyNameEn}>{bp.name_en}</Text>
                    <Text style={styles.bodyNameTa}>{bp.name_ta}</Text>
                  </View>
                  {bp.body_system ? (
                    <Badge label={bp.body_system} type="primary" size="sm" />
                  ) : null}
                </View>
                <Text style={styles.bodyDescEn}>{bp.description_en}</Text>
                <View style={styles.bodyTaBox}>
                  <Text style={styles.bodyDescTa}>{bp.description_ta}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Medicines Tab */}
        {activeTab === 'meds' && (
          <View>
            {filteredMedicines.map(med => (
              <TouchableOpacity 
                key={med.id} 
                style={styles.medCard}
                activeOpacity={0.8}
                onPress={() => setSelectedMedicine(med)}
              >
                <View style={styles.medHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medGeneric}>{med.generic_name}</Text>
                    <Text style={styles.medTamil}>{med.name_ta}</Text>
                  </View>
                  <View style={styles.viewPill}>
                    <Text style={styles.viewPillText}>Dosing Info</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                  </View>
                </View>

                {med.brand_names ? (
                  <View style={styles.brandRow}>
                    <Text style={styles.brandLabel}>Brands: </Text>
                    <Text style={styles.brandValues}>{med.brand_names.join(', ')}</Text>
                  </View>
                ) : null}

                <Text style={styles.medUses} numberOfLines={2}>{med.uses_en}</Text>

                <View style={styles.medTamilUsesBox}>
                  <Text style={styles.medTamilUses} numberOfLines={2}>{med.uses_ta}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
          </>
        )}
      </ScrollView>

      {/* Category Sheet */}
      <Modal visible={categorySheetOpen} transparent animationType="slide" onRequestClose={() => setCategorySheetOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setCategorySheetOpen(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalMedTitle}>Filter by category</Text>
              <TouchableOpacity onPress={() => setCategorySheetOpen(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetOptions}>
              {categories.map(cat => {
                const active = draftCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => setDraftCategories(prev =>
                      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                    )}
                  >
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.clearBtn} onPress={() => setDraftCategories([])}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setSelectedCategories(draftCategories);
                  setCategorySheetOpen(false);
                }}
              >
                <Text style={styles.applyBtnText}>Apply filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Medicine Details Modal */}
      {selectedMedicine && (
        <Modal visible={!!selectedMedicine} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalMedTitle}>{selectedMedicine.generic_name}</Text>
                  <Text style={styles.modalMedTamil}>{selectedMedicine.name_ta}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMedicine(null)}>
                  <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {selectedMedicine.brand_names ? (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Popular Brands in India:</Text>
                    <Text style={styles.modalText}>{selectedMedicine.brand_names.join(', ')}</Text>
                  </View>
                ) : null}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Uses & Indications (பயன்கள்):</Text>
                  <Text style={styles.modalText}>{selectedMedicine.uses_en}</Text>
                  <Text style={[styles.modalText, { color: colors.tamilAccent, marginTop: 4 }]}>
                    {selectedMedicine.uses_ta}
                  </Text>
                </View>

                {selectedMedicine.dosing_information ? (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Standard Dosing Guidelines:</Text>
                    {selectedMedicine.dosing_information.map((dose, idx) => (
                      <View key={idx} style={styles.doseBox}>
                        <Text style={styles.dosePop}>{dose.population} - {dose.indication}</Text>
                        <Text style={styles.doseText}>{dose.official_dosing_text}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Side Effects & Warnings:</Text>
                  <Text style={styles.modalText}>{selectedMedicine.side_effects}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Safety Precautions:</Text>
                  <Text style={styles.modalText}>{selectedMedicine.precautions}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMuted
  },
  searchContainer: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginBottom: spacing.sm
  },
  searchIcon: {
    marginRight: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textWhite
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.sm,
    padding: 2,
    marginBottom: 6
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: borderRadius.sm
  },
  tabBtnActive: {
    backgroundColor: '#1E293B'
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B'
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  filterFlex: {
    flex: 1
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B'
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6
  },
  filterBarText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginHorizontal: 6
  },
  sheetOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: spacing.md
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  clearBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary
  },
  applyBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textWhite
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#1E293B'
  },
  catChipActive: {
    backgroundColor: colors.primary
  },
  catChipText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600'
  },
  catChipTextActive: {
    color: colors.textWhite,
    fontWeight: '700'
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: 40
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4
  },
  bodyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  bodyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  bodyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  bodyNameEn: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  bodyNameTa: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.tamilAccent
  },
  bodyDescEn: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 4
  },
  bodyTaBox: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  bodyDescTa: {
    fontSize: 12,
    lineHeight: 17,
    color: '#78350F'
  },
  medCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  medHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  medGeneric: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  medTamil: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.tamilAccent,
    marginTop: 1
  },
  viewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm
  },
  viewPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    marginRight: 2
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  brandLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted
  },
  brandValues: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  medUses: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 4
  },
  medTamilUsesBox: {
    marginTop: 4
  },
  medTamilUses: {
    fontSize: 12,
    lineHeight: 17,
    color: '#78350F'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalMedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary
  },
  modalMedTamil: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.tamilAccent,
    marginTop: 2
  },
  modalScroll: {
    flex: 1
  },
  modalSection: {
    marginBottom: spacing.md
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4
  },
  modalText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary
  },
  doseBox: {
    backgroundColor: colors.bgHighlight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary
  },
  dosePop: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 2
  },
  doseText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16
  }
});
