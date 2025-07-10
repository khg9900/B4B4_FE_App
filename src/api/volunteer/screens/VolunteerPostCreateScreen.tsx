import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import axiosInstance from '../../global/api/axiosInstance';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

const VolunteerPostCreateScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'RECRUITMENT',
    totalCapacity: '',
    teamSize: '',
    location: {
      placeName: '',
      latitude: '',
      longitude: '',
    },
    attendancePolicy: {
      checkinStart: '',
      checkinEnd: '',
      allowedRadiusM: '',
      minStayMinutes: '',
    },
  });

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        totalCapacity: parseInt(form.totalCapacity),
        teamSize: parseInt(form.teamSize),
        location: {
          ...form.location,
          latitude: parseFloat(form.location.latitude),
          longitude: parseFloat(form.location.longitude),
        },
        attendancePolicy: {
          ...form.attendancePolicy,
          allowedRadiusM: parseInt(form.attendancePolicy.allowedRadiusM),
          minStayMinutes: parseInt(form.attendancePolicy.minStayMinutes),
        },
      };
      console.log('📤 등록 전 데이터 확인:', payload);
      await axiosInstance.post('/post', payload);
      Alert.alert('✅ 모집글이 등록되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('❌ 작성 실패:', error);
      Alert.alert('작성 실패', '입력값을 다시 확인해주세요');
    }
  };

  const handleMapMessage = (event: any) => {
    console.log('📩 메시지 수신됨:', event.nativeEvent.data);
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location') {
        console.log('✅ 좌표 반영됨:', data);
        setForm(prev => ({
          ...prev,
          location: {
            placeName: data.address,
            latitude: data.latitude.toString(),
            longitude: data.longitude.toString(),
          },
        }));
      }
    } catch (e) {
      console.error('⚠️ 메시지 파싱 실패:', e);
    }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=31a31381a7d1acbd943f186a483e4194&libraries=services"></script>
      <style>
        html, body { margin: 0; padding: 0; height: 100%; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const container = document.getElementById('map');
        const map = new kakao.maps.Map(container, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 3
        });

        const marker = new kakao.maps.Marker();
        const geocoder = new kakao.maps.services.Geocoder();

        kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
          const latlng = mouseEvent.latLng;
          marker.setMap(map);
          marker.setPosition(latlng);

          geocoder.coord2Address(latlng.getLng(), latlng.getLat(), function(result, status) {
            if (status === kakao.maps.services.Status.OK && result.length > 0) {
              const address = result[0].road_address
                ? result[0].road_address.address_name
                : result[0].address?.address_name || '주소 없음';

              const payload = {
                type: 'location',
                latitude: latlng.getLat(),
                longitude: latlng.getLng(),
                address: address
              };

              alert("📦 보내는 데이터: " + JSON.stringify(payload));
              window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
            } else {
              alert("📛 주소를 가져오지 못했습니다.");
            }
          });
        });
      </script>
    </body>
    </html>
  `;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>모집글 작성</Text>

      <TextInput placeholder="제목" style={styles.input} value={form.title} onChangeText={v => setForm({ ...form, title: v })} />
      <TextInput placeholder="내용" style={styles.input} value={form.content} onChangeText={v => setForm({ ...form, content: v })} />
      <TextInput placeholder="총 인원" style={styles.input} keyboardType="number-pad" value={form.totalCapacity} onChangeText={v => setForm({ ...form, totalCapacity: v })} />
      <TextInput placeholder="팀당 인원" style={styles.input} keyboardType="number-pad" value={form.teamSize} onChangeText={v => setForm({ ...form, teamSize: v })} />

      <TextInput placeholder="출석 시작 시간 (예: 2025-06-01T09:00)" style={styles.input} value={form.attendancePolicy.checkinStart} onChangeText={v => setForm({ ...form, attendancePolicy: { ...form.attendancePolicy, checkinStart: v } })} />
      <TextInput placeholder="출석 종료 시간 (예: 2025-06-01T12:00)" style={styles.input} value={form.attendancePolicy.checkinEnd} onChangeText={v => setForm({ ...form, attendancePolicy: { ...form.attendancePolicy, checkinEnd: v } })} />
      <TextInput placeholder="출석 반경 (미터)" style={styles.input} keyboardType="number-pad" value={form.attendancePolicy.allowedRadiusM} onChangeText={v => setForm({ ...form, attendancePolicy: { ...form.attendancePolicy, allowedRadiusM: v } })} />
      <TextInput placeholder="최소 출석 시간 (분)" style={styles.input} keyboardType="number-pad" value={form.attendancePolicy.minStayMinutes} onChangeText={v => setForm({ ...form, attendancePolicy: { ...form.attendancePolicy, minStayMinutes: v } })} />

      <Text style={{ fontWeight: 'bold', marginVertical: 10 }}>📍 지도를 클릭해 위치를 선택하세요</Text>
      <View style={{ height: 300, backgroundColor: '#eee' }}>
        <WebView
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          cacheEnabled={false}
          source={{ html: mapHtml }}
          onMessage={handleMapMessage}
        />
      </View>

      <TextInput placeholder="장소명" style={styles.input} value={form.location.placeName} editable={true} />
      <TextInput placeholder="위도" style={styles.input} value={form.location.latitude} editable={true} />
      <TextInput placeholder="경도" style={styles.input} value={form.location.longitude} editable={true} />

      <Button title="등록하기" onPress={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
});

export default VolunteerPostCreateScreen;
