import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { link } from './Url';

const AddPoliticalParty = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const editData = route.params?.editData;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editData ? editData[1] : '',
    symbol: editData ? (editData[2] ? link + '/static/' + editData[2] : '') : '',
  });
  const [newImage, setNewImage] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setFormData({ ...formData, symbol: result.assets[0].uri });
      setNewImage(true);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter political party name');
      return;
    }
    if (!formData.symbol) {
      Alert.alert('Error', 'Please upload party symbol');
      return;
    }
    setLoading(true);
    try {
      let imageName = editData ? editData[2] : '';
      if (newImage || (!editData && formData.symbol)) {
        // Upload image if new or adding
        const fileNameParts = formData.symbol.split('/');
        imageName = fileNameParts[fileNameParts.length - 1];
        const imageData = new FormData();
        imageData.append('file', {
          uri: formData.symbol,
          name: imageName,
          type: 'image/jpeg',
        });
        imageData.append('fileName', imageName);
        await axios.post(`${link}/evoting/upload`, imageData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      if (editData) {
        await axios.post(`${link}/evoting/updatepoliticalpartymaster`, {
          politicalPartyID: editData[0],
          politicalPartyName: formData.name,
          imageName: imageName,
        });
        Alert.alert('Success', 'Political party updated successfully');
      } else {
        await axios.post(`${link}/evoting/insertpoliticalpartymaster`, {
          politicalPartyName: formData.name,
          imageName: imageName,
        });
        Alert.alert('Success', 'Political party added successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', editData ? 'Failed to update political party' : 'Failed to add political party');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Add New Political Party</Text>
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
          <TouchableOpacity style={[styles.input, {justifyContent:'center',alignItems:'center'}]} onPress={pickImage}>
            <Text style={{color:'#007AFF'}}>{formData.symbol ? 'Change Symbol Image' : 'Pick Symbol Image'}</Text>
          </TouchableOpacity>
          {formData.symbol ? (
            <View style={{alignItems:'center',marginTop:8}}>
              <Text style={{fontSize:12, color:'#666'}}>Selected Image:</Text>
              <Image source={{ uri: formData.symbol }} style={{ width: 80, height: 80, marginTop: 4, borderRadius: 8 }} />
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>{editData ? 'Update Political Party' : 'Add Political Party'}</Text>
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

export default AddPoliticalParty; 