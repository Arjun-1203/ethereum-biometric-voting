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
import { useNavigation, useRoute } from '@react-navigation/native';
import { link } from './Url';

const UpdateConstituency = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    district: '',
    total_voters: '',
    description: '',
  });

  useEffect(() => {
    fetchConstituency();
  }, []);

  const fetchConstituency = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${link}/api/constituencies/${id}`);
      setFormData({
        name: response.data.name,
        state: response.data.state,
      });
    } catch (error) {
      console.error('Error fetching constituency:', error);
      Alert.alert('Error', 'Failed to load constituency details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.state) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${link}/api/constituencies/${id}`, formData);
      Alert.alert('Success', 'Constituency updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating constituency:', error);
      Alert.alert('Error', 'Failed to update constituency');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Update Constituency</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter constituency name"
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>District</Text>
          <TextInput
            style={styles.input}
            value={formData.district}
            onChangeText={(text) => setFormData({ ...formData, district: text })}
            placeholder="Enter district"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Voters</Text>
          <TextInput
            style={styles.input}
            value={formData.total_voters}
            onChangeText={(text) => setFormData({ ...formData, total_voters: text })}
            placeholder="Enter total number of voters"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Enter constituency description"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Update Constituency</Text>
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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

export default UpdateConstituency; 