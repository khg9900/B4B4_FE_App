import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
  const { latitude, longitude, loading, city, province } = useCurrentLocation();
  const [shelters, setShelters] = useState<ShelterDto[]>([]);
  const [disasters, setDisasters] = useState<DisasterDto[]>([]);

  useEffect(() => {
    console.log('현재 위치 변경:', { latitude, longitude });
  }, [latitude, longitude]);

  const fetchShelters = async () => {
    if (latitude === null || longitude === null) return;
    try {
      const data = await shelterApi.getNearbyShelters(latitude, longitude, 10000);
      setShelters(data);
      setDisasters([]);
    } catch (error) {
      console.error('대피소 불러오기 실패:', error);
    }
  };

  const fetchDisasters = async () => {
    if (latitude === null || longitude === null) return;
    try {
      const data = await reportApi.getNearbyDisasters(longitude, latitude, 10000);
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
        <Text style={styles.loadingText}>현재 위치를 가져오는 중입니다...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        현재 위치: {province} {city}
      </Text>

      {/* 대피소 / 재난 정보 박스 버튼 */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.boxButton} onPress={fetchShelters}>
          <Text style={styles.boxButtonText}>대피소 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.boxButton} onPress={fetchDisasters}>
          <Text style={styles.boxButtonText}>재난 정보 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 지도 */}
      <View style={styles.mapContainer}>
        <KakaoMapView
          latitude={latitude}
          longitude={longitude}
          shelters={shelters}
          disasters={disasters}
        />
      </View>

      {/* 신고하기 버튼 */}
      <View style={styles.reportButtonContainer}>
        <TouchableOpacity onPress={goToReportScreen} style={styles.reportBoxButton}>
          <Text style={styles.reportBoxButtonText}>신고하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  boxButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  boxButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  mapContainer: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  reportButtonContainer: {
    marginTop: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  reportBoxButton: {
    width: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reportBoxButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 15, color: '#555' },
});
