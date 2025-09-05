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
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchMyReports, ReportFilter } from '../api/myReportApi';
import { DisasterType, disasterTypeNames } from '../types/disasterTypes';

const ORANGE = '#ff7c33';
const ORANGE_DARK = '#ff6a14';
const BORDER = '#E6E8EB';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#667085';

// 접수 상태 타입 + 한글 매핑
type ReportStatus = 'PENDING' | 'RECEIVED' | 'CLOSED';
const REPORT_STATUS_KO: Record<ReportStatus, string> = {
  PENDING: '접수 대기',
  RECEIVED: '접수 완료',
  CLOSED:  '상황 종료',
};

const STATUS_ITEMS: Array<{ label: string; value: ReportStatus | undefined }> = [
  { label: '전체', value: undefined },
  ...(['PENDING', 'RECEIVED', 'CLOSED'] as const).map(s => ({
    label: REPORT_STATUS_KO[s],
    value: s,
  })),
];

export default function ReportListPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);

  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showPicker, setShowPicker] = useState<'start' | 'end' | undefined>(undefined);

  const [statusModalVisible, setStatusModalVisible] = useState(false);

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
      else setReports(prev => [...prev, ...content]);

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

  const currentStatusLabel =
    STATUS_ITEMS.find(i => i.value === statusFilter)?.label ?? '전체';

  const onChangeDate = (_: any, selected?: Date) => {
    const who = showPicker;
    setShowPicker(undefined);
    if (!selected) return;
    if (who === 'start') setStartDate(selected);
    if (who === 'end') setEndDate(selected);
  };

  const resetAll = () => {
    setStatusFilter(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setSortOrder('DESC');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>목록을 불러오는 중...</Text>
      </View>
    );
  }

  const Header = () => (
    <View style={styles.headerWrap}>

      {/* 1) 접수 상태 */}
      <View style={styles.filterLine}>
        <Text style={styles.filterLabel}>접수 상태</Text>
        <View style={styles.filterValueRow}>
          <TouchableOpacity
            style={[styles.outlinedBtn, { flex: 1 }]}
            activeOpacity={0.85}
            onPress={() => setStatusModalVisible(true)}
          >
            <Text style={styles.outlinedBtnText}>{currentStatusLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2) 신고 일자 */}
      <View style={styles.filterLine}>
        <Text style={styles.filterLabel}>신고 일자</Text>
        <View style={[styles.filterValueRow, { gap: 8, alignItems: 'center' }]}>
          <TouchableOpacity
            style={[styles.outlinedBtn, { flex: 1 }]}
            activeOpacity={0.85}
            onPress={() => setShowPicker('start')}
          >
            <Text style={styles.outlinedBtnText}>
              {startDate ? formatDateLabel(startDate.toISOString()) : '시작일'}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: TEXT_MUTED }}>~</Text>
          <TouchableOpacity
            style={[styles.outlinedBtn, { flex: 1 }]}
            activeOpacity={0.85}
            onPress={() => setShowPicker('end')}
          >
            <Text style={styles.outlinedBtnText}>
              {endDate ? formatDateLabel(endDate.toISOString()) : '종료일'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3) 초기화 라인 (오른쪽 정렬) */}
      <View style={styles.resetLine}>
        <TouchableOpacity style={styles.resetBtn} activeOpacity={0.9} onPress={resetAll}>
          <Text style={styles.resetBtnText}>초기화</Text>
        </TouchableOpacity>
      </View>

      {/* 4) 정렬 라인 (다음 줄, 왼쪽 정렬) */}
      <TouchableOpacity
        style={styles.sortLine}
        onPress={() => setSortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'))}
        activeOpacity={0.7}
      >
        <Text style={styles.sortText}>정렬: {sortOrder === 'DESC' ? '최신순' : '오래된순'}</Text>
      </TouchableOpacity>

      {/* 상태 선택 모달 */}
      <Modal transparent visible={statusModalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalBox}>
          {STATUS_ITEMS.map(opt => (
            <TouchableOpacity
              key={opt.label}
              style={styles.modalItem}
              onPress={() => {
                setStatusFilter(opt.value);
                setStatusModalVisible(false);
              }}
            >
              <Text
                style={[
                  styles.modalItemText,
                  opt.value === statusFilter && { color: ORANGE, fontWeight: '700' },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );

  return (
    <View style={styles.container}>
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
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {disasterTypeNames[(item.disasterType as DisasterType)] ?? item.disasterType}
            </Text>
            <Text style={styles.cardStatus}>
              {REPORT_STATUS_KO[(item.status as ReportStatus)] ?? item.status}
            </Text>
            <Text style={styles.cardDate}>{formatDateLabel(item.createdAt)}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
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

  headerWrap: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  titleHeader: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 30,
    color: TEXT_DARK,
  },

  // 공통 라인
  filterLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  filterLabel: {
    width: 78,
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  filterValueRow: { flex: 1, flexDirection: 'row' },

  // 초기화 라인 (오른쪽 정렬)
  resetLine: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },

  // 정렬 라인 (다음 줄, 왼쪽 정렬)
  sortLine: {
    marginTop: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  sortText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600' },

  // 버튼 스타일 (높이 축소)
  outlinedBtn: {
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,     // ↓ 줄임
    paddingHorizontal: 12,
    minHeight: 36,          // ↓ 줄임
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlinedBtnText: { color: ORANGE, fontSize: 12, fontWeight: '600' },

  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,     // ↓ 줄임
    backgroundColor: ORANGE,
    borderRadius: 12,
    minHeight: 36,          // ↓ 줄임
    minWidth: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

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
  cardTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  cardStatus: { fontSize: 13, marginVertical: 4, color: ORANGE_DARK, fontWeight: '600' },
  cardDate: { fontSize: 12, color: TEXT_MUTED },
  cardDesc: { fontSize: 13, marginTop: 8, color: '#374151' },

  // 로딩/빈 상태
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 16 },
  empty: { paddingVertical: 40, alignItems: 'center' },

  // 모달
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalBox: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  modalItemText: { fontSize: 14, color: TEXT_DARK },
});
