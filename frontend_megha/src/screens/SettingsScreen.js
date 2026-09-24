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
import { Ionicons } from '@expo/vector-icons';
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
import { colors, spacing, radius, type } from '../theme';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
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
        style={{ marginVertical: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.contactRow}>
            <View style={styles.contactAvatar}>
              <Ionicons name="person" size={16} color={colors.glow} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
            </View>
            <TouchableOpacity onPress={() => removeContact(item.id)}>
              <Ionicons name="trash-outline" size={18} color={colors.flame} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.hint}>No emergency contacts added yet.</Text>
        }
      />

      <View style={styles.inputWrap}>
        <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Contact name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.inputWrap}>
        <Ionicons name="call-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={addContact}>
        <Ionicons name="add-circle-outline" size={18} color={colors.bg} style={{ marginRight: 6 }} />
        <Text style={styles.addButtonText}>Add contact</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.locationButton} onPress={captureLocation} disabled={locationLoading}>
        <Ionicons name="location-outline" size={18} color={colors.glow} style={{ marginRight: 6 }} />
        <Text style={styles.locationButtonText}>
          {locationLoading ? 'Getting location…' : 'Set device location'}
        </Text>
      </TouchableOpacity>
      {deviceLocation && (
        <Text style={styles.hint}>
          Saved: {deviceLocation.latitude.toFixed(5)}, {deviceLocation.longitude.toFixed(5)}
        </Text>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={colors.flame} style={{ marginRight: 6 }} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  sectionTitle: { color: colors.textPrimary, ...type.h1, fontSize: 20, marginBottom: 4 },
  hint: { color: colors.textMuted, ...type.small, marginTop: 4 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  contactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  contactName: { color: colors.textPrimary, ...type.label, fontSize: 15 },
  contactPhone: { color: colors.textSecondary, ...type.small },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: 12, color: colors.textPrimary, ...type.body },
  addButton: {
    flexDirection: 'row',
    backgroundColor: colors.glow,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  addButtonText: { color: colors.bg, fontWeight: '700' },
  locationButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.glow,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  locationButtonText: { color: colors.glow, fontWeight: '600' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  logoutText: { color: colors.flame, fontWeight: '600' },
});
