import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { volunteerParticipantApi } from '../api/VolunteerApi';
import type { VolunteerParticipationResponse } from '../types/Participation';

// 로컬 Date → KST ISO 문자열 변환
const formatAsKSTISOString = (date: Date): string => {
  const kstOffset = 9 * 60; // KST는 UTC+9
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const kstDate = new Date(utc + kstOffset * 60000);

  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getDate()).padStart(2, "0");
  const hours = String(kstDate.getHours()).padStart(2, "0");
  const minutes = String(kstDate.getMinutes()).padStart(2, "0");
  const seconds = String(kstDate.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const formatDateTime = (date: Date | null) => {
  if (!date) return '';
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const STATUS_OPTIONS = [
  { label: '전체', value: null },
  { label: '참가중', value: 'PARTICIPATED' },
  { label: '취소됨', value: 'CANCELLED' },
  { label: '블랙리스트', value: 'BLACKLISTED' },
  { label: '출석완료', value: 'PRESENT' },
  { label: '결석', value: 'ABSENT' },
];

const UserParticipationScreen = () => {
  const [participations, setParticipations] = useState<VolunteerParticipationResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchMyParticipations();
  }, [statusFilter, startTime, endTime]);

  const fetchMyParticipations = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (startTime) params.startTime = formatAsKSTISOString(startTime);
      if (endTime) params.endTime = formatAsKSTISOString(endTime);

      const data = await volunteerParticipantApi.getMyParticipations(params);
      setParticipations(data);
    } catch (error) {
      console.error('참가 목록 조회 실패:', error);
    }
  };

  const handleCancel = async (participantId: number) => {
    try {
      // 화면에서 즉시 상태 변경
      setParticipations((prev) =>
        prev.map((p) =>
          p.participantId === participantId
            ? { ...p, status: 'CANCELLED' }
            : p
        )
      );

      // 서버에 상태 변경 요청
      await volunteerParticipantApi.cancelParticipation(participantId);

      Alert.alert('알림', '참가가 취소되었습니다.');
    } catch (error: any) {
      console.error('참가 취소 실패:', error.response?.data || error.message);
      Alert.alert('오류', error.response?.data?.message || '참가 취소 중 문제가 발생했습니다.');

      // 실패하면 다시 서버 상태로 롤백
      fetchMyParticipations();
    }
  };

  const getStatusLabel = (status: VolunteerParticipationResponse['status']) => {
    switch (status) {
      case 'PARTICIPATED': return '참가중';
      case 'CANCELLED': return '취소됨';
      case 'BLACKLISTED': return '블랙리스트';
      case 'PRESENT': return '출석완료';
      case 'ABSENT': return '결석';
      default: return status;
    }
  };

  const getStatusBadgeStyle = (status: VolunteerParticipationResponse['status']) => {
    switch (status) {
      case 'PARTICIPATED': return [styles.statusBadge, styles.statusParticipated];
      case 'CANCELLED': return [styles.statusBadge, styles.statusCancelled];
      case 'PRESENT': return [styles.statusBadge, styles.statusPresent];
      case 'ABSENT': return [styles.statusBadge, styles.statusAbsent];
      case 'BLACKLISTED': return [styles.statusBadge, styles.statusBlacklisted];
      default: return [styles.statusBadge];
    }
  };

  const openDateTimePicker = (
    type: 'start' | 'end',
    showPicker: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    showPicker(true);
    setTempDate(null);
  };

  const renderItem = ({ item }: { item: VolunteerParticipationResponse }) => (
    <View style={styles.card}>
      <Text style={styles.title}>
        {item.postTitle} - {item.teamNumber}팀
      </Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📍</Text>
        <Text style={styles.infoText}>장소: {item.placeName}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📊</Text>
        <Text style={styles.infoText}>참가 상태: </Text>
        <View style={getStatusBadgeStyle(item.status)}>
          <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>⏰</Text>
        <Text style={styles.infoText}>참가 시각: {new Date(item.joinedAt).toLocaleString()}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>🕐</Text>
        <Text style={styles.infoText}>출석 시작: {new Date(item.checkinStart).toLocaleString()}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>🕕</Text>
        <Text style={styles.infoText}>출석 종료: {new Date(item.checkinEnd).toLocaleString()}</Text>
      </View>

      {item.status === 'PARTICIPATED' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancel(item.participantId)}
        >
          <Text style={styles.cancelButtonText}>참가 취소</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 필터 영역 */}
      <View style={styles.filterSection}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>상태:</Text>
          <TouchableOpacity
            style={styles.pickerWrapper}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.pickerText} numberOfLines={1} ellipsizeMode="tail">
              {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || '전체'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.datePickerRow}>
          <TouchableOpacity
            onPress={() => openDateTimePicker('start', setShowStartPicker)}
            style={styles.datePickerButton}
          >
            <Text style={styles.datePickerText}>
              출석 시작: {startTime ? formatDateTime(startTime) : '선택'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openDateTimePicker('end', setShowEndPicker)}
            style={styles.datePickerButton}
          >
            <Text style={styles.datePickerText}>
              출석 종료: {endTime ? formatDateTime(endTime) : '선택'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 상태 선택 모달 */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          {STATUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value ?? 'all'}
              onPress={() => {
                setStatusFilter(option.value);
                setModalVisible(false);
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
          value={startTime || new Date()}
          mode={tempDate ? 'time' : 'date'}
          display="default"
          onChange={(event, date) => {
            if (event.type === 'dismissed') {
              setShowStartPicker(false);
              return;
            }
            if (!date) return;
            if (!tempDate) {
              setTempDate(date);
            } else {
              const final = new Date(tempDate);
              final.setHours(date.getHours(), date.getMinutes());
              setStartTime(final);
              setShowStartPicker(false);
              setTempDate(null);
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime || new Date()}
          mode={tempDate ? 'time' : 'date'}
          display="default"
          onChange={(event, date) => {
            if (event.type === 'dismissed') {
              setShowEndPicker(false);
              return;
            }
            if (!date) return;
            if (!tempDate) {
              setTempDate(date);
            } else {
              const final = new Date(tempDate);
              final.setHours(date.getHours(), date.getMinutes());
              setEndTime(final);
              setShowEndPicker(false);
              setTempDate(null);
            }
          }}
        />
      )}

      {/* 참가 리스트 */}
      <FlatList
        data={participations}
        keyExtractor={(item) => item.participantId.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterSection: { padding: 16, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  filterLabel: { fontSize: 14, fontWeight: 'bold', marginRight: 8, color: '#333' },
  pickerWrapper: { flex: 1, height: 40, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, backgroundColor: 'white', justifyContent: 'center' },
  pickerText: { fontSize: 14, color: '#333' },
  datePickerRow: { flexDirection: 'row', gap: 8 },
  datePickerButton: { flex: 1, padding: 12, backgroundColor: '#e9ecef', borderRadius: 8, alignItems: 'center' },
  datePickerText: { fontSize: 12, color: '#333', textAlign: 'center' },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { borderWidth: 1, borderColor: '#ddd', padding: 16, borderRadius: 12, marginBottom: 14, backgroundColor: '#fafafa', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoIcon: { width: 16, marginRight: 6, fontSize: 12 },
  infoText: { fontSize: 14, color: '#555', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
  statusParticipated: { backgroundColor: '#d4edda' },
  statusCancelled: { backgroundColor: '#f8d7da' },
  statusPresent: { backgroundColor: '#d1ecf1' },
  statusAbsent: { backgroundColor: '#f8d7da' },
  statusBlacklisted: { backgroundColor: '#f5f5f5' },
  cancelButton: { marginTop: 12, backgroundColor: '#ff8800', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContainer: { position: 'absolute', top: 120, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16 },
  modalItemText: { fontSize: 14, color: '#333' },
});

export default UserParticipationScreen;
