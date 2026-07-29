import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import axios from 'axios';

axios.defaults.headers.common['ngrok-skip-browser-warning'] = '69420';

import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import ConfirmationScreen from './src/screens/ConfirmationScreen';
import EducationScreen from './src/screens/EducationScreen';
import ContactScreen from './src/screens/ContactScreen';
import SignatureScreen from './src/screens/SignatureScreen';
import DirectSignatureScreen from './src/screens/DirectSignatureScreen';
import HomeScreen from './src/screens/HomeScreen';
import PayslipsScreen from './src/screens/PayslipsScreen';
import MyContractScreen from './src/screens/MyContractScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import VacationsScreen from './src/screens/VacationsScreen';
import PendingContractScreen from './src/screens/PendingContractScreen';
import CarnetScreen from './src/screens/CarnetScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RequestsScreen from './src/screens/RequestsScreen';
import NewRequestScreen from './src/screens/NewRequestScreen';
import RequestFormScreen from './src/screens/RequestFormScreen';
import RequestDetailScreen from './src/screens/RequestDetailScreen';
import DriverScreen from './src/screens/DriverScreen';
import AlmacenScreen from './src/screens/AlmacenScreen';
import AdminSelectionScreen from './src/screens/AdminSelectionScreen';
import AdminRHScreen from './src/screens/AdminRHScreen';
import AdminTransportScreen from './src/screens/AdminTransportScreen';
import AdminAlmacenScreen from './src/screens/AdminAlmacenScreen';
import AdminFeatureToggleScreen from './src/screens/AdminFeatureToggleScreen';

// Almacén Móvil
import MobileRecepcionScreen from './src/screens/MobileRecepcionScreen';
import MobileDespachoScreen from './src/screens/MobileDespachoScreen';
import MobileMapaScreen from './src/screens/MobileMapaScreen';
import MobileTrasladoScreen from './src/screens/MobileTrasladoScreen';
import MobileAuditoriaScreen from './src/screens/MobileAuditoriaScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A192F' } }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Payslips" component={PayslipsScreen} />
          <Stack.Screen name="MyContract" component={MyContractScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Vacations" component={VacationsScreen} />
          <Stack.Screen name="PendingContract" component={PendingContractScreen} />
          <Stack.Screen name="Carnet" component={CarnetScreen} />
          <Stack.Screen name="Training" component={TrainingScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Requests" component={RequestsScreen} />
          <Stack.Screen name="NewRequest" component={NewRequestScreen} />
          <Stack.Screen name="RequestForm" component={RequestFormScreen} />
          <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
          <Stack.Screen name="Driver" component={DriverScreen} />
          <Stack.Screen name="Almacen" component={AlmacenScreen} />
          <Stack.Screen name="AdminSelection" component={AdminSelectionScreen} />
          <Stack.Screen name="AdminRH" component={AdminRHScreen} />
          <Stack.Screen name="AdminTransporte" component={AdminTransportScreen} />
          <Stack.Screen name="AdminAlmacen" component={AdminAlmacenScreen} />
          <Stack.Screen name="AdminFeatureToggle" component={AdminFeatureToggleScreen} />
          
          {/* Almacén Móvil */}
          <Stack.Screen name="MobileRecepcion" component={MobileRecepcionScreen} />
          <Stack.Screen name="MobileDespacho" component={MobileDespachoScreen} />
          <Stack.Screen name="MobileMapa" component={MobileMapaScreen} />
          <Stack.Screen name="MobileTraslado" component={MobileTrasladoScreen} />
          <Stack.Screen name="MobileAuditoria" component={MobileAuditoriaScreen} />
          
          {/* Onboarding Flow */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
          <Stack.Screen name="Education" component={EducationScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
          <Stack.Screen name="Signature" component={SignatureScreen} />
          <Stack.Screen name="DirectSignature" component={DirectSignatureScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
