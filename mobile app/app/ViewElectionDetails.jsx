import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { link } from './Url';
import { MaterialIcons } from '@expo/vector-icons';

const ViewElectionDetails = () => {
  const navigation = useNavigation();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [endingElection, setEndingElection] = useState(null); // Track which election is being ended

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${link}/evoting/viewelectiondetails`);
      setElections(response.data);
    } catch (error) {
      console.error('Error fetching elections:', error);
      Alert.alert('Error', 'Failed to load elections. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchElections();
  };

  const deleteElection = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this election?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(`${link}/evoting/deleteelectiondetails`, { id });
              Alert.alert('Success', 'Election deleted successfully');
              fetchElections();
            } catch (error) {
              console.error('Error deleting election:', error);
              Alert.alert('Error', 'Failed to delete election. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEndElection = (electionId) => {
    Alert.alert(
      'End Election',
      'Are you sure you want to end this election and publish results?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Election',
          style: 'default',
          onPress: async () => {
            try {
              setEndingElection(electionId);
              const response = await axios.post(`${link}/evoting/publishresult`, { 
                electionid: electionId 
              });
              
              if (response.data.status === 'success') {
                Alert.alert(
                  'Success', 
                  'Election ended and results published successfully',
                  [
                    {
                      text: 'View Results',
                      onPress: () => navigation.navigate('electionresult'),
                    },
                    {
                      text: 'OK',
                      onPress: fetchElections,
                    }
                  ]
                );
              } else {
                Alert.alert('Error', response.data.message || 'Failed to end election');
              }
            } catch (error) {
              console.error('Error ending election:', error);
              Alert.alert('Error', 'Failed to end election. Please try again.');
            } finally {
              setEndingElection(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    // Convert to UTC first to avoid timezone issues
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return utcDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderElectionItem = ({ item }) => {
    // Check if election date has passed for visual status
    const electionDate = new Date(item[3]);
    const today = new Date();
    const isElectionPassed = electionDate < today;
    
    // Determine status: 'completed' from backend, 'ended' for finalized elections,
    // or check if election date has passed
    const isCompleted = item[5] === 'completed' || item[5] === 'ended' || isElectionPassed;
    
    // Determine if election is eligible for ending (election date passed but not yet ended)
    const canEndElection = isElectionPassed && item[5] === 'started';
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Election #{item[0]}</Text>
          <View style={styles.actionButtons}>
            {canEndElection && (
              <TouchableOpacity
                style={[styles.actionButton, styles.endButton]}
                onPress={() => handleEndElection(item[0])}
                disabled={endingElection === item[0]}
              >
                {endingElection === item[0] ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="done-all" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteElection(item[0])}
            >
              <MaterialIcons name="delete" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{item[1]}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Nomination End:</Text>
            <Text style={styles.value}>{formatDate(item[2])}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Election Date:</Text>
            <Text style={styles.value}>{formatDate(item[3])}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Result Date:</Text>
            <Text style={styles.value}>{formatDate(item[4])}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[
              styles.status,
              isCompleted ? styles.statusCompleted : styles.statusActive
            ]}>
              {isCompleted ? 'Completed' : 'Active'}
            </Text>
          </View>
          
          {canEndElection && (
            <TouchableOpacity
              style={styles.endElectionButton}
              onPress={() => handleEndElection(item[0])}
              disabled={endingElection === item[0]}
            >
              {endingElection === item[0] ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.endElectionButtonText}>End Election & Publish Results</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Elections</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('addelectiondetails')}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.loadingText}>Loading elections...</Text>
        </View>
      ) : elections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No elections found</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
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
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007aff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  endButton: {
    backgroundColor: '#34c759',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cardContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
  },
  statusActive: {
    color: '#34c759',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  statusCompleted: {
    color: '#ff9500',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  endElectionButton: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  endElectionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007aff',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ViewElectionDetails; 