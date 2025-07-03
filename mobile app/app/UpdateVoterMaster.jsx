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
  Image,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { link } from './Url';

const API_BASE_URL = `${link}/evoting`;

const UpdateVoterMaster = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { voterId } = route.params;
  const [loading, setLoading] = useState(false);
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
    longitude: '',
    latitude: '',
    photo: null,
    aadhar_card: null,
    voter_id: null,
    account: '',
  });

  useEffect(() => {
    fetchVoterDetails();
  }, []);

  const fetchVoterDetails = async () => {
    try {
      setLoading(true);
      // Fetch all voters and find the one by ID
      const response = await axios.post(`${API_BASE_URL}/viewvotermaster`);
      const allVoters = typeof response.data === 'string'
        ? JSON.parse(response.data)
        : response.data;
      const voterData = allVoters.find(voter => String(voter[0]) === String(voterId));
      if (!voterData) {
        Alert.alert('Error', 'Voter not found');
        setLoading(false);
        return;
      }
      
      // Map according to the votermaster table schema
      setFormData({
        title: voterData[1] || '', // title
        first_name: voterData[2] || '', // firstName
        last_name: voterData[3] || '', // lastName
        address: voterData[4] || '', // address
        city: voterData[5] || '', // city
        state: voterData[6] || '', // state
        date_of_birth: voterData[7] || '', // dob
        aadhar_card: voterData[8] || null, // addressProof
        voter_id: voterData[9] || null, // ageProof
        constituency: voterData[10] || '', // constituencyID
        mobile_number: voterData[12] || '', // mobileNbr
        email_id: voterData[13] || '', // emailID
        gender: voterData[15] || '', // gender
        account: voterData[16] || '', // Account
        longitude: voterData[18] || '', // longitude
        latitude: voterData[19] || '', // latitude
        photo: voterData[20] || null, // image
      });
    } catch (error) {
      console.error('Error fetching voter details:', error);
      Alert.alert('Error', 'Failed to fetch voter details. Please try again.');
    } finally {
      setLoading(false);
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

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      // Add voter ID
      formDataToSend.append('voterId', voterId);
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      await axios.post(`${API_BASE_URL}/updatevotermaster`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Voter updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating voter:', error);
      Alert.alert('Error', 'Failed to update voter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Update Voter</Text>
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

        <Text style={styles.sectionTitle}>Contact Information</Text>
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

        <Text style={styles.sectionTitle}>Address Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            placeholder="Enter complete address"
            multiline
            numberOfLines={3}
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

        
        <Text style={styles.sectionTitle}>Document Uploads</Text>
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleImagePick('voter_id')}
          >
            <Text style={styles.uploadButtonText}>Update Voter ID</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleImagePick('aadhar_card')}
          >
            <Text style={styles.uploadButtonText}>Update Aadhar Card</Text>
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
            <Text style={styles.submitButtonText}>Update Voter</Text>
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
    marginTop: 24,
    marginBottom: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadContainer: {
    marginBottom: 24,
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
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 18,
  },
});

export default UpdateVoterMaster; 