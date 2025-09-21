import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axiosInstance from '../../global/api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stopForegroundService } from '../../location/hooks/startLocationService';

// 에러 출력
const logError = (label: string, error: any) => {
  console.error(`${label}:`, error?.response?.data ?? error?.message ?? error);
};

export default function MyActivitiesScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      stopForegroundService();
      Alert.alert('로그아웃 완료');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (error: any) {
      logError('로그아웃 실패', error);
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ReportList' as never)}
      >
        <Text style={styles.buttonText}>내 신고 목록</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('UserParticipation' as never)}
      >
        <Text style={styles.buttonText}>봉사활동 신청 내역</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutbutton} onPress={handleLogout}>
        <Text style={styles.logoutbuttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutbutton: {
    position: 'relative',
    top: '25%',
    width: '30%',
    paddingVertical: 15,
    marginVertical: 10,
    backgroundColor: '#F98510',
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  logoutbuttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
});
