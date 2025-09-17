// src/components/VolunteerPostFilter.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PROVINCES, CITIES_BY_PROVINCE } from '../../../data/regions.gen';

const ORANGE = '#ff7c33';
const BORDER = '#E6E8EB';
const TEXT_MUTED = '#667085';
const TEXT_DARK = '#111827';

type StatusType = 'OPEN' | 'CLOSED' | 'COMPLETED' | null;
type CheckinType =
  | 'PARTICIPATED'
  | 'CANCELLED'
  | 'BLACKLISTED'
  | 'PRESENT'
  | 'ABSENT'
  | null;

type Props = {
  province: string | null;
  city: string | null;
  statusFilter: StatusType;
  volunteerStartDate: Date | null;
  volunteerEndDate: Date | null;
  setProvince: (val: string | null) => void;
  setCity: (val: string | null) => void;
  setStatusFilter: (val: StatusType) => void;
  setVolunteerStartDate: (val: Date | null) => void;
  setVolunteerEndDate: (val: Date | null) => void;

  // UserParticipationScreen 전용
  checkinStatus?: CheckinType;
  setCheckinStatus?: (val: CheckinType) => void;

  // 모달/Picker
  provinceModalVisible: boolean;
  cityModalVisible: boolean;
  statusModalVisible: boolean;
  checkinModalVisible?: boolean;
  showStartPicker: boolean;
  showEndPicker: boolean;
  setProvinceModalVisible: (val: boolean) => void;
  setCityModalVisible: (val: boolean) => void;
  setStatusModalVisible: (val: boolean) => void;
  setCheckinModalVisible?: (val: boolean) => void;
  setShowStartPicker: (val: boolean) => void;
  setShowEndPicker: (val: boolean) => void;
  resetFilters: () => void;
};

const STATUS_ITEMS: { label: string; value: StatusType }[] = [
  { label: '전체', value: null },
  { label: '모집 중', value: 'OPEN' },
  { label: '모집 마감', value: 'CLOSED' },
  { label: '봉사 완료', value: 'COMPLETED' },
] as const;

const CHECKIN_ITEMS: { label: string; value: CheckinType }[] = [
  { label: '전체', value: null },
  { label: '참가중', value: 'PARTICIPATED' },
  { label: '취소', value: 'CANCELLED' },
  { label: '블랙리스트', value: 'BLACKLISTED' },
  { label: '출석', value: 'PRESENT' },
  { label: '결석', value: 'ABSENT' },
] as const;

const formatDateLabel = (date: Date) =>
  `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}.${String(date.getDate()).padStart(2, '0')}`;

