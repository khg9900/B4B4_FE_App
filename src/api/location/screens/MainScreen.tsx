import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import KakaoMapView from '../components/KakaoMapComponent';
import { shelterApi } from '../api/shelterApi';
import { reportApi } from '../api/reportApi';
import type { ShelterDto, DisasterDto } from '../types/Map';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/RootNavigator';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'MainScreen'>;

const MainScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { latitude, longitude, loading } = useCurrentLocation();
  const [shelters, setShelters] = useState<ShelterDto[]>([]);
  const [disasters, setDisasters] = useState<DisasterDto[]>([]);

  useEffect(() => {
    console.log('현재 위치 변경:', { latitude, longitude });
  }, [latitude, longitude]);

  const fetchShelters = async () => {
    if (latitude === null || longitude === null) {
      console.warn('위치값 없음: 대피소 조회 불가');
      return;
    }
    try {
      const data = await shelterApi.getNearbyShelters(latitude, longitude, 3000);
      console.log('대피소 데이터:', data);
      setShelters(data);
      setDisasters([]);
    } catch (error) {
      console.error('대피소 불러오기 실패:', error);
    }
  };

  const fetchDisasters = async () => {
    if (latitude === null || longitude === null) {
      console.warn('위치값 없음: 재난 정보 조회 불가');
      return;
    }
    try {
      const data = await reportApi.getNearbyDisasters(latitude, longitude, 3000);
      console.log('재난 정보 데이터:', data);
      setDisasters(data);
      setShelters([]);
    } catch (error) {
      console.error('재난 정보 불러오기 실패:', error);
    }
  };

  const goToReportScreen = () => {
    navigation.navigate('ReportScreen');
  };

  if (loading || latitude === null || longitude === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text>현재 위치를 가져오는 중입니다...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        현재 위치: {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </Text>

      <View style={styles.buttonRow}>
        <Button title="대피소 보기" onPress={fetchShelters} color="#FF6B00" />
        <Button title="재난 정보 보기" onPress={fetchDisasters} color="#FF6B00" />
      </View>

      <View style={styles.mapContainer}>
        <KakaoMapView
          latitude={latitude}
          longitude={longitude}
          shelters={shelters}
          disasters={disasters}
        />
      </View>

      <View style={styles.reportButtonContainer}>
        <TouchableOpacity onPress={goToReportScreen} style={styles.reportButton}>
          <Text style={styles.reportButtonText}>신고하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  mapContainer: { flex: 1 },
  reportButtonContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  reportButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
