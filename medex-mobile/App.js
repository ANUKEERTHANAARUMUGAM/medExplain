import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Platform
} from 'react-native';
import { colors, borderRadius } from './src/theme/colors';
import { MedExplainScreen } from './src/screens/MedExplainScreen';
import { MedRemindScreen } from './src/screens/MedRemindScreen';
import { MedLexiconScreen } from './src/screens/MedLexiconScreen';
import { HospitalsScreen } from './src/screens/HospitalsScreen';
import { InsuranceScreen } from './src/screens/InsuranceScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

export default function App() {
  const [activeTab, setActiveTab] = useState('explain'); // 'explain', 'remind', 'lexicon', 'hospitals', 'insurance', 'settings'

  const renderScreen = () => {
    switch (activeTab) {
      case 'explain':
        return <MedExplainScreen />;
      case 'remind':
        return <MedRemindScreen />;
      case 'lexicon':
        return <MedLexiconScreen />;
      case 'hospitals':
        return <HospitalsScreen />;
      case 'insurance':
        return <InsuranceScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <MedExplainScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" backgroundColor={colors.bgDark} />
      
      {/* Active Screen View */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Modern Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('explain')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, activeTab === 'explain' && styles.navIconBoxActive]}>
            <Ionicons 
              name={activeTab === 'explain' ? "document-text" : "document-text-outline"} 
              size={20} 
              color={activeTab === 'explain' ? colors.textWhite : colors.textMuted} 
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'explain' && styles.navLabelActive]}>
            Explain
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('remind')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, activeTab === 'remind' && styles.navIconBoxActive]}>
            <Ionicons 
              name={activeTab === 'remind' ? "alarm" : "alarm-outline"} 
              size={20} 
              color={activeTab === 'remind' ? colors.textWhite : colors.textMuted} 
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'remind' && styles.navLabelActive]}>
            Remind
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('lexicon')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, activeTab === 'lexicon' && styles.navIconBoxActive]}>
            <Ionicons 
              name={activeTab === 'lexicon' ? "book" : "book-outline"} 
              size={20} 
              color={activeTab === 'lexicon' ? colors.textWhite : colors.textMuted} 
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'lexicon' && styles.navLabelActive]}>
            Lexicon
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('hospitals')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, activeTab === 'hospitals' && styles.navIconBoxActive]}>
            <Ionicons 
              name={activeTab === 'hospitals' ? "business" : "business-outline"} 
              size={20} 
              color={activeTab === 'hospitals' ? colors.textWhite : colors.textMuted} 
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'hospitals' && styles.navLabelActive]}>
            Hospitals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('insurance')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, activeTab === 'insurance' && styles.navIconBoxActive]}>
            <Ionicons 
              name={activeTab === 'insurance' ? "shield-checkmark" : "shield-checkmark-outline"} 
              size={20} 
              color={activeTab === 'insurance' ? colors.textWhite : colors.textMuted} 
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'insurance' && styles.navLabelActive]}>
            Insurance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconBox, activeTab === 'settings' && styles.navIconBoxActive]}>
            <Ionicons 
              name={activeTab === 'settings' ? "settings" : "settings-outline"} 
              size={20} 
              color={activeTab === 'settings' ? colors.textWhite : colors.textMuted} 
            />
          </View>
          <Text style={[styles.navLabel, activeTab === 'settings' && styles.navLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  screenContainer: {
    flex: 1
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 2,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navIconBox: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2
  },
  navIconBoxActive: {
    backgroundColor: colors.primary
  },
  navLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '700'
  }
});
