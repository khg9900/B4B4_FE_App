// src/api/location/components/DisasterSummary.tsx
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

type Props = {
  summary: { type: string; count: number }[];
  expanded: boolean;
  onToggle: () => void;
};

const DisasterSummary = ({ summary, expanded, onToggle }: Props) => {
  const visibleSummary = expanded ? summary : summary.slice(0, 2);

  if (summary.length === 0) return null;

  return (
    <View style={[styles.summaryBox, expanded && styles.summaryBoxExpanded]}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>재난 집계</Text>
        {summary.length > 3 && (
          <TouchableOpacity onPress={onToggle} style={styles.toggleBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.toggleText}>{expanded ? '접기 ▲' : `더보기 (${summary.length - 2}) ▼`}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={visibleSummary}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.type}</Text>
            <Text style={styles.cell}>{item.count} 건</Text>
          </View>
        )}
        scrollEnabled={expanded}
      />
    </View>
  );
};

export default DisasterSummary;

const styles = StyleSheet.create({
  summaryBox: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    padding: 10,
    elevation: 6,
    maxHeight: 150,
  },
  summaryBoxExpanded: { maxHeight: 280 },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryTitle: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  toggleBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FFE7D6' },
  toggleText: { fontSize: 12, color: '#FF6B00', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  cell: { fontSize: 13, color: '#333' },
});
