// 📁 src/alert/components/AlertItem.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getRelativeTime, formatKoreanDate } from '../utils/dateUtils';
import { Alert } from '../types';

type Props = {
  alert: Alert;
};

export const AlertItem = ({ alert }: Props) => {
  const renderContent = () => {
    if (alert.type === 'disaster') {
      return (
        <>
          <Text style={styles.alertTitle}>
            [재난 알림] {alert.si} {alert.gu} {alert.disasterType} 발생 알림
          </Text>
          <Text style={styles.alertText}>
            {alert.si} {alert.gu}에서 {alert.disasterType} 신고가 {alert.count}건 이상 접수되었습니다.
          </Text>
        </>
      );
    }

    return (
      <>
        <Text style={styles.alertTitle}>
          [봉사 알림] {alert.title} 변경 공지
        </Text>
        <Text style={styles.alertText}>제목 : {alert.title}</Text>
        <Text style={styles.alertText}>장소 : {alert.placeName}</Text>
        {alert.checkinStart && (
          <Text style={styles.alertText}>
            시간 : {formatKoreanDate(alert.checkinStart)}
          </Text>
        )}
      </>
    );
  };

  return (
    <View style={styles.alertItem}>
      {renderContent()}
      <Text style={styles.timeRight}>{getRelativeTime(alert.createdAt)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  alertItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  alertTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  alertText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeRight: {
    textAlign: 'right',
    color: '#aaa',
    fontSize: 12,
    marginTop: 6,
  },
});
