// src/api/location/components/ReportButton.tsx
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

type Props = {
  onPress: () => void;
};

const ReportButton = ({ onPress }: Props) => (
  <View style={styles.reportButtonContainer}>
    <TouchableOpacity style={styles.reportBoxButton} onPress={onPress}>
      <Text style={styles.reportBoxButtonText}>신고하기</Text>
    </TouchableOpacity>
  </View>
);

export default ReportButton;

const styles = StyleSheet.create({
  reportButtonContainer: {
    marginTop: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  reportBoxButton: {
    width: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reportBoxButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
  },
});
