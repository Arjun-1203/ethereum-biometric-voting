import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { link } from './Url';

// Update the base URL to use your computer's IP address
const API_BASE_URL = `${link}/evoting`; // Added /evoting prefix

const ViewVoterMaster = () => {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
    try {
      console.log('Fetching voters from:', `${API_BASE_URL}/viewvotermaster`);
      const response = await axios.post(`${API_BASE_URL}/viewvotermaster`);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Raw response data:', response.data);
      
      if (!response.data || response.data.length === 0) {
        console.log('No data received from the server');
        Alert.alert(
          'No Data',
          'No voter data found in the database. Please check if there are any approved voters.',
          [{ text: 'OK', onPress: () => setLoading(false) }]
        );
        setVoters([]);
        setLoading(false);
        return;
      }
      
      // Parse the response data if it's a string
      const voterData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      console.log('Parsed voter data:', voterData);
      
      // Fix: Correctly filter approved voters by checking if isApproved equals "1" (string) or 1 (number)
      // The backend might return the value as either string or number
      const approvedVoters = voterData.filter(voter => {
        const isApproved = voter[11]; // Corrected index based on API response structure
        console.log(`Voter ${voter[0]} approval status:`, isApproved);
        return isApproved === 1 || isApproved === "1";
      });
      
      console.log('Approved voters count:', approvedVoters.length);
      
      if (approvedVoters.length === 0) {
        Alert.alert(
          'No Approved Voters',
          'There are no approved voters in the database.',
          [{ text: 'OK', onPress: () => setLoading(false) }]
        );
      }
      
      setVoters(approvedVoters);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching voters:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      Alert.alert(
        'Error',
        'Failed to fetch voters. Please check your network connection and server status.',
        [{ text: 'OK', onPress: () => setLoading(false) }]
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.post(`${API_BASE_URL}/deletevotermaster`, { id });
      Alert.alert('Success', 'Voter deleted successfully');
      fetchVoters();
    } catch (error) {
      console.error('Error deleting voter:', error);
      Alert.alert('Error', 'Failed to delete voter');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Approved Voters</Text>
      </View>

      {voters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No approved voters found</Text>
        </View>
      ) : (
        voters.map((voter) => (
          <View key={voter[0]} style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.name}>
                {voter[1] || ""} {voter[2] || ""} {voter[3] || ""}
              </Text>
              <Text style={styles.detail}>Voter ID: {voter[0] || ""}</Text>
              <Text style={styles.detail}>Email: {voter[13] || ""}</Text>
              <Text style={styles.detail}>Mobile: {voter[12] || ""}</Text>
              <Text style={styles.detail}>Gender: {voter[15] || ""}</Text>
              <Text style={styles.detail}>
                Address: {[voter[4], voter[5], voter[6]].filter(Boolean).join(', ') || "Not specified"}
              </Text>
              <Text style={styles.detail}>State: {voter[6] || ""}</Text>
              <Text style={styles.detail}>Constituency: {voter[10] || ""}</Text>
              <View style={styles.statusContainer}>
                <Text style={[styles.status, styles.approvedStatus]}>Approved</Text>
              </View>
              {voter[16] && (
                <Text style={styles.detail}>Account: {voter[16].substring(0, 10)}...{voter[16].substring(voter[16].length - 6)}</Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => navigation.navigate('updatevotermaster', { voterId: voter[0] })}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => handleDelete(voter[0])}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContent: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusContainer: {
    marginTop: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  approvedStatus: {
    backgroundColor: '#34C759',
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ViewVoterMaster; 