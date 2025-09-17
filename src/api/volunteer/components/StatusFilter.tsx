import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import styles from '../styles/UserParticipationStyles.ts';

const STATUS_OPTIONS = [
  { label: '전체', value: null },
  { label: '참가중', value: 'PARTICIPATED' },
  { label: '취소됨', value: 'CANCELLED' },
  { label: '블랙리스트', value: 'BLACKLISTED' },
  { label: '출석완료', value: 'PRESENT' },
  { label: '결석', value: 'ABSENT' },
];

interface Props {
  value: string | null;
  onChange: (val: string | null) => void;
}

const StatusFilter = ({ value, onChange }: Props) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.filterSection}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>상태:</Text>
        <TouchableOpacity style={styles.pickerWrapper} onPress={() => setModalVisible(true)}>
          <Text style={styles.pickerText}>
            {STATUS_OPTIONS.find((o) => o.value === value)?.label || '전체'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={modalVisible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          {STATUS_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value ?? 'all'}
              onPress={() => {
                onChange(option.value);
                setModalVisible(false);
              }}
              style={styles.modalItem}
            >
              <Text style={styles.modalItemText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
};

export default StatusFilter;
