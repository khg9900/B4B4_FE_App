// src/api/report/screens/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
  TouchableOpacity, ActivityIndicator, FlatList, Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getReports, updateReportStatus } from '../api/report';
import { ReportResponse } from '../../../api/report/types/api';

const disasterTypeToKorean: Record<string, string> = {
  EARTHQUAKE: '지진',
  FLOOD: '홍수',
  TYPHOON: '태풍',
  WILDFIRE: '산불',
  LANDSLIDE: '산사태',
  POWER_OUTAGE: '정전',
  TERROR_ATTACK: '테러',
  BUILDING_COLLAPSE: '건물 붕괴',
};

const statusToKorean: Record<string, string> = {
  PENDING: '대기중',
  RECEIVED: '접수 완료',
  CLOSED: '상황 종료',
};

const statusColor: Record<string, string> = {
  PENDING: '#FFB74D',
  RECEIVED: '#EF6C00',
  CLOSED: '#6D4C41',
};

const DashboardScreen: React.FC = () => {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await getReports();
      const sorted = [...(response || [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReports(sorted);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangeStatus = async (reportId: number, newStatus: string) => {
    try {
      setLoadingMap((prev) => ({ ...prev, [reportId]: true }));
      await updateReportStatus(reportId, newStatus);
      await fetchReports();
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '상태 변경 중 문제가 발생했습니다.');
    } finally {
      setLoadingMap((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const renderItem = ({ item }: { item: ReportResponse }) => {
    const reportId = item.id;
    if (!reportId) return null;

    return (
      <View style={styles.item}>
        <View style={styles.headerRow}>
          <Text style={styles.disasterType}>
            {disasterTypeToKorean[item.disasterType] || item.disasterType}
          </Text>
          <Text
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor[item.status] || '#d1d5db' },
            ]}
          >
            {statusToKorean[item.status] || item.status}
          </Text>
        </View>
        <Text>신고자 ID: {item.reporter}</Text>
        <Text>설명: {item.description}</Text>
        <Text>위치: {item.province} {item.city}</Text>
        <Text>위도/경도: {item.locationLat}, {item.locationLng}</Text>
        <Text>신고 시각: {new Date(item.createdAt).toLocaleString()}</Text>
        <Text>업데이트 시각: {new Date(item.updatedAt).toLocaleString()}</Text>

        {item.imageUrl && (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Image
              source={{ uri: item.imageUrl }}
              style={{
                width: '90%',
                aspectRatio: 1038 / 2048,
                borderRadius: 8,
              }}
              resizeMode="contain"
            />
          </View>
        )}

        {item.videoUrl && (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <View style={{ width: '90%', aspectRatio: 1038 / 2048 }}>
              <WebView
                source={{ uri: item.videoUrl }}
                style={{ flex: 1, borderRadius: 8 }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
              />
            </View>
          </View>
        )}

        {item.status !== 'CLOSED' && (
          <View style={styles.statusButtons}>
            {item.status === 'PENDING' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleChangeStatus(reportId, 'RECEIVED')}
                disabled={loadingMap[reportId]}
              >
                {loadingMap[reportId] ? (
                  <ActivityIndicator size="small" color="#FB8C00" />
                ) : (
                  <Text style={styles.buttonText}>접수 완료</Text>
                )}
              </TouchableOpacity>
            )}
            {item.status === 'RECEIVED' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleChangeStatus(reportId, 'CLOSED')}
                disabled={loadingMap[reportId]}
              >
                {loadingMap[reportId] ? (
                  <ActivityIndicator size="small" color="#FB8C00" />
                ) : (
                  <Text style={styles.buttonText}>상황 종료</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>신고 내역</Text>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id?.toString() ?? `${item.reporter}-${item.createdAt}`}
        renderItem={renderItem}
      />
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  item: {
    borderWidth: 1,
    borderColor: '#FFCC80',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#FFF3E0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  disasterType: { fontSize: 16, fontWeight: 'bold', color: '#EF6C00' },
  statusBadge: {
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    color: '#fff',
    overflow: 'hidden',
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderColor: '#FB8C00',
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  buttonText: {
    color: '#FB8C00',
    fontWeight: 'bold',
  },
});