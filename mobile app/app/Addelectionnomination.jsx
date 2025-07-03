import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker"; // ✅ correct import
import { link } from "./Url";

const Addelectionnomination = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Check if route.params exists, if not, provide default values
  const params = route.params || {};
  const electionID = params.electionID || "";
  const electionName = params.electionName || "";
  const voterID = params.id || "";

  // Add new state for admin mode and elections list
  const [isAdminMode, setIsAdminMode] = useState(!route.params);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState("");
  const [selectedElectionName, setSelectedElectionName] = useState("");
  const [adminVoterID, setAdminVoterID] = useState("");
  const [voters, setVoters] = useState([]); // New state for voters list

  const [politicalPartyID, setPoliticalPartyID] = useState("");
  const [constituencyID, setConstituencyID] = useState("");

  const [politicalParties, setPoliticalParties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);

  useEffect(() => {
    // Fetch political parties and constituencies
    axios.post(link + "/evoting/getnomination").then((res) => {
      setPoliticalParties(res.data["political"]);
      setConstituencies(res.data["constituency"]);
    });

    // Fetch voters with correct endpoint
    axios.post(link + "/evoting/viewvotermaster").then((res) => {
      setVoters(res.data);
    });

    // If in admin mode, fetch available elections
    if (isAdminMode) {
      axios.post(link + "/evoting/viewelectiondetails").then((res) => {
        setElections(res.data);
      });
    }
  }, [isAdminMode]);

  const submitData = () => {
    // Validate all required fields
    if (isAdminMode && (!selectedElection || !adminVoterID)) {
      Alert.alert("Error", "Please select election and enter voter ID.");
      return;
    }

    if (!politicalPartyID || !constituencyID) {
      Alert.alert("Error", "Please select political party and constituency.");
      return;
    }

    const finalElectionID = isAdminMode ? selectedElection : electionID;
    const finalVoterID = isAdminMode ? adminVoterID : voterID;

    if (!finalElectionID || !finalVoterID) {
      Alert.alert("Error", "Election or Voter information is missing.");
      return;
    }

    const value = {
      voterID: finalVoterID,
      politicalPartyID,
      electionID: finalElectionID,
      constituencyID,
    };

    axios
      .post(link + "/evoting/insertelectionnomitation", value)
      .then((response) => {
        if (response.data.status === "error") {
          Alert.alert("Error", response.data.message || "Nomination filing failed.");
          return;
        }
        
        Alert.alert("Success", "Nomination filed successfully!", [
          {
            text: "OK",
            onPress: () => {
              if (isAdminMode) {
                navigation.navigate("admin");
              } else {
                navigation.navigate("fn", { id: finalVoterID });
              }
            },
          },
        ]);
      })
      .catch((error) => {
        console.error("Nomination error:", error);
        Alert.alert("Error", "Something went wrong. Please try again.");
      });
  };

  // Handle election selection in admin mode
  const handleElectionChange = (electionId) => {
    setSelectedElection(electionId);
    // Find the election name for the selected ID
    const election = elections.find((e) => e[0] === electionId);
    setSelectedElectionName(election ? election[1] : "");
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>File Nomination</Text>

        {isAdminMode ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Election</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedElection}
                  onValueChange={handleElectionChange}
                  style={styles.picker}
                >
                  <Picker.Item label="Select an Election" value="" />
                  {elections.map((election) => (
                    <Picker.Item
                      key={election[0]}
                      label={election[1]}
                      value={election[0]}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Voter ID</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={adminVoterID}
                  onValueChange={(itemValue) => setAdminVoterID(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a Voter" value="" />
                  {voters.map((voter) => (
                    <Picker.Item
                      key={voter[0]}
                      label={`${voter[2]} ${voter[3]} (ID: ${voter[0]})`}
                      value={voter[0]}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {selectedElectionName && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Election Name</Text>
                <TextInput
                  style={styles.input}
                  value={selectedElectionName}
                  editable={false}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Election Name</Text>
            <TextInput
              style={styles.input}
              value={electionName}
              editable={false}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Political Party</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={politicalPartyID}
              onValueChange={(itemValue) => setPoliticalPartyID(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a Political Party" value="" />
              {politicalParties.map((party) => (
                <Picker.Item key={party[0]} label={party[1]} value={party[0]} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Constituency</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={constituencyID}
              onValueChange={(itemValue) => setConstituencyID(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a Constituency" value="" />
              {constituencies.map((cons) => (
                <Picker.Item key={cons[0]} label={cons[1]} value={cons[0]} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button title="Submit" onPress={submitData} color="#007bff" />
        </View>
      </View>
    </ScrollView>
  );
};

export default Addelectionnomination;

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    minHeight: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  picker: {
    height: Platform.OS === "ios" ? 150 : 50,
    width: "100%",
  },
  buttonContainer: {
    marginVertical: 20,
  },
});
