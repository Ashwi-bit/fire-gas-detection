// src/screens/SettingsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { firestore } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // contacts live at users/{uid}/emergencyContacts
    const contactsRef = collection(firestore, 'users', user.uid, 'emergencyContacts');
    const unsubscribe = onSnapshot(contactsRef, (snapshot) => {
      setContacts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadLocation = async () => {
      try {
        const docSnap = await getDoc(doc(firestore, 'users', user.uid, 'settings', 'device'));
        if (docSnap.exists()) {
          setDeviceLocation(docSnap.data());
        }
      } catch (err) {
        console.error('Failed to load device location:', err);
      }
    };
    loadLocation();
  }, [user]);

  const addContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Enter both a name and phone number.');
      return;
    }
    try {
      const contactsRef = collection(firestore, 'users', user.uid, 'emergencyContacts');
      await addDoc(contactsRef, { name: name.trim(), phone: phone.trim() });
      setName('');
      setPhone('');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const removeContact = async (id) => {
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'emergencyContacts', id));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const captureLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location access is required to tag alerts with the device address.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      await setDoc(doc(firestore, 'users', user.uid, 'settings', 'device'), {
        latitude,
        longitude,
        savedAt: new Date().toISOString(),
      });

      setDeviceLocation({ latitude, longitude });
      Alert.alert('Saved', 'Device location saved successfully.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Emergency contacts</Text>
      <Text style={styles.hint}>
        These contacts get alerted (push + SMS via your Cloud Function) when a
        dangerous gas level is detected.
      </Text>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        style={{ marginVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.contactRow}>
            <View>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
            </View>
            <TouchableOpacity onPress={() => removeContact(item.id)}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.hint}>No emergency contacts added yet.</Text>
        }
      />

      <TextInput
        style={styles.input}
        placeholder="Contact name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TouchableOpacity style={styles.addButton} onPress={addContact}>
        <Text style={styles.addButtonText}>Add contact</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addButton} onPress={captureLocation} disabled={locationLoading}>
        <Text style={styles.addButtonText}>
          {locationLoading ? 'Getting location...' : 'Set device location'}
        </Text>
      </TouchableOpacity>
      {deviceLocation && (
        <Text style={styles.hint}>
          Saved: {deviceLocation.latitude.toFixed(5)}, {deviceLocation.longitude.toFixed(5)}
        </Text>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  hint: { fontSize: 13, color: '#888' },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactName: { fontSize: 15, fontWeight: '500' },
  contactPhone: { fontSize: 13, color: '#777' },
  remove: { color: '#c0392b', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  logoutButton: { alignItems: 'center', padding: 12 },
  logoutText: { color: '#d84b30', fontWeight: '600' },
});