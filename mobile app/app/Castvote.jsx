import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import axios from "axios";

import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { link } from "./Url";
import Vid from "./Vid";
import ContinuousVerification from "./ContinuousVerification";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Castvote = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { electionID, voterID, requireOtp } = route.params;
  const [blockchaingenerated, setBlockchaingenerated] = useState("");
  const [nom, setNom] = useState([]);
  const [pol, setPol] = useState([]);
  const [party, setParty] = useState("");
  const [otp, setOtp] = useState("");
  const [checkOtp, setCheckOtp] = useState("");
  const [sk, setSk] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [otpStage, setOtpStage] = useState(0);
  const [e, sete] = useState(0);
  const [d, setd] = useState(0);
  const [isVerified, setIsVerified] = useState(true);
  const [showOtpInput, setShowOtpInput] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      axios
        .post(link + "/evoting/getcastvote", {
          voterid: voterID,
          electionid: electionID,
        })
        .then((res) => {
          console.log(res.data);
          setNom(Array.isArray(res.data["constituency"]) ? res.data["constituency"] : []);
          setPol(Array.isArray(res.data["political"]) ? res.data["political"] : []);
          if(res.data.completed===0){
            setx(0)
          }
          else{
            setx(2)
          }
        });
    };

    fetchData();
    if (requireOtp) {
      generateOtp();
      setShowOtpInput(true);
    }
  }, []);
  

  const handleVerificationFailed = () => {
    setIsVerified(false);
    Alert.alert(
      "Verification Failed",
      "Your identity could not be verified. Please ensure you are the correct user.",
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const submitData = () => {
    if (!isVerified) {
      Alert.alert("Error", "Please complete identity verification before submitting your vote.");
      return;
    }

    if (!sk) {
      Alert.alert("Error", "Please select a contestant before submitting.");
      return;
    }

    const value = {
      voterid: voterID,
      blockchaingenerated,
      electionid: electionID,
      contestantid: sk,
    };

    axios
      .post(link + "/evoting/insertcastvote", value)
      .then((res) => {
        console.log("Vote API response:", res.data);
        Alert.alert("Success", "Vote submitted successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("fn", { id: voterID }),
          },
        ]);
      })
      .catch((err) => {
        console.log("Vote API error:", err.response ? err.response.data : err.message);
        Alert.alert("Error", "Something went wrong. Please try again.");
      });
  };

  const generateOtp = async () => {
    const generatedOtp = Math.floor(Math.random() * 10000);
    console.log(generatedOtp);
    const value = { otp: generatedOtp.toString(), id: voterID };
    axios
      .post(link + "/evoting/genertotp", value)
      .then(() => {
        setOtpStage(1);
        setCheckOtp(generatedOtp.toString());
        setShowOtpInput(true);
      })
      .catch(() => {
        Alert.alert("Error", "Something went wrong. Please try again.");
      });
  };

  const checkMyOtp = () => {
    if (otp === checkOtp) {
      Alert.alert("Success", "OTP verified!");
      setOtpStage(2);
      sete(1);
      setShowOtpInput(false);
    } else {
      Alert.alert("Error", "Incorrect OTP. Try again.");
    }
  };
  const [x, setx] = useState(0);
  const renderCandidateCard = (candidate) => {
    const [partyName, candidateName, contestantID, imageURL] = candidate;
    const isSelected = sk === contestantID;
    
    return (
      <TouchableOpacity
        key={contestantID}
        style={[
          styles.candidateCard,
          isSelected && styles.candidateCardSelected
        ]}
        onPress={() => {
          setParty(partyName);
          setSk(contestantID);
          setSelectedImage(link + `/static/${imageURL}`);
        }}
      >
        <Image 
          source={{ uri: link + `/static/${imageURL}` }} 
          style={styles.candidateThumbnail}
        />
        <View style={styles.candidateDetails}>
          <Text style={styles.candidateName}>{candidateName}</Text>
          <Text style={styles.candidateParty}>{partyName}</Text>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#28a745" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const checking = () => {
    if (x === 0) {
      return (
        <View style={styles.mainContainer}>
          <View style={styles.verificationContainer}>
            <ContinuousVerification
              username={voterID}
              links={link}
              onVerificationFailed={handleVerificationFailed}
            />
          </View>
          <ScrollView 
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Cast Your Vote</Text>
              <Text style={styles.subtitle}>Select your preferred candidate</Text>
            </View>

            {showOtpInput ? (
              <View style={styles.otpInputContainer}>
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter OTP"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={otp}
                  onChangeText={setOtp}
                />
                <TouchableOpacity 
                  style={styles.verifyButton}
                  onPress={checkMyOtp}
                >
                  <Text style={styles.verifyButtonText}>Verify OTP</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Constituency</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="map-marker" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      value={nom[1] || ""} 
                      editable={false} 
                      placeholder="Your constituency"
                    />
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Select Contestant</Text>
                  <View style={styles.candidatesList}>
                    {Array.isArray(pol) && pol.map(renderCandidateCard)}
                  </View>
                </View>

                {selectedImage && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your Selection</Text>
                    <View style={styles.selectedCandidateContainer}>
                      <Image source={{ uri: selectedImage }} style={styles.selectedCandidateImage} />
                      <View style={styles.selectedCandidateInfo}>
                        <Text style={styles.selectedCandidateName}>{pol.find(p => p[2] === sk)?.[1]}</Text>
                        <Text style={styles.selectedCandidateParty}>{party}</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.otpContainer}>
                  {e !== 0 ? (
                    <TouchableOpacity 
                      style={[styles.submitButton, !isVerified && styles.submitButtonDisabled]}
                      onPress={submitData}
                      disabled={!isVerified}
                    >
                      <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Submit Vote</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      );
    } else if (x === 1) {
      return (
        <Vid
          username={voterID}
          links={link}
          setx={setx}
          data={"login"}
          sete={sete}
        />
      );
    } else {
      return (
        <View style={styles.alreadyVotedContainer}>
          <MaterialCommunityIcons name="check-circle" size={60} color="#28a745" />
          <Text style={styles.alreadyVotedText}>
            You have already cast your vote.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };
  return <>{checking()}</>;
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f8f9fa',
  },
  verificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    color: '#333',
    fontSize: 16,
  },
  candidatesList: {
    marginTop: 8,
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  candidateCardSelected: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff8',
  },
  candidateThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  candidateDetails: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  candidateParty: {
    fontSize: 14,
    color: '#666',
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  selectedCandidateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fff8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  selectedCandidateImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  selectedCandidateInfo: {
    flex: 1,
  },
  selectedCandidateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedCandidateParty: {
    fontSize: 16,
    color: '#28a745',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  otpContainer: {
    marginTop: 8,
  },
  otpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
  },
  otpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  otpInputContainer: {
    marginTop: 8,
  },
  otpInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  verifyButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  alreadyVotedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alreadyVotedText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Castvote;
