// src/pages/ReportListPage.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator,
  Platform, Modal, TouchableWithoutFeedback
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchMyReportsCursor, ReportCursorRequest, CursorResponse } from '../api/myReportApi';
import { ReportResponse } from '../types/api';
import { DisasterType, disasterTypeNames } from '../types/disasterTypes';

const ORANGE = '#ff7c33';
const ORANGE_DARK = '#ff6a14';
const BORDER = '#E6E8EB';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#667085';

type ReportStatus = 'PENDING' | 'RECEIVED' | 'CLOSED';
const REPORT_STATUS_KO: Record<ReportStatus, string> = {
  PENDING: '접수 대기',
  RECEIVED: '접수 완료',
  CLOSED:  '상황 종료',
};

const STATUS_ITEMS: Array<{ label: string; value: ReportStatus | undefined }> = [
  { label: '전체', value: undefined },
  ...(['PENDING', 'RECEIVED', 'CLOSED'] as const).map(s => ({ label: REPORT_STATUS_KO[s], value: s })),
];

const formatToLocalDate = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export default function ReportListPage() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [lastCreatedAt, setLastCreatedAt] = useState<string | undefined>(undefined);
  const [lastId, setLastId] = useState<number | undefined>(undefined);

  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showPicker, setShowPicker] = useState<'start' | 'end' | undefined>(undefined);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const pageSize = 10;

  const loadReports = async (reset = true) => {
    try {
      if (reset) setLoading(true);

      const req: ReportCursorRequest = {
        province: undefined,
        city: undefined,
        status: statusFilter,
        pageSize: pageSize + 1, // limitPlusOne 전략
        sortOrder,
        lastCreatedAt: reset ? undefined : lastCreatedAt,
        lastId: reset ? undefined : lastId,
        startDate: startDate ? formatToLocalDate(startDate) : undefined,
        endDate: endDate ? formatToLocalDate(endDate) : undefined,
      };

      const resp: CursorResponse<ReportResponse> = await fetchMyReportsCursor(req);

      let content = resp.content;
      let next = false;

      if (content.length > pageSize) {
        next = true;
        content = content.slice(0, pageSize); // 마지막 하나는 hasNext 판단용
      }

      if (reset) setReports(content);
      else setReports(prev => [...prev, ...content]);

      setHasNext(next);

      if (content.length > 0) {
        const lastItem = content[content.length - 1];
        setLastCreatedAt(lastItem.createdAt);
        setLastId(lastItem.id);
      } else {
        setLastCreatedAt(undefined);
        setLastId(undefined);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('오류', '신고 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports(true);
  }, [statusFilter, sortOrder, startDate, endDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasNext && !loading) loadReports(false);
  };

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const currentStatusLabel = STATUS_ITEMS.find(i => i.value === statusFilter)?.label ?? '전체';

  const onChangeDate = (_: any, selected?: Date) => {
    const picker = showPicker;
    setShowPicker(undefined);
    if (!selected) return;
    if (picker === 'start') setStartDate(selected);
    if (picker === 'end') setEndDate(selected);
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

      <View style={styles.filterLine}>
        <Text style={styles.filterLabel}>신고 일자</Text>
        <View style={[styles.filterValueRow, { gap: 8, alignItems: 'center' }]}>
          <TouchableOpacity style={[styles.outlinedBtn, { flex: 1 }]} activeOpacity={0.85} onPress={() => setShowPicker('start')}>
            <Text style={styles.outlinedBtnText}>{startDate ? formatDateLabel(startDate.toISOString()) : '시작일'}</Text>
          </TouchableOpacity>
          <Text style={{ color: TEXT_MUTED }}>~</Text>
          <TouchableOpacity style={[styles.outlinedBtn, { flex: 1 }]} activeOpacity={0.85} onPress={() => setShowPicker('end')}>
            <Text style={styles.outlinedBtnText}>{endDate ? formatDateLabel(endDate.toISOString()) : '종료일'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resetLine}>
        <TouchableOpacity style={styles.resetBtn} activeOpacity={0.9} onPress={resetAll}>
          <Text style={styles.resetBtnText}>초기화</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.sortLine} onPress={() => setSortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'))} activeOpacity={0.7}>
        <Text style={styles.sortText}>정렬: {sortOrder === 'DESC' ? '최신순' : '오래된순'}</Text>
      </TouchableOpacity>

      <Modal transparent visible={statusModalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalBox}>
          {STATUS_ITEMS.map(opt => (
            <TouchableOpacity key={opt.label} style={styles.modalItem} onPress={() => { setStatusFilter(opt.value); setStatusModalVisible(false); }}>
              <Text style={[styles.modalItemText, opt.value === statusFilter && { color: ORANGE, fontWeight: '700' }]}>{opt.label}</Text>
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
            <Text style={styles.cardTitle}>{disasterTypeNames[(item.disasterType as DisasterType)] ?? item.disasterType}</Text>
            <Text style={styles.cardStatus}>{REPORT_STATUS_KO[(item.status as ReportStatus)] ?? item.status}</Text>
            <Text style={styles.cardDate}>{formatDateLabel(item.createdAt)}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={hasNext ? <ActivityIndicator style={{ margin: 16 }} color={ORANGE} /> : null}
        ListEmptyComponent={() => (<View style={styles.empty}><Text>신고 내역이 없습니다.</Text></View>)}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerWrap: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER },
  filterLine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  filterLabel: { width: 78, fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  filterValueRow: { flex: 1, flexDirection: 'row' },
  resetLine: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 2 },
  sortLine: { marginTop: 6, marginBottom: 6, alignSelf: 'flex-start' },
  sortText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '600' },
  outlinedBtn: { borderWidth: 1, borderColor: ORANGE, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center', alignItems: 'center' },
  outlinedBtnText: { color: ORANGE, fontSize: 12, fontWeight: '600' },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: ORANGE, borderRadius: 12, minHeight: 36, minWidth: 70, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { borderWidth: 1, borderColor: BORDER, padding: 16, borderRadius: 12, marginBottom: 14, backgroundColor: '#fafafa', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  cardStatus: { fontSize: 13, marginVertical: 4, color: ORANGE_DARK, fontWeight: '600' },
  cardDate: { fontSize: 12, color: TEXT_MUTED },
  cardDesc: { fontSize: 13, marginTop: 8, color: '#374151' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 16 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalBox: { position: 'absolute', top: 120, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 6 },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  modalItemText: { fontSize: 14, color: TEXT_DARK },
});
