import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
  Switch,
  Button,
} from 'react-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { link } from './Url';

const AddElectionDetails = () => {
  const navigation = useNavigation();
  
  const [electionName, setElectionName] = useState('');
  const [nominationLastDate, setNominationLastDate] = useState('');
  const [effDate, setEffDate] = useState('');
  const [resultDate, setResultDate] = useState('');
  
  // Date picker state
  const [showNominationDatePicker, setShowNominationDatePicker] = useState(false);
  const [showEffDatePicker, setShowEffDatePicker] = useState(false);
  const [showResultDatePicker, setShowResultDatePicker] = useState(false);
  
  // Mode state (date or time)
  const [nominationPickerMode, setNominationPickerMode] = useState('date');
  const [electionPickerMode, setElectionPickerMode] = useState('date');
  const [resultPickerMode, setResultPickerMode] = useState('date');
  
  // Date objects for pickers
  const [nominationDate, setNominationDate] = useState(new Date());
  const [electionDate, setElectionDate] = useState(new Date());
  const [resultDateObj, setResultDateObj] = useState(new Date());
  
  // Include time in elections switch
  const [includeTime, setIncludeTime] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "Select date";
    const date = new Date(dateString);
    
    if (includeTime) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const showDateTimePicker = (pickerType, mode) => {
    if (pickerType === 'nomination') {
      setNominationPickerMode(mode);
      setShowNominationDatePicker(true);
    } else if (pickerType === 'election') {
      setElectionPickerMode(mode);
      setShowEffDatePicker(true);
    } else if (pickerType === 'result') {
      setResultPickerMode(mode);
      setShowResultDatePicker(true);
    }
  };

  // For iOS, show "Done" button above date picker
  const renderIOSButtons = (pickerType) => {
    if (Platform.OS !== 'ios') return null;
    
    const handleDone = () => {
      if (pickerType === 'nomination') {
        setShowNominationDatePicker(false);
        if (includeTime && nominationPickerMode === 'date') {
          setTimeout(() => showDateTimePicker('nomination', 'time'), 300);
        }
      } else if (pickerType === 'election') {
        setShowEffDatePicker(false);
        if (includeTime && electionPickerMode === 'date') {
          setTimeout(() => showDateTimePicker('election', 'time'), 300);
        }
      } else if (pickerType === 'result') {
        setShowResultDatePicker(false);
        if (includeTime && resultPickerMode === 'date') {
          setTimeout(() => showDateTimePicker('result', 'time'), 300);
        }
      }
    };
    
    const handleNext = () => {
      if (pickerType === 'nomination' && nominationPickerMode === 'date') {
        setNominationPickerMode('time');
      } else if (pickerType === 'election' && electionPickerMode === 'date') {
        setElectionPickerMode('time');
      } else if (pickerType === 'result' && resultPickerMode === 'date') {
        setResultPickerMode('time');
      } else {
        handleDone();
      }
    };
    
    const isDateMode = 
      (pickerType === 'nomination' && nominationPickerMode === 'date') ||
      (pickerType === 'election' && electionPickerMode === 'date') ||
      (pickerType === 'result' && resultPickerMode === 'date');
    
    return (
      <View style={styles.iosButtonContainer}>
        <TouchableOpacity onPress={handleDone} style={styles.iosButton}>
          <Text style={styles.iosButtonText}>Done</Text>
        </TouchableOpacity>
        {includeTime && isDateMode && (
          <TouchableOpacity onPress={handleNext} style={styles.iosButton}>
            <Text style={styles.iosButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const onNominationDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || nominationDate;
    
    if (Platform.OS === 'android') {
      setShowNominationDatePicker(false);
      
      // If in date mode and date was selected, automatically move to time mode if includeTime is true
      if (nominationPickerMode === 'date' && selectedDate && includeTime) {
        setNominationDate(currentDate);
        setTimeout(() => {
          showDateTimePicker('nomination', 'time');
        }, 500);
        return;
      }
    }
    
    if (selectedDate) {
      setNominationDate(currentDate);
      
      if (includeTime) {
        // For dates with time, send as ISO string
        setNominationLastDate(currentDate.toISOString());
      } else {
        // For dates without time, create a date string in YYYY-MM-DD format
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        setNominationLastDate(`${year}-${month}-${day}`);
      }
    }
  };
  
  const onElectionDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || electionDate;
    
    if (Platform.OS === 'android') {
      setShowEffDatePicker(false);
      
      // If in date mode and date was selected, automatically move to time mode if includeTime is true
      if (electionPickerMode === 'date' && selectedDate && includeTime) {
        setElectionDate(currentDate);
        setTimeout(() => {
          showDateTimePicker('election', 'time');
        }, 500);
        return;
      }
    }
    
    if (selectedDate) {
      setElectionDate(currentDate);
      
      if (includeTime) {
        // For dates with time, send as ISO string
        setEffDate(currentDate.toISOString());
      } else {
        // For dates without time, create a date string in YYYY-MM-DD format
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        setEffDate(`${year}-${month}-${day}`);
      }
    }
  };
  
  const onResultDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || resultDateObj;
    
    if (Platform.OS === 'android') {
      setShowResultDatePicker(false);
      
      // If in date mode and date was selected, automatically move to time mode if includeTime is true
      if (resultPickerMode === 'date' && selectedDate && includeTime) {
        setResultDateObj(currentDate);
        setTimeout(() => {
          showDateTimePicker('result', 'time');
        }, 500);
        return;
      }
    }
    
    if (selectedDate) {
      setResultDateObj(currentDate);
      
      if (includeTime) {
        // For dates with time, send as ISO string
        setResultDate(currentDate.toISOString());
      } else {
        // For dates without time, create a date string in YYYY-MM-DD format
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        setResultDate(`${year}-${month}-${day}`);
      }
    }
  };

  const submitData = async () => {
    if (!electionName || !nominationLastDate || !effDate || !resultDate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Validate dates
    const now = new Date();
    const nomination = new Date(nominationLastDate);
    const election = new Date(effDate);
    const result = new Date(resultDate);
    
    if (nomination < now) {
      Alert.alert('Error', 'Nomination date must be in the future');
      return;
    }
    
    if (election <= nomination) {
      Alert.alert('Error', 'Election date must be after nomination date');
      return;
    }
    
    if (result <= election) {
      Alert.alert('Error', 'Result date must be after election date');
      return;
    }
    
    setLoading(true);
    
    try {
      const value = {
        electionName,
        nominationLastDate,
        effDate,
        resultdate: resultDate,
        includeTime // Send this flag to backend
      };
      
      const response = await axios.post(`${link}/evoting/insertelectiondetails`, value);
      
      setLoading(false);
      Alert.alert(
        'Success',
        'Election added successfully',
        [{ text: 'OK', onPress: () => navigation.navigate('admin') }]
      );
    } catch (error) {
      setLoading(false);
      console.error('Error adding election:', error);
      Alert.alert('Error', 'Failed to add election. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Add Election</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Election Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter election name"
            value={electionName}
            onChangeText={setElectionName}
          />
        </View>
        
        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Include Time (Hours & Minutes)</Text>
            <Switch
              value={includeTime}
              onValueChange={setIncludeTime}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={includeTime ? "#007AFF" : "#f4f3f4"}
            />
          </View>
          <Text style={styles.switchHint}>
            {includeTime 
              ? "Elections can be scheduled down to the minute" 
              : "Elections will be scheduled for full days only"}
          </Text>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nomination Last Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => showDateTimePicker('nomination', 'date')}
          >
            <Text style={styles.dateText}>
              {nominationLastDate ? formatDate(nominationLastDate) : "Select nomination end date"}
            </Text>
          </TouchableOpacity>
          
          {showNominationDatePicker && Platform.OS === 'ios' && renderIOSButtons('nomination')}
          
          {showNominationDatePicker && (
            <DateTimePicker
              testID="nominationDatePicker"
              value={nominationDate}
              mode={nominationPickerMode}
              is24Hour={false}
              display={Platform.OS === 'ios' ? "spinner" : "default"}
              onChange={onNominationDateChange}
              minimumDate={new Date()}
              themeVariant="light"
              textColor="#000000"
              accentColor="#007AFF"
              style={styles.datePicker}
            />
          )}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Election Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => showDateTimePicker('election', 'date')}
          >
            <Text style={styles.dateText}>
              {effDate ? formatDate(effDate) : "Select election date"}
            </Text>
          </TouchableOpacity>
          
          {showEffDatePicker && Platform.OS === 'ios' && renderIOSButtons('election')}
          
          {showEffDatePicker && (
            <DateTimePicker
              testID="electionDatePicker"
              value={electionDate}
              mode={electionPickerMode}
              is24Hour={false}
              display={Platform.OS === 'ios' ? "spinner" : "default"}
              onChange={onElectionDateChange}
              minimumDate={nominationLastDate ? new Date(nominationLastDate) : new Date()}
              themeVariant="light"
              textColor="#000000"
              accentColor="#007AFF"
              style={styles.datePicker}
            />
          )}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Result Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => showDateTimePicker('result', 'date')}
          >
            <Text style={styles.dateText}>
              {resultDate ? formatDate(resultDate) : "Select result date"}
            </Text>
          </TouchableOpacity>
          
          {showResultDatePicker && Platform.OS === 'ios' && renderIOSButtons('result')}
          
          {showResultDatePicker && (
            <DateTimePicker
              testID="resultDatePicker"
              value={resultDateObj}
              mode={resultPickerMode}
              is24Hour={false}
              display={Platform.OS === 'ios' ? "spinner" : "default"}
              onChange={onResultDateChange}
              minimumDate={effDate ? new Date(effDate) : new Date()}
              themeVariant="light"
              textColor="#000000"
              accentColor="#007AFF"
              style={styles.datePicker}
            />
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={submitData}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding...' : 'Add Election'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  datePicker: {
    backgroundColor: '#fff',
    marginTop: 10,
  },
  iosButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#dedede',
    borderBottomWidth: 1,
    borderBottomColor: '#dedede',
    marginTop: 10,
  },
  iosButton: {
    padding: 10,
    paddingHorizontal: 20,
  },
  iosButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddElectionDetails; 