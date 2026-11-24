import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Linking, ScrollView, Animated, Easing, SafeAreaView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const BLOODS = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CITIES = ['All', 'Gilgit', 'Skardu', 'Hunza', 'Ghizer', 'Nagar', 'Diamer'];

export default function HomeScreen() {
  const [donors, setDonors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [bloodFilter, setBloodFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [emergencyList, setEmergencyList] = useState<any[]>([]);
  const scrollX = useRef(new Animated.Value(400)).current;

  const loadDonors = async () => {
    const snap = await getDocs(collection(db, 'donors'));
    setDonors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  const loadEmergency = async () => {
    const snap = await getDocs(collection(db, 'emergency_requests'));
    setEmergencyList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  useFocusEffect(useCallback(() => { loadDonors(); loadEmergency(); }, []));

  useEffect(() => {
    if (emergencyList.length === 0) return;
    scrollX.setValue(400);
    Animated.loop(Animated.timing(scrollX, { toValue: -500, duration: 9000, easing: Easing.linear, useNativeDriver: true })).start();
  }, [emergencyList]);

  const filtered = donors.filter(d => {
  if (d.isActive === false) return false; // Off wala chup jayega
  const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase());
  const matchBlood = bloodFilter === 'All' || d.blood?.toUpperCase() === bloodFilter;
  const matchCity = cityFilter === 'All' || d.city?.toLowerCase() === cityFilter.toLowerCase();
  return matchSearch && matchBlood && matchCity;
});
  const callDonor = (phone: string) => Linking.openURL(`tel:${phone}`);
  const whatsappDonor = (phone: string) => {
    let num = phone.replace(/[^0-9]/g, '');
    if (num.startsWith('0')) num = '92' + num.slice(1);
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent('Assalam-o-Alaikum! Blood Donor App se contact kar raha hun, blood chahiye.')}`);
  };
  const handleDelete = (item: any) => {
    if (item.userId !== auth.currentUser?.uid) { Alert.alert('Not Allowed', 'Ye donor tumhara nahi hai'); return; }
    Alert.alert('Delete?', 'Apna donor delete karna hai?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: async () => { await deleteDoc(doc(db, 'donors', item.id)); loadDonors(); } }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {emergencyList.length > 0 && (
        <View style={styles.ticker}>
          <Animated.Text style={[styles.tickerText, { transform: [{ translateX: scrollX }] }]}>
            🚨 EMERGENCY: {emergencyList.map(e => `${e.name} ko ${e.blood} chahiye - ${e.city}   •   `).join('')}
          </Animated.Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🩸 Blood Donor</Text>
        <Text style={styles.headerSub}>Gilgit-Baltistan • Save Life, Donate Blood</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statNum}>{donors.length}</Text><Text style={styles.statLabel}>Total Donors</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>{filtered.length}</Text><Text style={styles.statLabel}>Available</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>{emergencyList.length}</Text><Text style={styles.statLabel}>Emergency</Text></View>
        </View>
      </View>

      <TextInput style={styles.search} placeholder="🔍 Search donor naam..." value={search} onChangeText={setSearch} />

      <Text style={styles.filterTitle}>Blood Group</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 42, flexGrow: 0, marginBottom: 10 }}>
        {BLOODS.map(b => (
          <TouchableOpacity key={b} style={[styles.chip, bloodFilter === b && styles.chipActive]} onPress={() => setBloodFilter(b)}>
            <Text style={[styles.chipText, bloodFilter === b && styles.chipTextActive]}>{b}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.filterTitle}>City</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 42, flexGrow: 0, marginBottom: 14 }}>
        {CITIES.map(c => (
          <TouchableOpacity key={c} style={[styles.chip, cityFilter === c && styles.chipActive]} onPress={() => setCityFilter(c)}>
            <Text style={[styles.chipText, cityFilter === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList data={filtered} keyExtractor={(i) => i.id} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: '#999' }}>Koi donor nahi mila 😔</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.cityText}>📍 {item.city}</Text>
                <Text style={styles.hiddenText}>Active </Text>
              </View>
              <View style={styles.bloodBadge}><Text style={styles.bloodBadgeText}>{item.blood}</Text></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#1B5E20' }]} onPress={() => callDonor(item.phone)}>
                <Text style={styles.btnText}>📞 Call Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#25D366' }]} onPress={() => whatsappDonor(item.phone)}>
                <Text style={styles.btnText}>💬 WhatsApp</Text>
              </TouchableOpacity>
            </View>
            {item.userId === auth.currentUser?.uid && (
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#FFEBEE', marginTop: 8 }]} onPress={() => handleDelete(item)}>
                <Text style={[styles.btnText, { color: '#D32F2F' }]}>🗑️ Delete My Donor</Text>
              </TouchableOpacity>
            )}
          </View>
        )} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 45, backgroundColor: '#FFF8F8' },
  ticker: { backgroundColor: '#D32F2F', height: 36, borderRadius: 10, overflow: 'hidden', justifyContent: 'center', marginBottom: 12, marginTop: 4 },
  tickerText: { color: '#fff', fontWeight: 'bold', width: 900 },
  header: { backgroundColor: '#d3582f', padding: 20, borderRadius: 18, marginBottom: 14, elevation: 4 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  headerSub: { color: '#FFCDD2', marginTop: 4, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#FFCDD2', fontSize: 11 },
  search: { backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 12, borderWidth: 1, borderColor: '#eee', elevation: 1 },
  filterTitle: { fontWeight: 'bold', fontSize: 13, marginBottom: 6, color: '#333' },
  chip: { height: 36, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#eee', elevation: 1 },
  chipActive: { backgroundColor: '#d32f2f', borderColor: '#D32F2F' },
  chipText: { fontWeight: 'bold', color: '#333' },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  name: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  cityText: { color: '#666', marginTop: 3 },
  hiddenText: { fontSize: 11, color: '#999', marginTop: 2 },
  bloodBadge: { backgroundColor: '#FFEBEE', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  bloodBadgeText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },
  btn: { flex: 1, padding: 11, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});