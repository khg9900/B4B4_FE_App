// src/api/report/screens/ReportScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Alert, TouchableOpacity, ActivityIndicator,
  Platform, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { createReport } from '../api/report';
import { useCurrentLocation } from '../../location/hooks/useCurrentLocation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const B4_ORANGE = '#FF6B00';
const B4_ORANGE_LIGHT = '#FFD4B3';
const TABBAR_HEIGHT = 56;

const disasterTypeNames = {
  EARTHQUAKE: '지진', FLOOD: '홍수', TYPHOON: '태풍',
  WILDFIRE: '산불', LANDSLIDE: '산사태', POWER_OUTAGE: '정전',
  TERROR_ATTACK: '테러', BUILDING_COLLAPSE: '건물 붕괴'
};

const joinLabel = (...parts: (string | null | undefined)[]) =>
  parts.filter(p => p && p.trim() && p.trim().toLowerCase() !== 'null').join(' ');

const norm = (v?: string | null) =>
  v && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : null;

const ReportScreen = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<Asset | null>(null);
  const [video, setVideo] = useState<Asset | null>(null);

  const { latitude, longitude, province, city, loading } = useCurrentLocation();

  const insets = useSafeAreaInsets();
  const tabBarHeight = TABBAR_HEIGHT;

  const pickMedia = async (type: 'photo' | 'video') => {
    try {
      const result = await launchImageLibrary({ mediaType: type });
      if (result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        if (type === 'photo') {
          setImage(selected);
          setVideo(null);
        } else {
          setVideo(selected);
          setImage(null);
        }
      }
    } catch (e) {
      console.warn('미디어 선택 실패:', e);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setDescription('');
    setImage(null);
    setVideo(null);
  };

  const handleReport = async () => {
    if (!selectedType || !description.trim() || !province || latitude == null || longitude == null) {
      Alert.alert('오류', '재난 유형, 설명, 위치 정보가 모두 필요합니다.');
      return;
    }

    const requestPayload = {
      disasterType: selectedType,
      description,
      province: norm(province)!,
      city: norm(city),
      latitude,
      longitude,
      image: image
        ? {
            uri: image.uri!,
            type: image.type!,
            fileName: image.fileName!,
          }
        : undefined,
      video: video
        ? {
            uri: video.uri!,
            type: video.type!,
            fileName: video.fileName!,
          }
        : undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await createReport(requestPayload);
      Alert.alert('신고 완료', `재난 유형: ${res.disasterType}`);
      resetForm();
    } catch (err) {
      console.error('❌ 신고 실패:', err);
      Alert.alert('신고 실패', '서버 요청 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={B4_ORANGE} />
        <Text style={{ marginTop: 20 }}>위치 정보를 가져오는 중...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: tabBarHeight + insets.bottom + -20,
        }}
      >
        <View style={styles.headerBar}>
          <Text style={styles.headerText}>재난 신고</Text>
        </View>

        <View style={{ marginBottom: 28 }}>
          <Text style={[styles.subheader, { marginBottom: 16 }]}>재난 유형 선택</Text>
          <View style={styles.typeContainer}>
            {Object.entries(disasterTypeNames).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedType(key)}
                style={[styles.typeButton, selectedType === key && styles.typeButtonSelected]}
              >
                <Text style={{ color: selectedType === key ? B4_ORANGE : 'black', fontWeight: '600' }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.subheader, { marginBottom: 16 }]}>미디어 첨부</Text>
        <View style={styles.mediaBoxWrapper}>
          <TouchableOpacity onPress={() => pickMedia('photo')} style={styles.mediaBox}>
            <Text style={styles.mediaIcon}>📷</Text>
            <Text style={styles.mediaLabel}>사진</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickMedia('video')} style={styles.mediaBox}>
            <Text style={styles.mediaIcon}>🎥</Text>
            <Text style={styles.mediaLabel}>영상</Text>
          </TouchableOpacity>
        </View>

        {image && <Text style={styles.fileText}>📷 선택된 이미지: {image.fileName}</Text>}
        {video && <Text style={styles.fileText}>🎞 선택된 영상: {video.fileName}</Text>}

        <Text style={styles.locationLabel}>📍 위치: {joinLabel(province, city)}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            multiline
            scrollEnabled
            placeholder="상황 설명을 입력하세요 (최대 1000자)"
            value={description}
            maxLength={1000}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.charCount}>{description.length}/1000</Text>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleReport}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>{isSubmitting ? '접수중...' : '신고하기'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ReportScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  headerBar: {
    backgroundColor: B4_ORANGE,
    paddingVertical: 18,
    width: '100%',
    marginBottom: 24,
  },
  headerText: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  subheader: { fontSize: 16, fontWeight: '600' },
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    margin: 4,
    backgroundColor: '#fff',
  },
  typeButtonSelected: {
    backgroundColor: B4_ORANGE_LIGHT,
    borderColor: B4_ORANGE,
  },
  locationLabel: { fontSize: 13, color: '#777', marginTop: 16, marginLeft: 4 },
  mediaBoxWrapper: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  mediaBox: {
    flex: 1,
    height: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  mediaIcon: { fontSize: 28 },
  mediaLabel: { marginTop: 6, fontSize: 13, fontWeight: '600' },
  fileText: { fontSize: 14, marginBottom: 6, color: '#333' },
  inputWrapper: { marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    maxHeight: 200,
    backgroundColor: 'white',
  },
  charCount: { textAlign: 'right', fontSize: 12, color: '#888', marginBottom: 12, marginTop: 4 },
  submitButton: {
    backgroundColor: B4_ORANGE,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
});