export default function VolunteerPostFilter(props: Props) {
  const {
    province,
    city,
    statusFilter,
    volunteerStartDate,
    volunteerEndDate,
    setProvince,
    setCity,
    setStatusFilter,
    setVolunteerStartDate,
    setVolunteerEndDate,
    checkinStatus,
    setCheckinStatus,
    provinceModalVisible,
    cityModalVisible,
    statusModalVisible,
    checkinModalVisible,
    showStartPicker,
    showEndPicker,
    setProvinceModalVisible,
    setCityModalVisible,
    setStatusModalVisible,
    setCheckinModalVisible,
    setShowStartPicker,
    setShowEndPicker,
    resetFilters,
  } = props;

  const currentStatusLabel =
    STATUS_ITEMS.find((i) => i.value === statusFilter)?.label ?? '전체';
  const currentCheckinLabel =
    CHECKIN_ITEMS.find((i) => i.value === checkinStatus)?.label ?? '전체';

  const onChangeDate = (_: any, selected?: Date, type?: 'start' | 'end') => {
    if (!selected) {
      setShowStartPicker(false);
      setShowEndPicker(false);
      return;
    }
    if (type === 'start') setVolunteerStartDate(selected);
    if (type === 'end') setVolunteerEndDate(selected);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  return (
    <View style={styles.container}>
      {/* 지역 */}
      <View style={styles.filterLine}>
        <Text style={styles.filterLabel}>지역 선택</Text>
        <View style={styles.filterValueRow}>
          <TouchableOpacity
            style={styles.outlinedBtn}
            onPress={() => setProvinceModalVisible(true)}
          >
            <Text style={styles.outlinedBtnText}>{province ?? '시/도 선택'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlinedBtn, { marginLeft: 8 }]}
            onPress={() => setCityModalVisible(true)}
            disabled={!province}
          >
            <Text style={styles.outlinedBtnText}>{city ?? '군/구 선택'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 게시글 상태 */}
      <View style={styles.filterLine}>
        <Text style={styles.filterLabel}>게시글 상태</Text>
        <TouchableOpacity
          style={styles.outlinedBtn}
          onPress={() => setStatusModalVisible(true)}
        >
          <Text style={styles.outlinedBtnText}>{currentStatusLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* 체크인 상태 */}
      {setCheckinStatus && (
        <View style={styles.filterLine}>
          <Text style={styles.filterLabel}>체크인 상태</Text>
          <TouchableOpacity
            style={styles.outlinedBtn}
            onPress={() => setCheckinModalVisible?.(true)}
          >
            <Text style={styles.outlinedBtnText}>{currentCheckinLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 봉사 일자 */}
      <View style={styles.filterLine}>
        <Text style={styles.filterLabel}>봉사 일자</Text>
        <View style={styles.filterValueRow}>
          <TouchableOpacity
            style={styles.outlinedBtn}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.outlinedBtnText}>
              {volunteerStartDate
                ? formatDateLabel(volunteerStartDate)
                : '시작일'}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: TEXT_MUTED, marginHorizontal: 4 }}>~</Text>
          <TouchableOpacity
            style={styles.outlinedBtn}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.outlinedBtnText}>
              {volunteerEndDate ? formatDateLabel(volunteerEndDate) : '종료일'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 초기화 */}
      <View style={styles.resetLine}>
        <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
          <Text style={styles.resetBtnText}>초기화</Text>
        </TouchableOpacity>
      </View>

      {/* DatePicker */}
      {showStartPicker && (
        <DateTimePicker
          value={volunteerStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => onChangeDate(e, d, 'start')}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={volunteerEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => onChangeDate(e, d, 'end')}
        />
      )}

      {/* Province Modal */}
      <Modal transparent visible={provinceModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <FlatList
              data={PROVINCES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setProvince(item);
                    setCity(null);
                    setProvinceModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      item === province && { color: ORANGE, fontWeight: '700' },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setProvinceModalVisible(false)}
            >
              <Text>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* City Modal */}
      <Modal transparent visible={cityModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <FlatList
              data={province ? CITIES_BY_PROVINCE[province] : []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCity(item);
                    setCityModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      item === city && { color: ORANGE, fontWeight: '700' },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setCityModalVisible(false)}
            >
              <Text>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal transparent visible={statusModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <FlatList
              data={STATUS_ITEMS}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setStatusFilter(item.value);
                    setStatusModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      item.value === statusFilter && {
                        color: ORANGE,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Checkin Modal */}
      {setCheckinStatus && (
        <Modal transparent visible={!!checkinModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <FlatList
                data={CHECKIN_ITEMS}
                keyExtractor={(item) => String(item.value)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setCheckinStatus(item.value);
                      setCheckinModalVisible?.(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        item.value === checkinStatus && {
                          color: ORANGE,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setCheckinModalVisible?.(false)}
              >
                <Text>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER },
  filterLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  filterLabel: { width: 78, fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  filterValueRow: { flex: 1, flexDirection: 'row' },
  outlinedBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    minHeight: 36,
  },
  outlinedBtnText: { color: ORANGE, fontSize: 12, fontWeight: '600' },
  resetLine: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: ORANGE, borderRadius: 12, minHeight: 36, minWidth: 70, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', maxHeight: '60%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  modalItemText: { fontSize: 14, color: TEXT_DARK },
  modalClose: { paddingVertical: 12, alignItems: 'center' },
});
