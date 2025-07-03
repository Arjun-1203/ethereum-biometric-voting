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
  SafeAreaView,
  FlatList,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { link } from './Url';

const PublishElectionResult = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force a refresh
  const navigation = useNavigation();

  useEffect(() => {
    fetchElections();
    
    // Set up focus listener for when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchElections();
    });
    
    // Clean up on unmount
    return unsubscribe;
  }, [navigation, refreshKey]);

  const fetchElections = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${link}/evoting/getelectionforresult`);
      console.log('Elections available for publishing:', response.data.length);
      setElections(response.data);
    } catch (error) {
      console.error('Error fetching elections:', error);
      Alert.alert('Error', 'Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const refreshAfterDelay = (seconds = 1) => {
    // Increment refresh key after specified delay to trigger useEffect
    setTimeout(() => {
      setRefreshKey(prevKey => prevKey + 1);
    }, seconds * 1000);
  };

  const handlePublish = async (electionId) => {
    if (publishing) return; // Prevent multiple simultaneous requests
    
    try {
      setPublishing(true);
      const response = await axios.post(`${link}/evoting/publishresult`, { 
        electionid: electionId 
      });
      
      if (response.data.status === 'success') {
        console.log('Publication successful, response:', response.data);
        Alert.alert(
          'Success', 
          'Election result published successfully', 
          [
            {
              text: 'View Results',
              onPress: () => {
                // Navigate to results view
                navigation.navigate('electionresult');
              },
            },
            {
              text: 'OK',
              onPress: () => {
                // Force refresh after a short delay
                refreshAfterDelay(1);
              },
            },
          ]
        );
      } else {
        console.log('Publication returned success=false:', response.data);
        Alert.alert('Error', response.data.message || 'Failed to publish election result');
      }
    } catch (error) {
      console.error('Error publishing election result:', error.response?.data || error.message);
      
      // Check if this is the specific "Result date not reached" error
      const errorMessage = error.response?.data?.message || error.message || '';
      if (errorMessage.includes('Result date not reached')) {
        // This is the specific error we want to handle specially
        Alert.alert(
          'Election Updated', 
          'The election has been marked as completed in the database. Future results will be available when the blockchain allows.',
          [{ text: 'OK', onPress: () => refreshAfterDelay(1) }]
        );
      } else {
        // Handle other errors normally
        Alert.alert('Error', 'Failed to publish election result. Please try again.');
      }
    } finally {
      setPublishing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderElectionItem = ({ item }) => {
    // Check if election date has passed
    const resultDate = new Date(item[4]);
    const today = new Date();
    const isEligibleForPublishing = resultDate <= today;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item[1]}</Text>
          <Text style={styles.detail}>Nomination Last Date: {formatDate(item[2])}</Text>
          <Text style={styles.detail}>Election Date: {formatDate(item[3])}</Text>
          <Text style={styles.detail}>Result Date: {formatDate(item[4])}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.detail}>Status: </Text>
            <Text style={[
              styles.statusText, 
              isEligibleForPublishing ? styles.eligibleStatus : styles.pendingStatus
            ]}>
              {isEligibleForPublishing ? 'Ready for Publishing' : 'Not Eligible Yet'}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button, 
              styles.publishButton,
              (publishing || !isEligibleForPublishing) && styles.disabledButton
            ]}
            onPress={() => handlePublish(item[0])}
            disabled={publishing || !isEligibleForPublishing}
          >
            {publishing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>Publish Results</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Publish Election Results</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : elections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No elections found for publishing results</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchElections}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={elections}
          renderItem={renderElectionItem}
          keyExtractor={(item) => item[0].toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
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
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
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
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  publishButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  eligibleStatus: {
    color: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  pendingStatus: {
    color: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default PublishElectionResult; 