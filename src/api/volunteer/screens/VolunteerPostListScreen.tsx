// src/pages/VolunteerPostListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { volunteerApi } from '../api/VolunteerApi';
import type { PostFilterRequest, PostsResponse } from '../types/Post';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import VolunteerPostFilter from '../components/VolunteerPostFilter';

interface VolunteerPostItem extends PostsResponse {
  currentParticipants: number;
}

const VolunteerPostListScreen = () => {
  const [posts, setPosts] = useState<VolunteerPostItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [province, setProvince] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED' | 'COMPLETED' | null>(null);
  const [volunteerStartDate, setVolunteerStartDate] = useState<Date | null>(null);
  const [volunteerEndDate, setVolunteerEndDate] = useState<Date | null>(null);

  // 모달/datepicker 상태
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    fetchPosts(0, true);
  }, [province, city, statusFilter, volunteerStartDate, volunteerEndDate]);

  const fetchPosts = async (pageNumber: number, reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    try {
      const filter: PostFilterRequest = {
        province: province || undefined,
        city: city || undefined,
        status: statusFilter ?? undefined,
        volunteerStartDate: volunteerStartDate ? volunteerStartDate.toISOString().split('T')[0] : undefined,
        volunteerEndDate: volunteerEndDate ? volunteerEndDate.toISOString().split('T')[0] : undefined,
      };
      const data = await volunteerApi.getPosts(filter, pageNumber, 10);
      const newPosts: VolunteerPostItem[] = data.content.map((p) => ({
        ...p,
        currentParticipants: (p as any).currentParticipants ?? 0,
      }));
      setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
      setHasMore(!data.last);
      setPage(pageNumber + 1);
    } catch (e) {
      console.error('게시글 조회 실패', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPosts(0, true);
    } finally {
      setRefreshing(false);
    }
  };

  const resetFilters = () => {
    setProvince(null);
    setCity(null);
    setStatusFilter(null);
    setVolunteerStartDate(null);
    setVolunteerEndDate(null);
  };

  const renderItem = ({ item }: { item: VolunteerPostItem }) => {
    const statusLabelMap: Record<string, string> = {
      OPEN: '모집 중',
      CLOSED: '모집 마감',
      COMPLETED: '봉사 완료',
    };
    const getStatusStyle = (status: string | null) => {
      switch (status) {
        case 'OPEN': return { backgroundColor: '#28a745' };
        case 'CLOSED': return { backgroundColor: '#ffc107' };
        case 'COMPLETED': return { backgroundColor: '#6c757d' };
        default: return { backgroundColor: '#adb5bd' };
      }
    };
    return (
      <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
              <Text style={styles.statusText}>{statusLabelMap[item.status ?? '']}</Text>
            </View>
          </View>
          <Text style={styles.subtext}>
            {item.province ?? ''} {item.city ?? ''} | {item.volunteerDate}
          </Text>
          <Text style={styles.capacity}>
            ({item.currentParticipants} / {item.totalCapacity})
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 필터 */}
      <VolunteerPostFilter
        province={province}
        city={city}
        statusFilter={statusFilter}
        volunteerStartDate={volunteerStartDate}
        volunteerEndDate={volunteerEndDate}
        setProvince={setProvince}
        setCity={setCity}
        setStatusFilter={setStatusFilter}
        setVolunteerStartDate={setVolunteerStartDate}
        setVolunteerEndDate={setVolunteerEndDate}
        provinceModalVisible={provinceModalVisible}
        cityModalVisible={cityModalVisible}
        statusModalVisible={statusModalVisible}
        showStartPicker={showStartPicker}
        showEndPicker={showEndPicker}
        setProvinceModalVisible={setProvinceModalVisible}
        setCityModalVisible={setCityModalVisible}
        setStatusModalVisible={setStatusModalVisible}
        setShowStartPicker={setShowStartPicker}
        setShowEndPicker={setShowEndPicker}
        resetFilters={resetFilters}
      />

      {/* 게시글 목록 */}
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        onEndReached={() => fetchPosts(page)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
};

export default VolunteerPostListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: '#fafafa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  subtext: { fontSize: 12, color: '#6c757d', marginBottom: 4 },
  capacity: { fontSize: 12, color: '#495057' },
});
