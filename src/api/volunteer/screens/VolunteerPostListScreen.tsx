import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { volunteerApi } from '../api/VolunteerApi';
import type { PostFilterRequest, PostsResponse } from '../types/Post';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/RootNavigator';

const STATUS_OPTIONS = [
  { label: '전체', value: null },
  { label: '모집 중', value: 'OPEN' },
  { label: '모집 마감', value: 'CLOSED' },
  { label: '봉사 완료', value: 'COMPLETED' },
];

interface VolunteerPostItem extends PostsResponse {
  currentParticipants: number;
}

const VolunteerPostListScreen = () => {
  const [posts, setPosts] = useState<VolunteerPostItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [province, setProvince] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED' | 'COMPLETED' | null>(null);
  const [volunteerStartDate, setVolunteerStartDate] = useState<Date | null>(null);
  const [volunteerEndDate, setVolunteerEndDate] = useState<Date | null>(null);

  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

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

      const provinces = Array.from(new Set(data.content.map((p) => p.province).filter(Boolean)));
      setAvailableProvinces(provinces.filter((p): p is string => typeof p === 'string'));
      if (province) {
        const cities = Array.from(new Set(data.content.filter((p) => p.province === province).map((p) => p.city))).filter((c): c is string => typeof c === 'string');
        setAvailableCities(cities);
      }

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

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: VolunteerPostItem }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtext}>
          {item.province ?? ''} {item.city ?? ''} | {item.volunteerDate}
        </Text>
        <Text style={styles.capacity}>
          ({item.currentParticipants} / {item.totalCapacity})
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 필터 영역 */}
      <View style={styles.filterSection}>
        {/* 첫 줄 */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.pickerWrapper} onPress={() => setProvinceModalVisible(true)}>
            <Text style={styles.pickerText}>{province || '시/도 선택'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pickerWrapper}
            onPress={() => province && setCityModalVisible(true)}
            disabled={!province}
          >
            <Text style={styles.pickerText}>{city || '군/구 선택'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerWrapper} onPress={() => setStatusModalVisible(true)}>
            <Text style={styles.pickerText}>
              {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || '모집 현황'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 두 번째 줄 */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.datePickerText}>
              봉사 시작일: {volunteerStartDate ? formatDate(volunteerStartDate) : '선택'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEndPicker(true)}>
            <Text style={styles.datePickerText}>
              봉사 종료일: {volunteerEndDate ? formatDate(volunteerEndDate) : '선택'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 모달 - 시/도 */}
      <Modal transparent visible={provinceModalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setProvinceModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <ScrollView>
            {availableProvinces.map((p) => (
              <TouchableOpacity
                key={p}
                style={styles.modalItem}
                onPress={() => {
                  setProvince(p);
                  setCity(null);
                  setProvinceModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 모달 - 군/구 */}
      <Modal transparent visible={cityModalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setCityModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <ScrollView>
            {availableCities.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.modalItem}
                onPress={() => {
                  setCity(c);
                  setCityModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 모달 - 모집 현황 */}
      <Modal transparent visible={statusModalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          {STATUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value ?? 'all'}
              onPress={() => {
                setStatusFilter(option.value as 'OPEN' | 'CLOSED' | 'COMPLETED' | null);
                setStatusModalVisible(false);
              }}
              style={styles.modalItem}
            >
              <Text style={styles.modalItemText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* DateTimePicker */}
      {showStartPicker && (
        <DateTimePicker
          value={volunteerStartDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setVolunteerStartDate(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={volunteerEndDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setVolunteerEndDate(date);
          }}
        />
      )}

      {/* 게시글 리스트 */}
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        onEndReached={() => fetchPosts(page)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator /> : null}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default VolunteerPostListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterSection: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    gap: 12,
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  pickerWrapper: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  pickerText: { fontSize: 14, color: '#333' },
  datePickerButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerText: { fontSize: 12, color: '#333', textAlign: 'center' },
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
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  subtext: { fontSize: 12, color: '#666' },
  capacity: { fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 300,
  },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16 },
  modalItemText: { fontSize: 14, color: '#333' },
});
