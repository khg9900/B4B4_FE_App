import React, { useEffect, useState } from 'react';
import { View, FlatList, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { volunteerParticipantApi } from '../api/VolunteerApi';
import type { VolunteerParticipationResponse } from '../types/Participation';
import styles from '../styles/UserParticipationStyles';

import ParticipationCard from '../components/ParticipationCard';
import StatusFilter from '../components/StatusFilter';
import DateRangePicker from '../components/DateRangePicker';

// 로컬 Date → KST ISO 문자열 변환
const formatAsKSTISOString = (date: Date): string => {
  const kstOffset = 9 * 60;
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const kstDate = new Date(utc + kstOffset * 60000);

  return kstDate.toISOString().slice(0, 19);
};

const UserParticipationScreen = () => {
  const [participations, setParticipations] = useState<VolunteerParticipationResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

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
      setParticipations((prev) =>
        prev.map((p) =>
          p.participantId === participantId ? { ...p, status: 'CANCELLED' } : p
        )
      );
      await volunteerParticipantApi.cancelParticipation(participantId);
      Alert.alert('알림', '참가가 취소되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '참가 취소 중 문제가 발생했습니다.');
      fetchMyParticipations();
    }
  };

  return (
    <View style={styles.container}>
      <StatusFilter value={statusFilter} onChange={setStatusFilter} />
      <DateRangePicker startTime={startTime} endTime={endTime} onChangeStart={setStartTime} onChangeEnd={setEndTime} />

      <FlatList
        data={participations}
        keyExtractor={(item) => item.participantId.toString()}
        renderItem={({ item }) => (
          <ParticipationCard item={item} onCancel={handleCancel} />
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default UserParticipationScreen;
