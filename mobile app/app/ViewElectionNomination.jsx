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

const ViewElectionNomination = () => {
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchNominations();
  }, []);

  const fetchNominations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${link}/evoting/viewelectionnomitation`);
      if (response.data && Array.isArray(response.data)) {
        setNominations(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        Alert.alert('Error', 'Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching nominations:', error);
      Alert.alert('Error', 'Failed to load nominations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (nominationId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this nomination?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.post(`${link}/evoting/deletenomination`, {
                nominationId: nominationId
              });
              
              if (response.data.status === 'success') {
                Alert.alert('Success', response.data.message);
                fetchNominations(); // Refresh the list
              } else {
                Alert.alert('Error', response.data.message || 'Failed to delete nomination');
              }
            } catch (error) {
              console.error('Error deleting nomination:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete nomination'
              );
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Not available';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString || 'Not available';
    }
  };

  const handleApprove = async (nominationId) => {
    try {
      await axios.put(`${link}/api/nominations/${nominationId}/approve`);
      Alert.alert('Success', 'Nomination approved successfully');
      fetchNominations();
    } catch (error) {
      console.error('Error approving nomination:', error);
      Alert.alert('Error', 'Failed to approve nomination');
    }
  };

  const handleReject = async (nominationId) => {
    try {
      await axios.put(`${link}/api/nominations/${nominationId}/reject`);
      Alert.alert('Success', 'Nomination rejected successfully');
      fetchNominations();
    } catch (error) {
      console.error('Error rejecting nomination:', error);
      Alert.alert('Error', 'Failed to reject nomination');
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
        <Text style={styles.headerText}>Election Nominations</Text>
      </View>

      {nominations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No nominations found</Text>
        </View>
      ) : (
        nominations.map((nomination) => (
          <View key={nomination.id} style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.name}>
                {nomination.candidate_name || 'Unknown Candidate'}
              </Text>
              <Text style={styles.detail}>
                Party: {nomination.party_name || 'Not specified'}
              </Text>
              <Text style={styles.detail}>
                Constituency: {nomination.constituency || 'Not specified'}
              </Text>
              <Text style={styles.detail}>
                Election: {nomination.election_name || 'Not specified'}
              </Text>
              <Text style={[styles.detail, 
                { color: nomination.status === 'Open' ? '#34C759' : '#FF3B30' }]}>
                Status: {nomination.status || 'Unknown'}
              </Text>
              <Text style={styles.detail}>
                Nomination Date: {formatDate(nomination.nomination_date)}
              </Text>
              
              {nomination.status === 'Open' && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(nomination.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete Nomination</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {nomination.status === 'Pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove(nomination.id)}
                  >
                    <Text style={styles.buttonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleReject(nomination.id)}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
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
    color: '#000',
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
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
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default ViewElectionNomination; 