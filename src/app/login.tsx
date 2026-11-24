import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handle = async () => {
    if (!email || !password) return Alert.alert('Error', 'Email aur Password likho');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace('/(tabs)/add');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Account ban gaya!');
        router.replace('/(tabs)/add');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
        <Text style={{ fontSize: 16, color: '#D32F2F', fontWeight: 'bold', marginBottom: 20 }}>← Back to Home</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isLogin ? 'Donor Login' : 'Donor Signup'}</Text>
      <Text style={{ color: '#666', marginBottom: 20 }}>Donor bannay ke liye login karein</Text>

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.btn} onPress={handle}>
        <Text style={styles.btnText}>{isLogin ? 'Login' : 'Signup'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 15, alignItems: 'center' }}>
        <Text style={{ color: '#D32F2F' }}>{isLogin ? 'Naya Donor? Signup karo' : 'Pehle se account hai? Login karo'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 50 },
  title: { fontSize: 28, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13, marginTop: 12, fontSize: 16 },
  btn: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
});