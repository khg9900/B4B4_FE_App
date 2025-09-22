// src/api/location/screens/MainScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import KakaoMapView from '../components/KakaoMapComponent';
import { shelterApi } from '../api/shelterApi';
import { reportApi } from '../api/reportApi';
import type { ShelterDto, DisasterDto } from '../types/Map';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

import DisasterSummary from '../components/DisasterSummary';
import ActionButtons from '../components/ActionButtons';
import ReportButton from '../components/ReportButton';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'MainScreen'>;

const MainScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { latitude, longitude, loading, city, province } = useCurrentLocation();
  const [shelters, setShelters] = useState<ShelterDto[]>([]);
  const [disasters, setDisasters] = useState<DisasterDto[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      fetchDisasters();
    }
  }, [latitude, longitude]);

  const fetchShelters = async () => {
    if (latitude === null || longitude === null) return;
    try {
      const data = await shelterApi.getNearbyShelters(latitude, longitude, 10000);
      setShelters(data);
      setDisasters([]);
      setExpanded(false);
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
      setExpanded(false);
    } catch (error) {
      console.error('재난 정보 불러오기 실패:', error);
    }
  };

  const goToReportScreen = () => navigation.navigate('ReportScreen');

  const summary = useMemo(() => {
    const acc: Record<string, number> = {};
    disasters.forEach(d => {
      const key = String((d as any).disasterType ?? '').toUpperCase();
      acc[key] = (acc[key] ?? 0) + ((d as any).count ?? 1);
    });
    return Object.entries(acc)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [disasters]);

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

      <ActionButtons fetchShelters={fetchShelters} fetchDisasters={fetchDisasters} />

      <View style={styles.mapContainer}>
        <KakaoMapView latitude={latitude} longitude={longitude} shelters={shelters} disasters={disasters} />
        <DisasterSummary summary={summary} expanded={expanded} onToggle={() => setExpanded(p => !p)} />
      </View>

      <ReportButton onPress={goToReportScreen} />
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },
  mapContainer: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 15, color: '#555' },
});
