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

const API_BASE_URL = `${link}/evoting`;

const ApproveVoterMaster = () => {
  const [pendingVoters, setPendingVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchPendingVoters();
  }, []);

  const fetchPendingVoters = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/viewpendingvoters`);
      console.log('Fetched pending voters:', response.data);
      setPendingVoters(response.data || []);
    } catch (error) {
      console.error('Error fetching pending voters:', error);
      Alert.alert('Error', `Failed to fetch pending voters: ${error.message}`);
      setPendingVoters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (voter) => {
    try {
      setLoading(true);
      const voterId = voter[0];
      const voterEmail = voter[13]; // emailID is at index 13
      const isEmailVerified = voter[19]; // email_verified is at index 19

      if (!isEmailVerified) {
        Alert.alert(
          'Cannot Approve',
          'This voter has not verified their email address. Please ask them to verify their email before approval.',
          [{ text: 'OK' }]
        );
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/approvevotermaster`, {
        voteID: voterId,
        emailID: voterEmail,
        isApproved: 1,
      });

      console.log('Approval response:', response.data);

      Alert.alert(
        'Success',
        'Voter approved successfully! A blockchain account has been automatically assigned.',
        [{ text: 'OK', onPress: () => fetchPendingVoters() }]
      );
    } catch (error) {
      console.error('Error approving voter:', error);
      Alert.alert(
        'Error',
        `Failed to approve voter: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (voterId) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/deletevotermaster`, { id: voterId });
      Alert.alert('Success', 'Voter rejected successfully', [
        { text: 'OK', onPress: () => fetchPendingVoters() },
      ]);
    } catch (error) {
      console.error('Error rejecting voter:', error);
      Alert.alert('Error', 'Failed to reject voter');
    } finally {
      setLoading(false);
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
        <Text style={styles.headerText}>Pending Voter Approvals</Text>
      </View>

      {pendingVoters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending voter approvals</Text>
        </View>
      ) : (
        pendingVoters.map((voter) => {
          const isEmailVerified = voter[19]; // email_verified is at index 19
          return (
            <View key={voter[0]} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.name}>
                  {`${voter[2] ?? ''} ${voter[3] ?? ''}`}
                </Text>
                <Text style={styles.detail}>Voter ID: {voter[0]}</Text>
                <Text style={styles.detail}>Email: {voter[13]}</Text>
                <Text style={styles.detail}>Mobile: {voter[12]}</Text>
                <Text style={styles.detail}>Gender: {voter[15]}</Text>
                <Text style={styles.detail}>
                  Address: {[voter[4], voter[6]].filter(Boolean).join(', ')}
                </Text>
                <Text style={styles.detail}>State: {voter[6]}</Text>
                <View style={styles.verificationStatus}>
                  <Text style={[
                    styles.verificationText,
                    isEmailVerified ? styles.verified : styles.unverified
                  ]}>
                    Email Status: {isEmailVerified ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>
                <View style={styles.blockchainInfo}>
                  <Text style={styles.infoText}>
                    Approving this voter will automatically assign a blockchain account from Ganache
                  </Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.approveButton,
                    !isEmailVerified && styles.buttonDisabled
                  ]}
                  onPress={() => handleApprove(voter)}
                  disabled={!isEmailVerified}
                >
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={() => handleReject(voter[0])}
                >
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
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
  verificationStatus: {
    marginTop: 8,
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  verified: {
    backgroundColor: '#34C759',
    color: 'white',
  },
  unverified: {
    backgroundColor: '#FF3B30',
    color: 'white',
  },
  blockchainInfo: {
    backgroundColor: '#f5f8ff',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    color: '#333',
    fontSize: 12,
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
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ApproveVoterMaster;
