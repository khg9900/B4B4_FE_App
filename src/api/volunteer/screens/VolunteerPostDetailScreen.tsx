import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import axiosInstance from '../../global/api/axiosInstance';
import { volunteerApi } from '../api/VolunteerApi';
import type { PostDetailResponse } from '../types/Post';
import { KAKAO_JS_API_KEY } from '@env';
interface Team {
  teamId: number;
  teamNumber: number;
  maxCapacity: number;
  currentCount: number;
}

const VolunteerPostDetailScreen = () => {
  const route = useRoute<RouteProp<{ PostDetail: { postId: number } }, 'PostDetail'>>();
  const { postId } = route.params;

  const [postDetail, setPostDetail] = useState<PostDetailResponse | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

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
      const res = await axiosInstance.get(`/post/${postId}/teams`);
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
    } catch (err) {
      console.error(err);
      Alert.alert('❌ 참가 실패', '이미 참가했거나 인원이 가득 찼습니다.');
    }
  };

  useEffect(() => {
    fetchPostDetail();
    fetchTeams();
  }, []);

  if (!postDetail) return <ActivityIndicator style={{ marginTop: 30 }} />;

  const getMapHtml = (lat: number, lng: number, placeName: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_API_KEY}"></script>
      <style>
        html, body { margin: 0; padding: 0; height: 100%; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(${lat}, ${lng}),
          level: 3
        });

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(${lat}, ${lng})
        });
        marker.setMap(map);

        const infowindow = new kakao.maps.InfoWindow({
          content: '<div style="width: 100%; padding:5px; font-size:14px;">📍 ${placeName}</div>'
        });
        infowindow.open(map, marker);
      </script>
    </body>
    </html>
  `;

  const renderTeamItem = ({ item }: { item: Team }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text>팀 번호: {item.teamNumber}</Text>
        <Text>정원: {item.currentCount} / {item.maxCapacity}</Text>
      </View>
      <TouchableOpacity style={styles.joinButton} onPress={() => handleJoin(item.teamNumber)}>
        <Text style={styles.joinButtonText}>참가</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View>
      <Text style={styles.title}>{postDetail.title}</Text>
      <Text style={styles.content}>{postDetail.content}</Text>
      <Text style={styles.meta}>카테고리: {postDetail.category}</Text>
      <Text style={styles.meta}>정원: {postDetail.totalCapacity} / 팀당 {postDetail.teamSize}</Text>
      <Text style={styles.meta}>출석 시간: {postDetail.attendancePolicy.checkinStart} ~ {postDetail.attendancePolicy.checkinEnd}</Text>
      <Text style={styles.meta}>출석 반경: {postDetail.attendancePolicy.allowedRadiusM}m</Text>
      <Text style={styles.meta}>최소 머무는 시간: {postDetail.attendancePolicy.minStayMinutes}분</Text>
      <Text style={styles.meta}>장소: {postDetail.location.placeName}</Text>
      <View style={{ height: 240, marginVertical: 12 }}>
        <WebView
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          cacheEnabled={false}
          source={{
            html: getMapHtml(
              postDetail.location.latitude,
              postDetail.location.longitude,
              postDetail.location.placeName
            ),
          }}
        />
      </View>

      <Text style={[styles.title, { marginTop: 24 }]}>팀 목록</Text>
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

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  content: { fontSize: 14, marginBottom: 12 },
  meta: { fontSize: 13, marginBottom: 6, color: '#555' },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  joinButton: {
    backgroundColor: '#f26522',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
