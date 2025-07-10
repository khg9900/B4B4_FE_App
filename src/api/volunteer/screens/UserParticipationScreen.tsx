import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { volunteerparticipantApi } from '../api/VolunteerApi';
import type { VolunteerParticipationResponse } from '../types/Participation';

const UserParticipationScreen = () => {
  const [participations, setParticipations] = useState<VolunteerParticipationResponse[]>([]);

  useEffect(() => {
    fetchMyParticipations();
  }, []);

  const fetchMyParticipations = async () => {
    try {
      const data = await volunteerparticipantApi.getMyParticipations();
      setParticipations(data);
    } catch (error) {
      console.error('참가 목록 조회 실패:', error);
    }
  };

  const handleCancel = async (participantId: number) => {
    try {
      await volunteerparticipantApi.cancelParticipation(participantId);
      Alert.alert('알림', '참가가 취소되었습니다.');
      fetchMyParticipations(); // 새로고침
    } catch (error: any) {
      console.error('참가 취소 실패:', error.response?.data || error.message);
      Alert.alert('오류', error.response?.data?.message || '참가 취소 중 문제가 발생했습니다.');
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

const renderItem = ({ item }: { item: VolunteerParticipationResponse }) => (
  <View style={styles.card}>
    <Text style={styles.title}>
      {item.postTitle} - {item.teamNumber}팀
    </Text>
    <Text>장소: {item.placeName}</Text>
    <Text>참가 상태: {getStatusLabel(item.status)}</Text>
    <Text>참가 시각: {new Date(item.joinedAt).toLocaleString()}</Text>
    <Text>출석 시작: {new Date(item.checkinStart).toLocaleString()}</Text>

    {item.status === 'PARTICIPATED' && (
      <View style={styles.buttonWrapper}>
        <Button title="참가 취소" onPress={() => handleCancel(item.participantId)} />
      </View>
    )}
  </View>
);


  return (
    <FlatList
      data={participations}
      keyExtractor={(item) => item.participantId.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  buttonWrapper: { marginTop: 10 },
});

export default UserParticipationScreen;
