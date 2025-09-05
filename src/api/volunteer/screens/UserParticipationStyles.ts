import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterSection: { padding: 16, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  filterLabel: { fontSize: 14, fontWeight: 'bold', marginRight: 8, color: '#333' },
  pickerWrapper: { flex: 1, height: 40, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, backgroundColor: 'white', justifyContent: 'center' },
  pickerText: { fontSize: 14, color: '#333' },
  datePickerRow: { flexDirection: 'row', gap: 8 },
  datePickerButton: { flex: 1, padding: 12, backgroundColor: '#e9ecef', borderRadius: 8, alignItems: 'center' },
  datePickerText: { fontSize: 12, color: '#333', textAlign: 'center' },
  listContainer: { padding: 16, paddingBottom: 100 },
  card: { borderWidth: 1, borderColor: '#ddd', padding: 16, borderRadius: 12, marginBottom: 14, backgroundColor: '#fafafa', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoIcon: { width: 16, marginRight: 6, fontSize: 12 },
  infoText: { fontSize: 14, color: '#555', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
  statusParticipated: { backgroundColor: '#d4edda' },
  statusCancelled: { backgroundColor: '#f8d7da' },
  statusPresent: { backgroundColor: '#d1ecf1' },
  statusAbsent: { backgroundColor: '#f8d7da' },
  statusBlacklisted: { backgroundColor: '#f5f5f5' },
  cancelButton: { marginTop: 12, backgroundColor: '#ff8800', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContainer: { position: 'absolute', top: 120, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16 },
  modalItemText: { fontSize: 14, color: '#333' },
});

export default styles;
