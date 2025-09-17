import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { VolunteerParticipationResponse } from '../types/Participation';
import styles from '../styles/UserParticipationStyles';

interface Props {
  item: VolunteerParticipationResponse;
  onCancel: (id: number) => void;
  onPress?: () => void; // 카드 클릭 핸들러
}

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

const formatTimeHM = (timeStr: string) => {
  if (!timeStr) return '';
  const [hh, mm] = timeStr.split(':');
  return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ParticipationCard = ({ item, onCancel, onPress }: Props) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
    <View style={styles.card}>
      <Text style={styles.title}>{item.postTitle} - {item.teamNumber}팀</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📌</Text>
        <Text style={styles.infoText}>장소: {item.province} {item.city} {item.placeName}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📆</Text>
        <Text style={styles.infoText}>
          일자 : {formatDate(item.volunteerDate)}
        </Text>
        <Text style={styles.infoIcon}>⏰</Text>
        <Text style={styles.infoText}>
          시간 : {formatTimeHM(item.volunteerStartTime)} ~ {formatTimeHM(item.volunteerEndTime)}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📊</Text>
        <Text style={styles.infoText}>참가 상태: </Text>
        <View style={getStatusBadgeStyle(item.status)}>
          <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      {item.status === 'PARTICIPATED' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => onCancel(item.participantId)}
        >
          <Text style={styles.cancelButtonText}>참가 취소</Text>
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
);

export default ParticipationCard;
