// src/screens/UserParticipationScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { volunteerParticipantApi } from '../api/VolunteerApi';
import type { VolunteerParticipationResponse } from '../types/Participation';
import styles from '../styles/UserParticipationStyles';
import ParticipationCard from '../components/ParticipationCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import VolunteerPostFilter from '../components/VolunteerPostFilter';

const formatAsKSTISOString = (date: Date): string => {
  const kstOffset = 9 * 60;
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const kstDate = new Date(utc + kstOffset * 60000);
  return kstDate.toISOString().slice(0, 10);
};

const UserParticipationScreen = () => {
  const [participations, setParticipations] = useState<VolunteerParticipationResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 필터 상태
  const [province, setProvince] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED' | 'COMPLETED' | null>(null);
  const [volunteerStartDate, setVolunteerStartDate] = useState<Date | null>(null);
  const [volunteerEndDate, setVolunteerEndDate] = useState<Date | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<'PARTICIPATED' | 'CANCELLED' | 'BLACKLISTED' | 'PRESENT' | 'ABSENT' | null>(null);

  // 모달/Picker 상태
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    fetchMyParticipations();
  }, [province, city, statusFilter, volunteerStartDate, volunteerEndDate, checkinStatus]);

  const fetchMyParticipations = async () => {
    try {
      const params: any = {};
      if (province) params.province = province;
      if (city) params.city = city;
      if (statusFilter) params.postStatus = statusFilter;
      if (volunteerStartDate) params.volunteerStartDate = formatAsKSTISOString(volunteerStartDate);
      if (volunteerEndDate) params.volunteerEndDate = formatAsKSTISOString(volunteerEndDate);
      if (checkinStatus) params.checkinStatus = checkinStatus;
      const data = await volunteerParticipantApi.getMyParticipations(params);
      setParticipations(data);
    } catch (error) {
      console.error('참가 목록 조회 실패:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMyParticipations();
    } finally {
      setRefreshing(false);
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

  const resetFilters = () => {
    setProvince(null);
    setCity(null);
    setStatusFilter(null);
    setVolunteerStartDate(null);
    setVolunteerEndDate(null);
    setCheckinStatus(null);
  };

  return (
    <View style={styles.container}>
      {/* 공통 필터 + 체크인 상태 필터 */}
      <VolunteerPostFilter
        province={province}
        city={city}
        statusFilter={statusFilter}
        volunteerStartDate={volunteerStartDate}
        volunteerEndDate={volunteerEndDate}
        checkinStatus={checkinStatus}
        setProvince={setProvince}
        setCity={setCity}
        setStatusFilter={setStatusFilter}
        setVolunteerStartDate={setVolunteerStartDate}
        setVolunteerEndDate={setVolunteerEndDate}
        setCheckinStatus={setCheckinStatus}
        provinceModalVisible={provinceModalVisible}
        cityModalVisible={cityModalVisible}
        statusModalVisible={statusModalVisible}
        checkinModalVisible={checkinModalVisible}
        showStartPicker={showStartPicker}
        showEndPicker={showEndPicker}
        setProvinceModalVisible={setProvinceModalVisible}
        setCityModalVisible={setCityModalVisible}
        setStatusModalVisible={setStatusModalVisible}
        setCheckinModalVisible={setCheckinModalVisible}
        setShowStartPicker={setShowStartPicker}
        setShowEndPicker={setShowEndPicker}
        resetFilters={resetFilters}
      />

      {/* 참가 목록 */}
      <FlatList
        data={participations}
        keyExtractor={(item) => item.participantId.toString()}
        renderItem={({ item }) => (
          <ParticipationCard
            item={item}
            onCancel={handleCancel}
            onPress={() => navigation.navigate('PostDetail', { postId: item.postId })}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
};

export default UserParticipationScreen;
