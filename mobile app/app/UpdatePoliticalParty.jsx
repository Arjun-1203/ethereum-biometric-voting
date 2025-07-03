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

const UpdatePoliticalParty = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    leader: '',
    founding_year: '',
    headquarters: '',
    description: '',
  });

  useEffect(() => {
    fetchPoliticalParty();
  }, []);

  const fetchPoliticalParty = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${link}/api/political-parties/${id}`);
      setFormData({
        name: response.data.name,
        symbol: response.data.symbol,
      });
    } catch (error) {
      console.error('Error fetching political party:', error);
      Alert.alert('Error', 'Failed to load political party details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter political party name');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${link}/api/political-parties/${id}`, formData);
      Alert.alert('Success', 'Political party updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating political party:', error);
      Alert.alert('Error', 'Failed to update political party');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Update Political Party</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter party name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Symbol</Text>
          <TextInput
            style={styles.input}
            value={formData.symbol}
            onChangeText={(text) => setFormData({ ...formData, symbol: text })}
            placeholder="Enter party symbol"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Leader</Text>
          <TextInput
            style={styles.input}
            value={formData.leader}
            onChangeText={(text) => setFormData({ ...formData, leader: text })}
            placeholder="Enter party leader"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Founding Year</Text>
          <TextInput
            style={styles.input}
            value={formData.founding_year}
            onChangeText={(text) => setFormData({ ...formData, founding_year: text })}
            placeholder="Enter founding year"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Headquarters</Text>
          <TextInput
            style={styles.input}
            value={formData.headquarters}
            onChangeText={(text) => setFormData({ ...formData, headquarters: text })}
            placeholder="Enter headquarters location"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Enter party description"
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
            <Text style={styles.submitButtonText}>Update Political Party</Text>
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

export default UpdatePoliticalParty; 