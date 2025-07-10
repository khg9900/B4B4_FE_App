// 📁 WelcomeScreen.tsx
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { startBackgroundService } from '../backgroundServiceControl'; // ✅ 경로는 실제 위치에 따라 수정

const WelcomeScreen = () => {
  const navigation = useNavigation();

  const handleGoToDashboard = () => {
    startBackgroundService(); // ✅ 위치 추적 서비스 시작
    navigation.navigate('Dashboard' as never); // ✅ 화면 이동
  };

  return (
    <View>
      <TouchableOpacity onPress={() => navigation.navigate('ReportScreen' as never)}>
        <Text>신고</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleGoToDashboard}>
        <Text>대쉬보드 (위치 추적 시작)</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeScreen;
