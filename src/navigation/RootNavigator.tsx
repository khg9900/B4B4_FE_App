import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../api/auth/screens/loginScreen';
import SignUpScreen from '../api/auth/screens/singupScreen';

import VolunteerPostListScreen from '../api/volunteer/screens/VolunteerPostListScreen';
import VolunteerPostCreateScreen from '../api/volunteer/screens/VolunteerPostCreateScreen';
import VolunteerPostDetailScreen from '../api/volunteer/screens/VolunteerPostDetailScreen';
import UserParticipationScreen from '../api/volunteer/screens/UserParticipationScreen';

import MyActivitiesScreen from '../api/report/screens/MyActivitiesScreen';

import ReportListPage from '../api/report/screens/ReportListPage'
import AlertScreen from '../api/alert/screens/AlertScreen';

import MainScreen from '../api/location/screens/MainScreen';

import Layout from '../components/Layout';
import ReportScreen from '../api/report/screens/ReportScreen';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  VolunteerPosts: undefined;
  PostCreate: undefined;
  PostDetail: { postId: number };
  MyActivities: undefined;
  ReportList: undefined;
  ReportScreen: undefined;
  Dashboard: undefined;
  Alert: undefined;
  MainScreen: undefined;
  UserParticipation: undefined;
  VolunteerPostDetail: { postId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const withLayout = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Layout>
      <Component {...props} />
    </Layout>
  );
};

const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      {/* ❌ Layout 미적용 */}
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />

      {/* ✅ Layout 적용 */}
      <Stack.Screen name="MainScreen" component={withLayout(MainScreen)} options={{ headerShown: false }} />
      <Stack.Screen name="VolunteerPosts" component={withLayout(VolunteerPostListScreen)} options={{ headerShown: false }} />
      <Stack.Screen name="PostCreate" component={withLayout(VolunteerPostCreateScreen)} options={{ headerShown: false }} />
      <Stack.Screen name="PostDetail" component={withLayout(VolunteerPostDetailScreen)} options={{ headerShown: false }} />
      <Stack.Screen name="MyActivities" component={withLayout(MyActivitiesScreen)} options={{ headerShown: false }} />
      <Stack.Screen name="ReportList" component={withLayout(ReportListPage)} options={{ headerShown: false }} />
      <Stack.Screen name="ReportScreen" component={withLayout(ReportScreen)} options={{ headerShown: false }} />
      <Stack.Screen name="Alert" component={withLayout(AlertScreen)} options={{ headerShown: false }} /> 
      <Stack.Screen name="UserParticipation" component={withLayout(UserParticipationScreen)} options={{ headerShown: false }}
/>
    </Stack.Navigator>
  );
};

export default RootNavigator;