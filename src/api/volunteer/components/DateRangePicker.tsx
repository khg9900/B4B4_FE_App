import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from '../styles/UserParticipationStyles.ts';

interface Props {
  startTime: Date | null;
  endTime: Date | null;
  onChangeStart: (date: Date | null) => void;
  onChangeEnd: (date: Date | null) => void;
}

const formatDateTime = (date: Date | null) => {
  if (!date) return '선택';
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const DateRangePicker = ({ startTime, endTime, onChangeStart, onChangeEnd }: Props) => {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  return (
    <View style={styles.datePickerRow}>
      {/* 시작 시간 */}
      <TouchableOpacity onPress={() => setShowStart(true)} style={styles.datePickerButton}>
        <Text style={styles.datePickerText}>출석 시작: {formatDateTime(startTime)}</Text>
      </TouchableOpacity>

      {/* 종료 시간 */}
      <TouchableOpacity onPress={() => setShowEnd(true)} style={styles.datePickerButton}>
        <Text style={styles.datePickerText}>출석 종료: {formatDateTime(endTime)}</Text>
      </TouchableOpacity>

      {showStart && (
        <DateTimePicker
          value={startTime || new Date()}
          mode={tempDate ? 'time' : 'date'}
          onChange={(event, date) => {
            if (event.type === 'dismissed') { setShowStart(false); return; }
            if (!date) return;
            if (!tempDate) { setTempDate(date); }
            else {
              const final = new Date(tempDate);
              final.setHours(date.getHours(), date.getMinutes());
              onChangeStart(final);
              setShowStart(false);
              setTempDate(null);
            }
          }}
        />
      )}

      {showEnd && (
        <DateTimePicker
          value={endTime || new Date()}
          mode={tempDate ? 'time' : 'date'}
          onChange={(event, date) => {
            if (event.type === 'dismissed') { setShowEnd(false); return; }
            if (!date) return;
            if (!tempDate) { setTempDate(date); }
            else {
              const final = new Date(tempDate);
              final.setHours(date.getHours(), date.getMinutes());
              onChangeEnd(final);
              setShowEnd(false);
              setTempDate(null);
            }
          }}
        />
      )}
    </View>
  );
};

export default DateRangePicker;
