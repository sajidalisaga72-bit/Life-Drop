import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, Switch } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const BLOODS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CITIES = ['Gilgit', 'Skardu', 'Hunza', 'Ghizer', 'Nagar', 'Diamer'];

export default function AddScreen() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('testing@gmail.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [blood, setBlood] = useState('O+');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Gilgit');
  const [isActive, setIsActive] = useState(true);
  const [lastDonate, setLastDonate] = useState('');
  const [myDonorId, setMyDonorId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const q = query(collection(db, 'donors'), where('userId', '==', u.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d: any = snap.docs[0].data();
          setMyDonorId(snap.docs[0].id);
          setName(d.name); setBlood(d.blood); setPhone(d.phone); setCity(d.city);
          setIsActive(d.isActive !== false);
          setLastDonate(d.lastDonate || '');
        }
      } else setMyDonorId(null);
    });
    return unsub;
  }, []);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) return Alert.alert('Error', 'Email + Password likho');
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        try { await createUserWithEmailAndPassword(auth, email.trim(), password); Alert.alert('Ho Gaya! ❤️', 'Account ban gaya'); }
        catch (err: any) { Alert.alert('Error', err.message); }
      } else Alert.alert('Error', e.message);
    }
  };

  const checkEligible = (dateStr: string) => {
    if (!dateStr) return { ok: true, daysLeft: 0 };
    const last = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 90) return { ok: false, daysLeft: 90 - diffDays };
    return { ok: true, daysLeft: 0 };
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) return Alert.alert('Error', 'Naam aur Phone likho');
    if (!user) return Alert.alert('Pehle Login Karo', 'Upar se login karo');
    // 3 Month Check - Sirf jab Active ON hai
    if (isActive) {
      const res = checkEligible(lastDonate);
      if (!res.ok) {
        Alert.alert('❌ Not Eligible', `Tumne abhi ${lastDonate} ko donate kiya tha.\nDobara donate ke liye ${res.daysLeft} din aur wait karo.\n(3 Mahine ka gap zaroori hai)`);
        return;
      }
    }
    try {
      const data = { name, blood, phone, city, isActive, lastDonate };
      if (myDonorId) {
        await updateDoc(doc(db, 'donors', myDonorId), data);
        Alert.alert('Updated! ✅', isActive ? 'Tum Active ho, sab ko dikhoge' : 'Tum Off ho, ab kisi ko nahi dikhoge');
      } else {
        const d = await addDoc(collection(db, 'donors'), { ...data, userId: user.uid, createdAt: new Date().toISOString() });
        setMyDonorId(d.id);
        Alert.alert('Shukriya! ❤️', 'Tum donor ban gaye');
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const eligible = checkEligible(lastDonate);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>❤️ {myDonorId ? 'My Profile' : 'Become Donor'}</Text>
          <Text style={styles.headerSub}>Active raho to sab ko dikhoge, Off karo to chup jao ge</Text>
        </View>

        {!user ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔐 Pehle Login Karo</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#1B5E20' }]} onPress={handleAuth}><Text style={styles.btnText}>Login / Register</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.userRow}>
            <View><Text style={styles.welcome}>Welcome 👋</Text><Text style={styles.emailText}>{user.email}</Text></View>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth)}><Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>Logout</Text></TouchableOpacity>
          </View>
        )}

        {user && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{myDonorId ? '✏️ Edit My Donor Profile' : '📝 Donor Form'}</Text>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Ali Khan" value={name} onChangeText={setName} />
            <Text style={styles.label}>Blood Group</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {BLOODS.map(b => (<TouchableOpacity key={b} style={[styles.chip, blood === b && styles.chipActive]} onPress={() => setBlood(b)}><Text style={[styles.chipText, blood === b && { color: '#fff' }]}>{b}</Text></TouchableOpacity>))}
            </View>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="03xx-xxxxxxx" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Text style={styles.label}>City</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CITIES.map(c => (<TouchableOpacity key={c} style={[styles.chip, city === c && styles.chipActive]} onPress={() => setCity(c)}><Text style={[styles.chipText, city === c && { color: '#fff' }]}>{c}</Text></TouchableOpacity>))}
            </View>

            {/* ACTIVE ON/OFF */}
            <View style={styles.activeBox}>
              <View><Text style={{ fontWeight: 'bold', fontSize: 15 }}>{isActive ? '🟢 Active - Dikh raha hun' : '🔴 Off - Chupa hua hun'}</Text><Text style={{ color: '#666', fontSize: 12 }}>Off karne pe Home pe nahi dikhoge</Text></View>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: '#ccc', true: '#4CAF50' }} thumbColor="#fff" />
            </View>

            {/* LAST DONATE DATE */}
            <Text style={styles.label}>Last Donate Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD e.g. 2026-08-15" value={lastDonate} onChangeText={setLastDonate} />
            <Text style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Aise likho: 2026-08-15, agar kabhi nahi diya to khali choro</Text>

            {lastDonate ? (
              eligible.ok
                ? <View style={styles.okBox}><Text style={{ color: '#1B5E20', fontWeight: 'bold' }}>✅ Eligible Ho - Donate Kar Sakte Ho</Text></View>
                : <View style={styles.noBox}><Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>❌ Not Eligible - {eligible.daysLeft} din baad eligible hoge</Text></View>
            ) : null}

            <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF5350', marginTop: 18 }]} onPress={handleSave}>
              <Text style={styles.btnText}>{myDonorId ? '💾 Update My Profile' : '❤️ Save Donor'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F8', padding: 16, paddingTop: 55 },
  header: { backgroundColor: '#EF5350', padding: 22, borderRadius: 18, marginBottom: 14 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSub: { color: '#FFCDD2', marginTop: 4, fontSize: 13 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 18, marginBottom: 14, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  label: { fontWeight: 'bold', fontSize: 13, marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, backgroundColor: '#FAFAFA' },
  chip: { paddingHorizontal: 14, height: 36, justifyContent: 'center', borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#eee' },
  chipActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  chipText: { fontWeight: 'bold' },
  btn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 14, borderRadius: 14, marginBottom: 14 },
  welcome: { fontWeight: 'bold', fontSize: 15 },
  emailText: { color: '#666', fontSize: 12 },
  logoutBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FFCDD2' },
  activeBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F8E9', padding: 14, borderRadius: 12, marginTop: 16 },
  okBox: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 10, marginTop: 12, alignItems: 'center' },
  noBox: { backgroundColor: '#FFEBEE', padding: 12, borderRadius: 10, marginTop: 12, alignItems: 'center' },
});