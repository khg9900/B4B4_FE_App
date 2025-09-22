// src/api/location/components/ActionButtons.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

type ButtonConfig = {
  label: string;
  action: () => void;
};

type Props = {
  fetchShelters: () => void;
  fetchDisasters: () => void;
};

const ActionButtons = ({ fetchShelters, fetchDisasters }: Props) => {
  const buttons: ButtonConfig[] = [
    { label: '대피소 보기', action: fetchShelters },
    { label: '재난 정보 보기', action: fetchDisasters },
  ];

  return (
    <View style={styles.buttonRow}>
      {buttons.map((btn) => (
        <TouchableOpacity key={btn.label} style={styles.boxButton} onPress={btn.action}>
          <Text style={styles.boxButtonText}>{btn.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ActionButtons;

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  boxButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  boxButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
});
