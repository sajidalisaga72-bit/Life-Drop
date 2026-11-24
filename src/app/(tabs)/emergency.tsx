import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useFocusEffect } from 'expo-router';

const BLOODS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const FIVE_HOURS = 5 * 60 * 60 * 1000;

type EmergencyItem = {
  id: string;
  name: string;
  blood: string;
  city: string;
  hospital: string;
  userId: string;
  createdAt: string;
};

export default function EmergencyScreen() {
  const [name, setName] = useState('');
  const [blood, setBlood] = useState('O+');
  const [city, setCity] = useState('');
  const [hospital, setHospital] = useState('');
  const [myRequests, setMyRequests] = useState<EmergencyItem[]>([]);

  const loadMine = async () => {
    try {
      const myId = auth.currentUser ? auth.currentUser.uid : 'guest';
      const q = query(collection(db, 'emergency_requests'), where('userId', '==', myId));
      const snap = await getDocs(q);
      const list: EmergencyItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          blood: data.blood || 'O+',
          city: data.city || '',
          hospital: data.hospital || '',
          userId: data.userId || 'guest',
          createdAt: data.createdAt || new Date().toISOString(),
        };
      });

      const now = Date.now();
      const fresh: EmergencyItem[] = [];
      for (const item of list) {
        const age = now - new Date(item.createdAt).getTime();
        if (age > FIVE_HOURS) {
          await deleteDoc(doc(db, 'emergency_requests', item.id));
        } else {
          fresh.push(item);
        }
      }
      setMyRequests(fresh);
    } catch (e) {
      console.log('load error', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMine();
    }, [])
  );

  const saveEmergency = async () => {
    if (!name.trim() || !city.trim()) {
      Alert.alert('Error', 'Naam aur City likho');
      return;
    }
    try {
      const myId = auth.currentUser ? auth.currentUser.uid : 'guest';
      await addDoc(collection(db, 'emergency_requests'), {
        name: name.trim(),
        blood: blood,
        city: city.trim(),
        hospital: hospital.trim() || '',
        userId: myId,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Ho Gaya! 🚨', 'Emergency save ho gayi, 5 ghante tak dikhegi');
      setName('');
      setCity('');
      setHospital('');
      loadMine();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Save nahi hui');
    }
  };

  const bandKaro = async (id: string) => {
    Alert.alert('Band Karna Hai?', 'Blood mil gaya?', [
      { text: 'Nahi' },
      {
        text: 'Haan Band Karo',
        onPress: async () => {
          await deleteDoc(doc(db, 'emergency_requests', id));
          loadMine();
          Alert.alert('Band Ho Gaya', 'Emergency patti se hat gayi');
        },
      },
    ]);
  };

  const timeLeft = (createdAt: string) => {
    const passed = Date.now() - new Date(createdAt).getTime();
    const left = Math.max(0, FIVE_HOURS - passed);
    const hours = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return hours + 'h ' + mins + 'm baaki';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Emergency</Text>
        <Text style={styles.headerSub}>Urgent blood chahiye? Foran post karo - 5 ghante baad auto khatam</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Patient Ka Naam</Text>
        <TextInput style={styles.input} placeholder="e.g. Ahmed Khan" value={name} onChangeText={setName} />
        <Text style={styles.label}>Blood Group</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {BLOODS.map((g) => (
            <TouchableOpacity key={g} onPress={() => setBlood(g)} style={[styles.chip, blood === g && { backgroundColor: '#D32F2F' }]}>
              <Text style={{ fontWeight: 'bold', color: blood === g ? '#fff' : '#000' }}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} placeholder="e.g. Gilgit" value={city} onChangeText={setCity} />
        <Text style={styles.label}>Hospital</Text>
        <TextInput style={styles.input} placeholder="e.g. DHQ Gilgit" value={hospital} onChangeText={setHospital} />
        <TouchableOpacity style={styles.btn} onPress={saveEmergency}>
          <Text style={styles.btnText}>🚨 Emergency Post Karo</Text>
        </TouchableOpacity>
      </View>

      {myRequests.length > 0 && (
        <View style={{ marginTop: 15 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 8 }}>Meri Emergency Requests</Text>
          {myRequests.map((item) => (
            <View key={item.id} style={styles.myCard}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                {item.name} - {item.blood}
              </Text>
              <Text>
                {item.city} - {item.hospital}
              </Text>
              <Text style={{ color: '#D32F2F', fontWeight: 'bold', marginTop: 4 }}>⏳ {timeLeft(item.createdAt)} - phir auto khatam</Text>
              <TouchableOpacity style={styles.bandBtn} onPress={() => bandKaro(item.id)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>🔴 Band Karo / Blood Mil Gaya</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5', padding: 15 },
  header: { backgroundColor: '#D32F2F', padding: 20, borderRadius: 15, marginBottom: 15 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  headerSub: { color: '#fff', marginTop: 4 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15 },
  label: { fontWeight: 'bold', fontSize: 16, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 13, backgroundColor: '#fff' },
  chip: { borderWidth: 1, borderColor: '#eee', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5' },
  btn: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  myCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#FFCDD2' },
  bandBtn: { backgroundColor: '#333', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
});