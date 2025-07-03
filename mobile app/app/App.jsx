import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./Login";
import Registervoter from "./Registervoter";
import Filenomination from "./Filenomination";
import Castvote from "./Castvote";
import Electionresult from "./Electionresult";
import Addelectionnomination from "./Addelectionnomination";
import AdminDashboard from "./AdminDashboard";
import ViewVoterMaster from "./ViewVoterMaster";
import ApproveVoterMaster from "./ApproveVoterMaster";
import AddVoterMaster from "./AddVoterMaster";
import UpdateVoterMaster from "./UpdateVoterMaster";
import ViewElectionNomination from "./ViewElectionNomination";
import PublishElectionResult from "./PublishElectionResult";
import AddConstituency from "./AddConstituency";
import ViewConstituency from "./ViewConstituency";
import AddPoliticalParty from "./AddPoliticalParty";
import ViewPoliticalParty from "./ViewPoliticalParty";
import AgeWiseReport from "./AgeWiseReport";
import GenderWiseReport from "./GenderWiseReport";
import AddElectionDetails from "./AddElectionDetails";
import ViewElectionDetails from "./ViewElectionDetails";

const Stack = createNativeStackNavigator();
const App = () => {
  return (
    <>
      <Stack.Navigator
        initialRouteName="login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="login" component={Login} />
        <Stack.Screen name="reg" component={Registervoter} />
        <Stack.Screen name="fn" component={Filenomination} />
        <Stack.Screen name="cv" component={Castvote} />
        <Stack.Screen name="er" component={Electionresult} />
        <Stack.Screen
          name="AddElectionNomination"
          component={Addelectionnomination}
        />
        <Stack.Screen name="admin" component={AdminDashboard} />
        
        {/* Admin Screens */}
        <Stack.Screen name="viewvotermaster" component={ViewVoterMaster} />
        <Stack.Screen name="approvevotermaster" component={ApproveVoterMaster} />
        <Stack.Screen name="addvotermaster" component={AddVoterMaster} />
        <Stack.Screen name="updatevotermaster" component={UpdateVoterMaster} />
        <Stack.Screen name="viewelectionnomination" component={ViewElectionNomination} />
        <Stack.Screen name="publishelectionresult" component={PublishElectionResult} />
        <Stack.Screen name="addelectiondetails" component={AddElectionDetails} />
        <Stack.Screen name="viewelectiondetails" component={ViewElectionDetails} />
        <Stack.Screen name="addconstituency" component={AddConstituency} />
        <Stack.Screen name="viewconstituency" component={ViewConstituency} />
        <Stack.Screen name="addpoliticalparty" component={AddPoliticalParty} />
        <Stack.Screen name="viewpoliticalparty" component={ViewPoliticalParty} />
        <Stack.Screen name="agewisereport" component={AgeWiseReport} />
        <Stack.Screen name="genderwisereport" component={GenderWiseReport} />
      </Stack.Navigator>
    </>
  );
};

export default App;
