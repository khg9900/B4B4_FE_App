import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import KakaoMapView from '../components/KakaoMapComponent';
import { shelterApi } from '../api/shelterApi';
import { reportApi } from '../api/reportApi';
import type { ShelterDto, DisasterDto } from '../types/Map';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'MainScreen'>;

const MainScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { latitude, longitude, loading, city, province } = useCurrentLocation();
  const [shelters, setShelters] = useState<ShelterDto[]>([]);
  const [disasters, setDisasters] = useState<DisasterDto[]>([]);
  const [expanded, setExpanded] = useState(false);

  // 처음 위치가 준비되면 자동으로 재난정보 불러오기
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

  // 단순 집계 (props 전체 기준)
  const summary = useMemo(() => {
    const acc: Record<string, number> = {};
    disasters.forEach(d => {
      const key = String((d as any).disasterType ?? '').toUpperCase();
      acc[key] = (acc[key] ?? 0) + ((d as any).count ?? 1);
    });
    // 건수 내림차순
    return Object.entries(acc)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [disasters]);

  const visibleSummary = useMemo(() => {
    if (expanded) return summary;
    return summary.slice(0, 2);
  }, [summary, expanded]);

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

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.boxButton} onPress={fetchShelters}>
          <Text style={styles.boxButtonText}>대피소 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.boxButton} onPress={fetchDisasters}>
          <Text style={styles.boxButtonText}>재난 정보 보기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <KakaoMapView
          latitude={latitude}
          longitude={longitude}
          shelters={shelters}
          disasters={disasters}
        />

        {/* 재난 집계 오버레이 (상단, 신고버튼과 겹치지 않음) */}
        {summary.length > 0 && (
          <View style={[styles.summaryBox, expanded && styles.summaryBoxExpanded]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>재난 집계</Text>
              {summary.length > 3 && (
                <TouchableOpacity onPress={() => setExpanded(p => !p)} style={styles.toggleBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.toggleText}>{expanded ? '접기 ▲' : `더보기 (${summary.length - 2}) ▼`}</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={visibleSummary}
              keyExtractor={(item) => item.type}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.cell}>{item.type}</Text>
                  <Text style={styles.cell}>{item.count} 건</Text>
                </View>
              )}
              scrollEnabled={expanded}
            />
          </View>
        )}
      </View>

      <View style={styles.reportButtonContainer}>
        <TouchableOpacity style={styles.reportBoxButton} onPress={goToReportScreen}>
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

  summaryBox: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    padding: 10,
    elevation: 6,
    // 접힘 상태 높이
    maxHeight: 150,
  },
  summaryBoxExpanded: {
    // 펼침 상태 높이 증가
    maxHeight: 280,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryTitle: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  toggleBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FFE7D6' },
  toggleText: { fontSize: 12, color: '#FF6B00', fontWeight: '700' },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  cell: { fontSize: 13, color: '#333' },

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
