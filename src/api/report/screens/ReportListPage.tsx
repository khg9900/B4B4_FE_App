// ReportListPage.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchMyReports, ReportFilter } from '../api/myReportApi';

// ---- 브랜드 컬러(웹과 통일) ----
const ORANGE = '#ff7c33';
const ORANGE_DARK = '#ff6a14';
const ORANGE_BG = '#fff5ec';
const BORDER = '#E6E8EB';
const MUTED = '#667085';

export default function ReportListPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showPicker, setShowPicker] = useState<'start' | 'end' | undefined>(undefined);

  const loadReports = async (pageNum: number, reset = true) => {
    try {
      if (reset) setLoading(true);

      const sortParam = `createdAt,${sortOrder.toLowerCase()}`;
      const filter: ReportFilter = {
        page: pageNum,
        size: 10,
        status: statusFilter,
        sort: sortParam,
      };

      // 날짜: 하루 전체 범위
      if (startDate) {
        const y = startDate.getFullYear();
        const m = String(startDate.getMonth() + 1).padStart(2, '0');
        const d = String(startDate.getDate()).padStart(2, '0');
        filter.start = `${y}-${m}-${d}T00:00:00`;
      }
      if (endDate) {
        const y = endDate.getFullYear();
        const m = String(endDate.getMonth() + 1).padStart(2, '0');
        const d = String(endDate.getDate()).padStart(2, '0');
        filter.end = `${y}-${m}-${d}T23:59:59`;
      }

      const { content, last } = await fetchMyReports(filter);
      if (reset) setReports(content);
      else setReports((prev) => [...prev, ...content]);

      setHasNext(!last);
      setPage(pageNum);
    } catch (err: any) {
      console.error(err);
      Alert.alert('오류', '신고 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(0, true);
  }, [statusFilter, sortOrder, startDate, endDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports(0, true);
    setRefreshing(false);
  };
  const loadMore = () => {
    if (hasNext && !loading) loadReports(page + 1, false);
  };

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const onChangeDate = (_: any, selected?: Date) => {
    const who = showPicker; // 현재 어떤 피커였는지 저장
    setShowPicker(undefined);
    if (!selected) return;
    if (who === 'start') setStartDate(selected);
    if (who === 'end') setEndDate(selected);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>목록을 불러오는 중...</Text>
      </View>
    );
  }

  // 상단 필터 헤더 (웹 느낌 칩 UI)
  const FilterHeader = () => (
    <View style={styles.headerWrap}>
      {/* 상단 아이콘/타이틀 대체: 타이틀만 */}
      <Text style={styles.titleHeader}>신고목록</Text>

      {/* 상태 칩 */}
      <View style={styles.chipRow}>
        {[
          { label: '전체', value: undefined },
          { label: '대기', value: 'PENDING' },
          { label: '확인', value: 'RECEIVED' },
          { label: '완료', value: 'CLOSED' },
        ].map((o) => {
          const active = statusFilter === o.value || (o.value === undefined && statusFilter === undefined);
          return (
            <TouchableOpacity
              key={o.label}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => setStatusFilter(o.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 날짜 칩 */}
      <View style={styles.chipRow}>
        <TouchableOpacity style={[styles.chipGhost]} onPress={() => setShowPicker('start')} activeOpacity={0.8}>
          <Text style={styles.chipGhostText}>
            시작일 {startDate ? `· ${formatDateLabel(startDate.toISOString())}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chipGhost]} onPress={() => setShowPicker('end')} activeOpacity={0.8}>
          <Text style={styles.chipGhostText}>
            종료일 {endDate ? `· ${formatDateLabel(endDate.toISOString())}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chipDanger]}
          onPress={() => {
            setStartDate(undefined);
            setEndDate(undefined);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.chipDangerText}>날짜 초기화</Text>
        </TouchableOpacity>
      </View>

      {/* 정렬 토글 */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={styles.sortChip}
          onPress={() => setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'))}
          activeOpacity={0.85}
        >
          <Text style={styles.sortChipText}>정렬: {sortOrder === 'DESC' ? '최신순' : '오래된순'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* DatePicker */}
      {showPicker && (
        <DateTimePicker
          value={(showPicker === 'start' ? startDate : endDate) || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
        />
      )}

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={FilterHeader}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.disasterType}</Text>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={styles.date}>{formatDateLabel(item.createdAt)}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={hasNext ? <ActivityIndicator style={{ margin: 16 }} color={ORANGE} /> : null}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text>신고 내역이 없습니다.</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // 헤더(필터) 영역
  headerWrap: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  titleHeader: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    color: '#111827',
  },

  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  // 기본 칩(흰 배경, 회색 보더)
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipText: { fontSize: 13, color: '#1f2937' },

  // 활성 칩(주황 강조)
  chipActive: {
    borderColor: ORANGE,
    backgroundColor: '#fff',
    shadowColor: ORANGE,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  chipTextActive: { color: ORANGE, fontWeight: '700' },

  // 고스트 칩(날짜 선택)
  chipGhost: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: ORANGE_BG,
    borderWidth: 1,
    borderColor: ORANGE,
  },
  chipGhostText: { fontSize: 12, color: ORANGE, textAlign: 'center' },

  // 위험/리셋 칩
  chipDanger: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffd3c7',
    borderWidth: 1,
    borderColor: ORANGE_DARK,
  },
  chipDangerText: { fontSize: 12, color: ORANGE_DARK, fontWeight: '700' },

  // 정렬 칩(우측 정렬)
  sortRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  sortChip: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
  },
  sortChipText: { fontSize: 12, color: MUTED },

  // 리스트/카드
  listContainer: { padding: 16, paddingBottom: 100 },
  card: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: '#fafafa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  status: { fontSize: 13, marginVertical: 4, color: ORANGE_DARK, fontWeight: '600' },
  date: { fontSize: 12, color: MUTED },
  desc: { fontSize: 13, marginTop: 8, color: '#374151' },

  // 로딩/빈 상태
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 16 },
  empty: { paddingVertical: 40, alignItems: 'center' },
});
