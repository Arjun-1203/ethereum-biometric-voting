import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { link } from "./Url";

const Filenomination = ({ route }) => {
  const focus = useIsFocused();
  const id = route.params.id;
  const navigation = useNavigation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(id); // use actual voter ID here

  useEffect(() => {
    fetchElections(id);
  }, [focus]);

  const fetchElections = async (voterid) => {
    try {
      const response = await axios.post(
        link + "/evoting/viewelectiondavaiable",
        { voterid }
      );
      setData(response.data);
    } catch (error) {
      console.error("Error fetching elections:", error);
      Alert.alert("Error", "Could not load election data.");
    } finally {
      setLoading(false);
    }
  };

  const withdrawNomination = async (electionId) => {
    try {
      await axios.post(link + "/evoting/withdrawnomination", {
        eid: electionId,
        voterid: user,
      });
      fetchElections(user);
    } catch (error) {
      console.error("Withdraw Error:", error);
      Alert.alert("Error", "Could not withdraw nomination.");
    }
  };

  const handleNomination = (electionID, electionName, status) => {
    if (status === "nominated") {
      Alert.alert("Withdraw Nomination", "Are you sure you want to withdraw?", [
        { text: "Cancel", style: "cancel" },
        { text: "Withdraw", onPress: () => withdrawNomination(electionID) },
      ]);
    } else {
      navigation.navigate("AddElectionNomination", {
        electionID,
        electionName,
        id,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Elections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Elections</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item[0].toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.infoBlock}>
              <Text style={styles.electionTitle}>{item[1]}</Text>
              <Text style={styles.subText}>Election ID: {item[0]}</Text>
              <Text style={styles.subText}>
                Nomination Last Date: {item[2]}
              </Text>
              <Text style={styles.subText}>Effective Date: {item[3]}</Text>
              <Text style={styles.subText}>Result Date: {item[4]}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.voteButton}
                onPress={() =>
                  navigation.navigate("cv", {
                    voterID: id,
                    electionID: item[0],
                    requireOtp: true
                  })
                }
              >
                <Text style={styles.buttonText}>Cast Vote</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No elections available.</Text>
        }
      />
    </View>
  );
};

export default Filenomination;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef3f8",
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  electionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 6,
  },
  subText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
  },
  infoBlock: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nominateButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  withdrawButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  voteButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef3f8",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
  },
});
