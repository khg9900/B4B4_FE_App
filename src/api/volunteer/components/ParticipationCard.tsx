import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { VolunteerParticipationResponse } from '../types/Participation';
import styles from '../styles/UserParticipationStyles.ts';

interface Props {
  item: VolunteerParticipationResponse;
  onCancel: (id: number) => void;
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

const ParticipationCard = ({ item, onCancel }: Props) => (
  <View style={styles.card}>
    <Text style={styles.title}>{item.postTitle} - {item.teamNumber}팀</Text>
    <View style={styles.infoRow}><Text style={styles.infoIcon}>📍</Text><Text style={styles.infoText}>장소: {item.placeName}</Text></View>
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>📊</Text>
      <Text style={styles.infoText}>참가 상태: </Text>
      <View style={getStatusBadgeStyle(item.status)}>
        <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
      </View>
    </View>
    <View style={styles.infoRow}><Text style={styles.infoIcon}>⏰</Text><Text style={styles.infoText}>참가 시각: {new Date(item.joinedAt).toLocaleString()}</Text></View>
    <View style={styles.infoRow}><Text style={styles.infoIcon}>🕐</Text><Text style={styles.infoText}>출석 시작: {new Date(item.checkinStart).toLocaleString()}</Text></View>
    <View style={styles.infoRow}><Text style={styles.infoIcon}>🕕</Text><Text style={styles.infoText}>출석 종료: {new Date(item.checkinEnd).toLocaleString()}</Text></View>

    {item.status === 'PARTICIPATED' && (
      <TouchableOpacity style={styles.cancelButton} onPress={() => onCancel(item.participantId)}>
        <Text style={styles.cancelButtonText}>참가 취소</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default ParticipationCard;
