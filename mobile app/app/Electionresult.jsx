import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { link } from './Url';
import { MaterialIcons } from '@expo/vector-icons';

const Electionresult = () => {
  const navigation = useNavigation();
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${link}/evoting/viewelectiondetails`);
      console.log('All elections:', response.data.length);
      
      // Filter only ended elections
      const endedElections = response.data.filter(election => 
        election[5] === 'ended' || election[5] === 'completed'
      );
      console.log('Ended elections:', endedElections.length);
      
      setElections(endedElections);
    } catch (error) {
      console.error('Error fetching elections:', error);
      Alert.alert('Error', 'Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  const fetchElectionResults = async (electionId) => {
    try {
      setLoadingResults(true);
      const response = await axios.post(`${link}/evoting/ElectionResultPoliticalPartyWise`);
      
      // Filter results for the selected election
      const electionResults = response.data.filter(result => result[0] === electionId);
      
      // Sort by vote count in descending order
      electionResults.sort((a, b) => b[2] - a[2]);
      
      setResults(electionResults);
      setLoadingResults(false);
    } catch (error) {
      console.error('Error fetching election results:', error);
      Alert.alert('Error', 'Failed to load election results');
      setLoadingResults(false);
    }
  };

  const handleElectionSelect = (election) => {
    setSelectedElection(election);
    fetchElectionResults(election[0]);
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

  const renderElectionItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.electionCard,
        selectedElection && selectedElection[0] === item[0] && styles.selectedElectionCard
      ]}
      onPress={() => handleElectionSelect(item)}
    >
      <Text style={styles.electionTitle}>{item[1]}</Text>
      <Text style={styles.electionDate}>
        <Text style={styles.dateLabel}>Election Date: </Text>
        {formatDate(item[3])}
      </Text>
      <Text style={styles.resultDate}>
        <Text style={styles.dateLabel}>Result Date: </Text>
        {formatDate(item[4])}
      </Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status: </Text>
        <Text style={styles.statusValue}>{item[5] === 'ended' ? 'Completed' : item[5]}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderResultItem = ({ item }) => (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.candidateName}>{item[4]}</Text>
        <Text style={styles.voteCount}>{item[2]} votes</Text>
      </View>
      <View style={styles.resultDetails}>
        <Text style={styles.resultDetail}>Election: {item[3]}</Text>
        <Text style={styles.resultDetail}>Party: {item[5]}</Text>
        <Text style={styles.resultDetail}>Constituency: {item[6] || 'N/A'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading elections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Election Results</Text>
      </View>

      {elections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No completed elections found</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchElections}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.electionsContainer}>
            <Text style={styles.sectionTitle}>Completed Elections</Text>
            <FlatList
              data={elections}
              renderItem={renderElectionItem}
              keyExtractor={(item) => item[0].toString()}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.electionsList}
            />
          </View>

          <View style={styles.resultsContainer}>
            {selectedElection ? (
              <>
                <Text style={styles.sectionTitle}>
                  Results for {selectedElection[1]}
                </Text>
                {loadingResults ? (
                  <View style={styles.loadingResultsContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading results...</Text>
                  </View>
                ) : results.length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No results available for this election</Text>
                  </View>
                ) : (
                  <FlatList
                    data={results}
                    renderItem={renderResultItem}
                    keyExtractor={(item, index) => `${item[0]}-${index}`}
                    contentContainerStyle={styles.resultsList}
                  />
                )}
              </>
            ) : (
              <View style={styles.selectElectionContainer}>
                <MaterialIcons name="touch-app" size={40} color="#bbb" />
                <Text style={styles.selectElectionText}>
                  Select an election to view results
                </Text>
              </View>
            )}
          </View>
        </View>
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
    backgroundColor: '#007AFF',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
  content: {
    flex: 1,
    padding: 16,
  },
  electionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  electionsList: {
    paddingVertical: 8,
  },
  electionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedElectionCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  electionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  electionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateLabel: {
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resultsList: {
    paddingBottom: 16,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  voteCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  resultDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectElectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  selectElectionText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default Electionresult;
