import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function Detail(){
  const { name, group, city, phone } = useLocalSearchParams();
  return (
    <View style={s.c}>
      <View style={s.av}>
        <Text style={{color:'#fff', fontSize:30, fontWeight:'bold'}}>{group}</Text>
      </View>
      <Text style={s.name}>{name}</Text>
      <Text style={s.det}>📍 {city}</Text>
      <Text style={s.det}>📞 {phone}</Text>
      <Text style={s.det}>🟢 Available - Last Donation 2 months ago</Text>
      <TouchableOpacity onPress={()=>Linking.openURL(`tel:${phone}`)} style={s.call}>
        <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>📞 Abhi Call Karo</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  c: {flex:1, alignItems:'center', padding:20, paddingTop:80, backgroundColor:'#fff'},
  av: {width:110, height:110, borderRadius:55, backgroundColor:'#D32F2F', justifyContent:'center', alignItems:'center'},
  name: {fontSize:26, fontWeight:'bold', marginTop:16},
  det: {fontSize:16, color:'#555', marginTop:8},
  call: {backgroundColor:'#2E7D32', padding:14, paddingHorizontal:30, borderRadius:12, marginTop:30}
});