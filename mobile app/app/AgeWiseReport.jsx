import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import axios from 'axios';
import { link } from './Url';

const AgeWiseReport = () => {
  const [loading, setLoading] = useState(true);
  const [ageGroups, setAgeGroups] = useState([]);

  useEffect(() => {
    fetchAgeData();
  }, []);

  const fetchAgeData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${link}/evoting/Agewisereport`);
      // Backend returns array of arrays: [age, count]
      setAgeGroups(response.data.map((d) => ({ age: d[0], count: d[1] })));
    } catch (error) {
      console.error('Error fetching age data:', error);
      Alert.alert('Error', 'Failed to load age distribution data');
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
        <Text style={styles.headerText}>Age-wise Voter Distribution</Text>
      </View>

      {ageGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      ) : (
        ageGroups.map((group) => (
          <View key={group.age} style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.ageGroup}>{group.age}</Text>
              <Text style={styles.count}>Total Voters: {group.count}</Text>
              <Text style={styles.percentage}>
                Percentage: {((group.count / ageGroups.reduce((acc, curr) => acc + curr.count, 0)) * 100).toFixed(2)}%
              </Text>
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
  ageGroup: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  count: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  percentage: {
    fontSize: 16,
    color: '#666',
  },
});

export default AgeWiseReport; 