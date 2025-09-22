// src/api/volunteer/screens/VolunteerPostDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import axiosInstance from '../../global/api/axiosInstance';
import { volunteerApi } from '../api/VolunteerApi';
import type { PostDetailResponse } from '../types/Post';
import { styles } from '../styles/VolunteerPostDetailStyles.ts';
import VolunteerMap from './VolunteerMap';
import {showServerErrorAlert} from '../../global/utils/showErrorAlert';

const PostCategoryMap: Record<string, string> = {
  RECRUITMENT: '봉사 활동 모집',
  SUPPORT: '구호 물품 지원',
};

interface Team {
  teamId: number;
  teamNumber: number;
  maxCapacity: number;
  currentCount: number;
}

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

export function formatTimeHHmm(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

const VolunteerPostDetailScreen = () => {
  const route = useRoute<RouteProp<{ PostDetail: { postId: number } }, 'PostDetail'>>();
  const { postId } = route.params;

  const [postDetail, setPostDetail] = useState<PostDetailResponse | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    fetchPostDetail();
    fetchTeams();
  }, []);

  const fetchPostDetail = async () => {
    try {
      const data = await volunteerApi.getPostDetail(postId);
      setPostDetail(data);
    } catch (err) {
      console.error('상세 정보 조회 실패:', err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axiosInstance.get(`/posts/${postId}/teams`);
      setTeams(res.data.payload.teams);
    } catch (err) {
      console.error('팀 정보 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (teamNumber: number) => {
    try {
      await axiosInstance.post(`/posts/${postId}/teams/${teamNumber}/apply`);
      Alert.alert('✅ 참가 성공', `팀 ${teamNumber}에 참가하셨습니다.`);
      fetchTeams();
    } catch (err: any) {
      const serverError = err.response?.data;
      console.error('팀 참가 실패:', serverError || err.message || JSON.stringify(err));

      showServerErrorAlert(serverError);
    }
  };

  if (!postDetail) return <ActivityIndicator style={{ marginTop: 30 }} />;

  const renderTeamItem = ({ item }: { item: Team }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardText}>팀 {item.teamNumber}</Text>
        <Text style={styles.cardSubText}>
          정원: {item.currentCount} / {item.maxCapacity}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.joinButton}
        onPress={() => handleJoin(item.teamNumber)}
      >
        <Text style={styles.joinButtonText}>참가하기</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* 정보 카드 */}
      <View style={styles.infoCard}>
        {/* 제목 & 카테고리 */}
        <Text style={styles.title}>{postDetail.title}</Text>
        <Text style={styles.category}>{PostCategoryMap[postDetail.category]}</Text>

        <Text style={[styles.label, { marginTop: 16 }]}>📄 세부 내용</Text>
        <Text style={styles.value}>{postDetail.content}</Text>

        <Text style={[styles.label, { marginTop: 16 }]}>📢 모집 일정</Text>
        <Text style={styles.value}>
          {formatDate(postDetail.recruitmentStartDate)} ~{' '} {formatDate(postDetail.recruitmentEndDate)}
        </Text>

        <Text style={[styles.label, { marginTop: 16 }]}>📆 봉사 일정</Text>
        <Text style={styles.value}>
          {formatDate(postDetail.volunteerDate)} {formatTimeHM(postDetail.volunteerStartTime)} ~{' '}
          {formatTimeHM(postDetail.volunteerEndTime)}
        </Text>

        <Text style={[styles.label, { marginTop: 16 }]}>📌 장소</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.value}>
            {postDetail.location.province} {postDetail.location.city}{' '} {postDetail.location.placeName}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Clipboard.setString(
                `${postDetail.location.province} ${postDetail.location.city} ${postDetail.location.placeName}`
              );
              Alert.alert('복사됨', '주소가 클립보드에 복사되었습니다.');
            }}
            style={styles.copyButton}
          >
            <Text style={styles.copyButtonText}>📋</Text>
          </TouchableOpacity>
        </View>

        <VolunteerMap
          lat={postDetail.location.latitude}
          lng={postDetail.location.longitude}
        />

        {/* 출석 정책 토글 */}
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.toggleBtn}>
            {expanded ? '▲ 접기' : '▼ 출석 정책'}
          </Text>
        </TouchableOpacity>

        {expanded && (
          <>
            <Text style={[styles.label, { marginTop: 16 }]}>🕑 출석 시간</Text>
            <Text style={styles.value}>
              {formatTimeHHmm(postDetail.attendancePolicy.checkinStart)} ~ {formatTimeHHmm(postDetail.attendancePolicy.checkinEnd)}
            </Text>
            <Text style={[styles.label, { marginTop: 16 }]}>📡 출석 인정 반경</Text>
            <Text style={styles.value}>{postDetail.attendancePolicy.allowedRadiusM} m</Text>
          </>
        )}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>팀 목록</Text>
    </View>
  );

  return (
    <FlatList
      ListHeaderComponent={renderHeader}
      data={teams}
      keyExtractor={(item) => item.teamId.toString()}
      renderItem={renderTeamItem}
      contentContainerStyle={styles.container}
      ListEmptyComponent={loading ? <ActivityIndicator size="large" /> : null}
    />
  );
};

export default VolunteerPostDetailScreen;
