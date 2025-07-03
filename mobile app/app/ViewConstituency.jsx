import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { link } from './Url';
import { useNavigation } from '@react-navigation/native';

const ViewConstituency = () => {
  const [constituencies, setConstituencies] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchConstituencies();
  }, []);

  const fetchConstituencies = () => {
    axios.post(link + '/evoting/viewconstituencymaster')
      .then(response => {
        setConstituencies(response.data);
      })
      .catch(error => {
        console.error('Error fetching constituencies:', error);
        Alert.alert('Error', 'Failed to load constituencies');
      });
  };

  const deleteConstituency = async (id) => {
    try {
      await axios.post(link + '/evoting/deleteconstituencymaster', { id });
      Alert.alert('Success', 'Constituency deleted successfully');
      fetchConstituencies();
    } catch (error) {
      console.error('Error deleting constituency:', error);
      Alert.alert('Error', 'Failed to delete constituency');
    }
  };

  const editConstituency = (constituency) => {
    navigation.navigate('addconstituency', { editData: constituency });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Constituencies</Text>
      <View style={styles.listContainer}>
        {constituencies.map((constituency, index) => (
          <View key={constituency[0]} style={[
            styles.constituencyCard,
            index === constituencies.length - 1 && styles.lastCard
          ]}>
            <Text style={styles.constituencyName}>{constituency[1]}</Text>
            <Text style={styles.constituencyDetails}>ID: {constituency[0]}</Text>
            <Text style={styles.constituencyDetails}>State: {constituency[2] || 'Not specified'}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#dc3545', padding: 8, borderRadius: 6, marginRight: 10 }}
                onPress={() => deleteConstituency(constituency[0])}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#007bff', padding: 8, borderRadius: 6 }}
                onPress={() => editConstituency(constituency)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  constituencyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  lastCard: {
    marginBottom: 0,
  },
  constituencyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  constituencyDetails: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
});

export default ViewConstituency; 