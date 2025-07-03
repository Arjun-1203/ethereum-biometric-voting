import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { link } from "./Url";
import Vid from "./Vid";
import { useNavigation } from "@react-navigation/native";

// States data 
const STATES = [
  { value: "Andhra Pradesh", label: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"] },
  { value: "Arunachal Pradesh", label: "Arunachal Pradesh", cities: ["Itanagar", "Naharlagun", "Pasighat", "Namsai"] },
  { value: "Assam", label: "Assam", cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"] },
  { value: "Bihar", label: "Bihar", cities: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"] },
  { value: "Chhattisgarh", label: "Chhattisgarh", cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"] },
  { value: "Goa", label: "Goa", cities: ["Panaji", "Margao", "Vasco da Gama", "Ponda", "Mapusa"] },
  { value: "Gujarat", label: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"] },
  { value: "Haryana", label: "Haryana", cities: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar"] },
  { value: "Himachal Pradesh", label: "Himachal Pradesh", cities: ["Shimla", "Mandi", "Dharamshala", "Solan", "Kullu"] },
  { value: "Jharkhand", label: "Jharkhand", cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"] },
  { value: "Karnataka", label: "Karnataka", cities: ["Bengaluru", "Mysuru", "Hubli", "Mangalore", "Belgaum"] },
  { value: "Kerala", label: "Kerala", cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"] },
  { value: "Madhya Pradesh", label: "Madhya Pradesh", cities: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"] },
  { value: "Maharashtra", label: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"] },
  { value: "Manipur", label: "Manipur", cities: ["Imphal", "Thoubal", "Bishnupur", "Ukhrul", "Chandel"] },
  { value: "Meghalaya", label: "Meghalaya", cities: ["Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara"] },
  { value: "Mizoram", label: "Mizoram", cities: ["Aizawl", "Lunglei", "Champhai", "Saiha", "Kolasib"] },
  { value: "Nagaland", label: "Nagaland", cities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"] },
  { value: "Odisha", label: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"] },
  { value: "Punjab", label: "Punjab", cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"] },
  { value: "Rajasthan", label: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"] },
  { value: "Sikkim", label: "Sikkim", cities: ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Singtam"] },
  { value: "Tamil Nadu", label: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"] },
  { value: "Telangana", label: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"] },
  { value: "Tripura", label: "Tripura", cities: ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Belonia"] },
  { value: "Uttar Pradesh", label: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut"] },
  { value: "Uttarakhand", label: "Uttarakhand", cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur"] },
  { value: "West Bengal", label: "West Bengal", cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"] },
  { value: "Delhi", label: "Delhi", cities: ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"] },
  { value: "Jammu and Kashmir", label: "Jammu and Kashmir", cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua"] },
  { value: "Ladakh", label: "Ladakh", cities: ["Leh", "Kargil", "Diskit", "Zanskar", "Nubra"] },
  { value: "Puducherry", label: "Puducherry", cities: ["Puducherry", "Karaikal", "Mahe", "Yanam"] },
  { value: "Andaman and Nicobar Islands", label: "Andaman and Nicobar Islands", cities: ["Port Blair", "Rangat", "Mayabunder", "Diglipur"] },
  { value: "Chandigarh", label: "Chandigarh", cities: ["Chandigarh"] },
  { value: "Dadra and Nagar Haveli", label: "Dadra and Nagar Haveli", cities: ["Silvassa"] },
  { value: "Daman and Diu", label: "Daman and Diu", cities: ["Daman", "Diu"] },
  { value: "Lakshadweep", label: "Lakshadweep", cities: ["Kavaratti", "Agatti", "Minicoy", "Andrott"] },
];

// Custom picker modal for iOS
const PickerModal = ({ visible, onClose, options, onSelect, selectedValue, title }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>{title || "Select an option"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={options}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  selectedValue === item.value && styles.selectedOption
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionText,
                  selectedValue === item.value && styles.selectedOptionText
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
          />
          
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Registervoter = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    title: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    dob: "",
    addressProof: null,
    ageProof: null,
    constituencyID: "",
    isApproved: "0",
    mobileNbr: "",
    emailID: "",
    password: "",
    gender: "",
    Account: "",
    privatekey: "",
    longitude: "",
    latitude: "",
    image: null,
    faceRecord: null,
  });

  const [errors, setErrors] = useState({
    mobileNbr: "",
    emailID: "",
  });

  const [constituencies, setConstituencies] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [x, setx] = useState(0);
  const [showFaceRecording, setShowFaceRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const [age, setAge] = useState(null);

  // Add state for iOS picker modals
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showConstituencyModal, setShowConstituencyModal] = useState(false);

  useEffect(() => {
    fetchConstituencies();
  }, []);

  useEffect(() => {
    if (x === 1 && showFaceRecording) {
      console.log("[Registervoter.jsx] Face recording completed successfully. Closing modal.");
      setShowFaceRecording(false);
    }
  }, [x, showFaceRecording]);

  // Handle state change and update available cities
  const handleStateChange = (stateValue) => {
    const selectedState = STATES.find(state => state.value === stateValue);
    setForm({ ...form, state: stateValue, city: "" }); // Reset city when state changes
    
    if (selectedState) {
      setAvailableCities(selectedState.cities);
    } else {
      setAvailableCities([]);
    }
  };

  const fetchConstituencies = async () => {
    try {
      const res = await axios.post(`${link}/evoting/viewconstituencymaster`);
      setConstituencies(res.data);
    } catch (err) {
      console.error("Failed to fetch constituencies", err);
      Alert.alert("Error", "Could not load constituencies.");
    }
  };

  const pickImage = async (field) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setForm({ ...form, [field]: result.assets[0].uri });
    }
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please enable location permissions.");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setForm({
      ...form,
      longitude: location.coords.longitude.toString(),
      latitude: location.coords.latitude.toString(),
    });

    Alert.alert(
      "Location Retrieved",
      `Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}`
    );
  };

  const validateMobileNumber = async (mobileNumber) => {
    if (!mobileNumber) {
      return "Mobile number is required";
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      return "Mobile number must be 10 digits";
    }
    try {
      const response = await axios.post(`${link}/evoting/checkmobile`, { mobileNbr: mobileNumber });
      if (response.data.exists) {
        return "Mobile number already registered";
      }
      return "";
    } catch (error) {
      console.error("Error checking mobile number:", error);
      return "";
    }
  };

  const validateEmail = async (email) => {
    if (!email) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address";
    }
    try {
      const response = await axios.post(`${link}/evoting/checkemail`, { emailID: email });
      if (response.data.exists) {
        return "Email already registered";
      }
      return "";
    } catch (error) {
      console.error("Error checking email:", error);
      return "";
    }
  };

  const handleMobileNumberChange = async (text) => {
    setForm({ ...form, mobileNbr: text });
    const error = await validateMobileNumber(text);
    setErrors({ ...errors, mobileNbr: error });
  };

  const handleEmailChange = async (text) => {
    setForm({ ...form, emailID: text });
    const error = await validateEmail(text);
    setErrors({ ...errors, emailID: error });
  };

  const registerVoter = async () => {
    try {
      if (age === null || age < 18) {
        Alert.alert('Age Restriction', 'You must be at least 18 years old to register as a voter.');
        return;
      }
      if (errors.mobileNbr || errors.emailID) {
        Alert.alert('Validation Error', 'Please fix the errors before submitting');
        return;
      }

      // Check if face recording has been completed
      if (x !== 1) {
        Alert.alert('Face Recording Required', 'Please complete the face recording process before registering.');
        return;
      }

      setLoading(true);
      
      if (!form.emailID || !form.password || !form.firstName || !form.lastName) {
        Alert.alert('Error', 'Please fill in all required fields');
        setLoading(false);
        return;
      }

      const data = new FormData();
      Object.keys(form).forEach(key => {
        data.append(key, form[key]);
      });

      const response = await axios.post(`${link}/evoting/insertvotermaster`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        setVerificationSent(true);
        Alert.alert(
          'Verification Email Sent',
          'Please check your email and click the verification link to complete your registration.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to register. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || form.dob;
    
    if (Platform.OS === 'android') {
    setShowDatePicker(false);
    }
    
    if (selectedDate) {
      const iso = selectedDate.toISOString().split("T")[0];
      setSelectedDate(selectedDate);
      setForm({ ...form, dob: iso });
      
      const birthDate = new Date(selectedDate);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      
      setAge(calculatedAge);
      
      if (calculatedAge < 18) {
        Alert.alert(
          "Age Restriction",
          "You must be at least 18 years old to register as a voter.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const hideDatePicker = () => {
    setShowDatePicker(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Select your date of birth";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    
      return (
      <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : null}>
        <View style={Platform.OS === 'ios' ? styles.iosDatePickerHeader : null}>
          <Text style={styles.datePickerHeaderText}>Select Date</Text>
        </View>
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? "spinner" : "default"}
          onChange={onDateChange}
          style={Platform.OS === 'ios' ? styles.iosDatePicker : {}}
          maximumDate={new Date()}
          themeVariant="light"
        />
        {Platform.OS === 'ios' && (
          <TouchableOpacity 
            style={styles.datePickerDoneButton}
            onPress={hideDatePicker}
          >
            <Text style={styles.datePickerDoneText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleRecordingComplete = () => {
    console.log("[Registervoter.jsx] Recording completed, closing modal while upload continues in background.");
    setShowFaceRecording(false);
  };

  const handleFaceRecordingComplete = () => {
    console.log("[Registervoter.jsx] Face recording process completed.");
  };

  // Create picker options
  const titleOptions = [
    { label: "Select title", value: "" },
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Ms.", value: "Ms." },
    { label: "Dr.", value: "Dr." }
  ];
  
  const genderOptions = [
    { label: "Select gender", value: "" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ];
  
  const stateOptions = STATES.map(state => ({
    label: state.label,
    value: state.value
  }));
  
  const cityOptions = availableCities.map(city => ({
    label: city,
    value: city
  }));
  
  const constituencyOptions = constituencies.map((item) => ({
    label: item[1] || "Unknown",
    value: item[0] || ""
  }));
  
  // Render iOS picker or Android picker based on platform
  const renderPicker = (
    value, 
    onValueChange, 
    options, 
    placeholder, 
    showModal, 
    setShowModal,
    modalTitle,
    enabled = true
  ) => {
    if (Platform.OS === 'ios') {
      return (
        <>
          <TouchableOpacity 
            style={[styles.pickerButton, !enabled && styles.disabledPickerButton]} 
            onPress={() => enabled && setShowModal(true)}
            disabled={!enabled}
          >
            <Text style={[
              styles.pickerButtonText, 
              !value && styles.placeholderText
            ]}>
              {value ? options.find(option => option.value === value)?.label : placeholder}
            </Text>
          </TouchableOpacity>
          
          <PickerModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            options={options}
            selectedValue={value}
            onSelect={onValueChange}
            title={modalTitle}
          />
        </>
      );
    } else {
      return (
        <View style={styles.inputWrapper}>
          <Picker
            selectedValue={value}
            style={styles.picker}
            onValueChange={onValueChange}
            enabled={enabled}
            mode="dropdown"
          >
            {options.map((option, index) => (
              <Picker.Item key={index} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      );
    }
  };

  // Add a function to check if the form is valid for registration
  const isRegistrationValid = () => {
    return (
      form.firstName &&
      form.lastName &&
      form.emailID &&
      form.password &&
      form.mobileNbr &&
      !errors.mobileNbr &&
      !errors.emailID &&
      form.dob &&
      form.state &&
      form.city &&
      form.constituencyID &&
      form.gender &&
      x === 1 &&
      age !== null &&
      age >= 18 // Age must be at least 18
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
      {showFaceRecording ? (
        <View style={{ flex: 1 }}>
          <Vid
            username={form.emailID}
            links={link}
            setx={setx}
            data="register"
            sete={() => {}}
            onComplete={handleFaceRecordingComplete}
            onRecordingComplete={handleRecordingComplete}
          />
          <TouchableOpacity
            style={styles.closeFaceRecording}
            onPress={() => {
              console.log("[Registervoter.jsx] Manual close button pressed.");
              setShowFaceRecording(false);
            }}
          >
            <Text style={styles.closeFaceRecordingText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.headerText}>Register as Voter</Text>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                {renderPicker(
                  form.title, 
                  (value) => setForm({ ...form, title: value }), 
                  titleOptions, 
                  "Select title",
                  showTitleModal,
                  setShowTitleModal,
                  "Select Title"
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name</Text>
          <TextInput
                  style={styles.input}
            value={form.firstName}
            onChangeText={(text) => setForm({ ...form, firstName: text })}
                  placeholder="Enter your first name"
          />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={form.lastName}
            onChangeText={(text) => setForm({ ...form, lastName: text })}
                  placeholder="Enter your last name"
                />
              </View>
              
              <View style={styles.formGroup}>
          <Text style={styles.label}>Gender</Text>
                {renderPicker(
                  form.gender, 
                  (value) => setForm({ ...form, gender: value }), 
                  genderOptions, 
                  "Select gender",
                  showGenderModal,
                  setShowGenderModal,
                  "Select Gender"
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton} 
                  onPress={showDatePickerModal}
                >
                  <Text style={styles.dateText}>
                    {form.dob ? formatDate(form.dob) : "Select your date of birth"}
                  </Text>
                </TouchableOpacity>
                {renderDatePicker()}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mobile Number</Text>
          <TextInput
                  style={[styles.input, errors.mobileNbr && styles.inputError]}
            value={form.mobileNbr}
                  onChangeText={handleMobileNumberChange}
                  placeholder="Enter your mobile number"
            keyboardType="phone-pad"
                  maxLength={10}
                />
                {errors.mobileNbr ? (
                  <Text style={styles.errorText}>{errors.mobileNbr}</Text>
                ) : null}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
          <TextInput
                  style={[styles.input, errors.emailID && styles.inputError]}
            value={form.emailID}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email address"
            keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.emailID ? (
                  <Text style={styles.errorText}>{errors.emailID}</Text>
                ) : null}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
          <TextInput
                  style={styles.input}
            value={form.password}
                  onChangeText={(text) => setForm({ ...form, password: text })}
                  placeholder="Create a password"
            secureTextEntry
                />
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.address}
                  onChangeText={(text) => setForm({ ...form, address: text })}
                  placeholder="Enter your complete address"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>State</Text>
                {renderPicker(
                  form.state, 
                  handleStateChange, 
                  stateOptions, 
                  "Select your state",
                  showStateModal,
                  setShowStateModal,
                  "Select State"
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>City</Text>
                {renderPicker(
                  form.city, 
                  (value) => setForm({ ...form, city: value }), 
                  cityOptions, 
                  form.state ? "Select your city" : "Please select a state first",
                  showCityModal,
                  setShowCityModal,
                  "Select City",
                  form.state !== ""
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Constituency</Text>
                {renderPicker(
                  form.constituencyID, 
                  (value) => setForm({ ...form, constituencyID: value }), 
                  constituencyOptions, 
                  "Select your constituency",
                  showConstituencyModal,
                  setShowConstituencyModal,
                  "Select Constituency"
                )}
              </View>
            </View>
            
            {/* Location and document sections */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Location</Text>
              
              <View style={styles.locationContainer}>
                <View style={styles.locationFields}>
                  <View style={styles.locationField}>
                    <Text style={styles.label}>Longitude</Text>
          <TextInput
                      style={styles.input}
                      value={form.longitude}
                      editable={false}
            placeholder="Longitude"
          />
                  </View>
                  
                  <View style={styles.locationField}>
                    <Text style={styles.label}>Latitude</Text>
          <TextInput
                      style={styles.input}
                      value={form.latitude}
                      editable={false}
            placeholder="Latitude"
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.locationButton}
            onPress={getCurrentLocation}
                >
                  <Text style={styles.buttonText}>Get Current Location</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Document Uploads</Text>
              
              <View style={styles.uploadSection}>
                <Text style={styles.label}>Aadhar Card</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
            onPress={() => pickImage("addressProof")}
                >
                  <Text style={styles.buttonText}>
                    {form.addressProof ? "Document Selected" : "Upload Aadhar Card"}
                  </Text>
                </TouchableOpacity>
                {form.addressProof && (
                  <Image
                    source={{ uri: form.addressProof }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                )}
              </View>
              
              <View style={styles.uploadSection}>
                <Text style={styles.label}>Voter ID</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
            onPress={() => pickImage("ageProof")}
                >
                  <Text style={styles.buttonText}>
                    {form.ageProof ? "Document Selected" : "Upload Voter ID"}
                  </Text>
                </TouchableOpacity>
                {form.ageProof && (
                  <Image
                    source={{ uri: form.ageProof }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Face Verification</Text>
              <View style={styles.uploadSection}>
                <Text style={styles.label}>Video Recording for Facial Verification</Text>
                <Text style={styles.helperText}>Please record a short video of your face for voter identification and verification. You must enter your email first.</Text>
                
                <TouchableOpacity
                  style={[
                    styles.uploadButton, 
                    !form.emailID && styles.buttonDisabled,
                    x === 1 && styles.recordingCompleteButton
                  ]}
                  onPress={() => {
                    if (form.emailID) {
                      setShowFaceRecording(true);
                    } else {
                      Alert.alert("Missing Email", "Please enter your email address before recording your face.");
                    }
                  }}
                  disabled={!form.emailID}
                >
                  <Text style={styles.buttonText}>
                    {x === 1 ? "Face Recording Complete ✓" : "Start Face Recording"}
                  </Text>
                </TouchableOpacity>
                
                {x === 1 && (
                  <Text style={styles.verificationSuccessText}>
                    Face recorded and verified successfully!
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.registerButton, 
                (!isRegistrationValid() || loading || verificationSent) && styles.registerButtonDisabled
              ]}
              onPress={registerVoter}
              disabled={!isRegistrationValid() || loading || verificationSent}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>
                  {verificationSent ? 'Verification Email Sent' : 'Register'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Show hint about what's missing if registration button is disabled */}
            {!isRegistrationValid() && !verificationSent && (
              <Text style={styles.registrationRequirementText}>
                {x !== 1 ? 
                  "Face recording is required to complete registration" : 
                  "Please complete all required fields to register"}
              </Text>
            )}

            {verificationSent && (
              <Text style={styles.verificationText}>
                Please check your email for the verification link. You will need to verify your email before you can log in.
              </Text>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e88e5",
    marginVertical: 24,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  formSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#1e88e5",
    paddingLeft: 10,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    ...Platform.select({
      ios: {
        paddingVertical: 14,
      }
    }),
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    ...Platform.select({
      ios: {
        paddingTop: 14,
      }
    }),
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    ...Platform.select({
      ios: {
        zIndex: 1,
        overflow: 'hidden',
        paddingLeft: 10,
        justifyContent: 'center'
      }
    }),
  },
  picker: {
    height: 50,
    width: "100%",
    ...Platform.select({
      ios: {
        backgroundColor: 'transparent',
      }
    }),
  },
  pickerButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 14,
    justifyContent: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  placeholderText: {
    color: '#999999',
  },
  datePickerButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  iosDatePickerContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }
    }),
  },
  iosDatePickerHeader: {
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  datePickerHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  iosDatePicker: {
    height: 180,
    width: "100%",
    backgroundColor: "#ffffff",
  },
  datePickerDoneButton: {
    alignItems: "center", 
    padding: 14,
    backgroundColor: "#1e88e5",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  datePickerDoneText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationFields: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  locationField: {
    width: "48%",
  },
  locationButton: {
    backgroundColor: "#1e88e5",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: "#1e88e5",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginTop: 8,
  },
  registerButton: {
    backgroundColor: "#43a047",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginVertical: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  registerButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
    lineHeight: 18,
  },
  recordingCompleteButton: {
    backgroundColor: "#43a047",
  },
  verificationSuccessText: {
    fontSize: 14,
    color: "#43a047",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  closeFaceRecording: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
    borderRadius: 24,
    zIndex: 100,
  },
  closeFaceRecordingText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  buttonDisabled: {
    backgroundColor: "#bdbdbd",
  },
  verificationText: {
    color: '#43a047',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  inputError: {
    borderColor: '#f44336',
    borderWidth: 1,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    color: '#1e88e5',
    fontSize: 16,
    fontWeight: '500',
  },
  optionsList: {
    maxHeight: 400,
    paddingHorizontal: 4,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 16,
    color: '#424242',
  },
  selectedOptionText: {
    color: '#1e88e5',
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e88e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  doneButton: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1e88e5",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledPickerButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  pickerItemIOS: {
    fontSize: 16,
    height: 120,
    textAlign: 'center',
  },
  registrationRequirementText: {
    color: '#f44336',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});

export default Registervoter;
