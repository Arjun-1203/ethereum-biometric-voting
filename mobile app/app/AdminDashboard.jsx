import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("dashboard");

  const adminFunctions = [
    {
      title: "Voter Management",
      icon: "account-group",
      items: [
        { name: "View Voters", screen: "viewvotermaster" },
        { name: "Approve Voters", screen: "approvevotermaster" },
      ],
    },
    {
      title: "Election Management",
      icon: "vote",
      items: [
        { name: "Add Election", screen: "addelectiondetails" },
        { name: "View Elections", screen: "viewelectiondetails" },
        { name: "Publish Results", screen: "publishelectionresult" },
        { name: "View Results", screen: "er" },
      ],
    },
    {
      title: "Nomination Management",
      icon: "account-check",
      items: [
        { name: "Add Nomination", screen: "AddElectionNomination" },
        { name: "View Nominations", screen: "viewelectionnomination" },
      ],
    },
    {
      title: "Constituency Management",
      icon: "map-marker-multiple",
      items: [
        { name: "Add Constituency", screen: "addconstituency" },
        { name: "View Constituencies", screen: "viewconstituency" },
      ],
    },
    {
      title: "Party Management",
      icon: "flag",
      items: [
        { name: "Add Party", screen: "addpoliticalparty" },
        { name: "View Parties", screen: "viewpoliticalparty" },
      ],
    },
    {
      title: "Reports",
      icon: "chart-bar",
      items: [
        { name: "Age-wise Report", screen: "agewisereport" },
        { name: "Gender-wise Report", screen: "genderwisereport" },
      ],
    },
  ];

  const renderFunctionCard = (title, icon, items) => (
    <View style={styles.card} key={title}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={icon} size={24} color="#007bff" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardContent}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.functionItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.functionText}>{item.name}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <ScrollView style={styles.content}>
        {adminFunctions.map((section) =>
          renderFunctionCard(section.title, section.icon, section.items)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#fff",
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginLeft: 12,
  },
  cardContent: {
    padding: 8,
  },
  functionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  functionText: {
    fontSize: 16,
    color: "#333",
  },
});

export default AdminDashboard; 