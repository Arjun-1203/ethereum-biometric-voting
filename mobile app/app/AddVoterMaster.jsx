import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { link } from './Url';

const AddVoterMaster = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [constituencies, setConstituencies] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    state: '',
    date_of_birth: '',
    gender: '',
    constituency: '',
    mobile_number: '',
    email_id: '',
    password: '',
    longitude: '',
    latitude: '',
    photo: null,
    aadhar_card: null,
    voter_id: null,
  });

  useEffect(() => {
    fetchConstituencies();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera and location permissions to continue');
    }
  };

  const fetchConstituencies = async () => {
    try {
      const response = await axios.get(`${link}/api/constituencies`);
      setConstituencies(response.data);
    } catch (error) {
      console.error('Error fetching constituencies:', error);
      Alert.alert('Error', 'Failed to load constituencies');
    }
  };

  const handleImagePick = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setFormData({ ...formData, [type]: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setFormData({
        ...formData,
        longitude: location.coords.longitude.toString(),
        latitude: location.coords.latitude.toString(),
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      await axios.post(`${link}/api/voters`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Voter registered successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to register voter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Add New Voter</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Enter title"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={formData.first_name}
            onChangeText={(text) => setFormData({ ...formData, first_name: text })}
            placeholder="Enter first name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={formData.last_name}
            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
            placeholder="Enter last name"
          />
        </View>

        <Text style={styles.sectionTitle}>Address Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Enter complete address"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
            placeholder="Enter city"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={formData.state}
            onChangeText={(text) => setFormData({ ...formData, state: text })}
            placeholder="Enter state"
          />
        </View>

        <Text style={styles.sectionTitle}>Additional Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={formData.date_of_birth}
            onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <TextInput
            style={styles.input}
            value={formData.gender}
            onChangeText={(text) => setFormData({ ...formData, gender: text })}
            placeholder="Enter gender"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Constituency</Text>
          <TextInput
            style={styles.input}
            value={formData.constituency}
            onChangeText={(text) => setFormData({ ...formData, constituency: text })}
            placeholder="Select constituency"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={formData.mobile_number}
            onChangeText={(text) => setFormData({ ...formData, mobile_number: text })}
            placeholder="Enter mobile number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email ID</Text>
          <TextInput
            style={styles.input}
            value={formData.email_id}
            onChangeText={(text) => setFormData({ ...formData, email_id: text })}
            placeholder="Enter email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            placeholder="Enter password"
            secureTextEntry
          />
        </View>

        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationContainer}>
          <View style={styles.locationFields}>
            <View style={[styles.inputGroup, styles.locationField]}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={formData.longitude}
                onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                placeholder="Longitude"
                keyboardType="numeric"
                editable={false}
              />
            </View>
            <View style={[styles.inputGroup, styles.locationField]}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={formData.latitude}
                onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                placeholder="Latitude"
                keyboardType="numeric"
                editable={false}
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
          >
            <Text style={styles.locationButtonText}>Get Current Location</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Document Uploads</Text>
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleImagePick('photo')}
          >
            <Text style={styles.uploadButtonText}>Upload Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleImagePick('aadhar_card')}
          >
            <Text style={styles.uploadButtonText}>Upload Aadhar Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleImagePick('voter_id')}
          >
            <Text style={styles.uploadButtonText}>Upload Voter ID</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Add Voter</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#007AFF',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationField: {
    width: '48%',
  },
  locationButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  locationButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  uploadContainer: {
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AddVoterMaster; 