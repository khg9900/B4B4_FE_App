import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchMyReports, ReportFilter } from '../api/myReportApi'

export default function ReportListPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string|undefined>(undefined);
  const [sortOrder, setSortOrder]     = useState<'DESC'|'ASC'>('DESC');

  const [startDate, setStartDate] = useState<Date|undefined>(undefined);
  const [endDate, setEndDate]     = useState<Date|undefined>(undefined);
  const [showPicker, setShowPicker] = useState<'start'|'end'|undefined>(undefined);

  const loadReports = async (pageNum: number, reset = true) => {
    try {
      if (reset) setLoading(true);

      // 정렬 파라미터
      const sortParam = `createdAt,${sortOrder.toLowerCase()}`;

      // 기본 필터 객체
      const filter: ReportFilter = {
        page: pageNum,
        size: 10,
        status: statusFilter,
        sort: sortParam,
      };

      // 날짜 필터 → 하루 전체 범위
      if (startDate) {
        const y = startDate.getFullYear();
        const m = String(startDate.getMonth()+1).padStart(2,'0');
        const d = String(startDate.getDate()).padStart(2,'0');
        filter.start = `${y}-${m}-${d}T00:00:00`;
      }
      if (endDate) {
        const y = endDate.getFullYear();
        const m = String(endDate.getMonth()+1).padStart(2,'0');
        const d = String(endDate.getDate()).padStart(2,'0');
        filter.end = `${y}-${m}-${d}T23:59:59`;
      }

      // API 호출
      const { content, last } = await fetchMyReports(filter);

      if (reset) setReports(content);
      else       setReports(prev => [...prev, ...content]);

      setHasNext(!last);
      setPage(pageNum);
    } catch (err: any) {
      console.error(err);
      Alert.alert('오류', '신고 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(0, true);
  }, [statusFilter, sortOrder, startDate, endDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports(0, true);
    setRefreshing(false);
  };
  const loadMore = () => {
    if (hasNext && !loading) loadReports(page + 1, false);
  };

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  const onChangeDate = (_: any, selected?: Date) => {
    setShowPicker(undefined);
    if (!selected) return;
    if (showPicker === 'start') setStartDate(selected);
    else if (showPicker === 'end') setEndDate(selected);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>목록을 불러오는 중...</Text>
      </View>
    );
  }

  const renderHeader = () => <Text style={styles.titleHeader}>신고목록</Text>;

  return (
    <View style={styles.container}>
      {/* 상태 필터 */}
      <View style={styles.filterRow}>
        {['ALL','PENDING','RECEIVED','CLOSED'].map(key => (
          <TouchableOpacity
            key={key}
            style={[styles.filterBtn, statusFilter === key && styles.activeBtn]}
            onPress={() => setStatusFilter(key === 'ALL' ? undefined : key)}
          >
            <Text>{key==='ALL' ? '전체' : key==='PENDING' ? '대기' : key ==='RECEIVED' ? '확인' : '완료'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateRow}>
  <TouchableOpacity style={styles.dateBtn} onPress={()=>setShowPicker('start')}>
    <Text>{ startDate ? formatDateLabel(startDate.toISOString()) : '시작일' }</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.dateBtn} onPress={()=>setShowPicker('end')}>
    <Text>{ endDate   ? formatDateLabel(endDate.toISOString())   : '종료일' }</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={[styles.dateBtn, {backgroundColor:'#f88'}]} 
    onPress={() => {
      setStartDate(undefined);
      setEndDate(undefined);
    }}
  >
    <Text>날짜 초기화</Text>
  </TouchableOpacity>
</View>

      {/* 정렬 토글 */}
      <TouchableOpacity
        style={styles.sortBtn}
        onPress={()=>setSortOrder(prev => prev==='DESC'?'ASC':'DESC')}
      >
        <Text>정렬: {sortOrder==='DESC' ? '최신순' : '오래된순'}</Text>
      </TouchableOpacity>

      {/* DatePicker */}
      {showPicker && (
        <DateTimePicker
          value={(showPicker==='start' ? startDate : endDate) || new Date()}
          mode="date"
          display={Platform.OS==='ios'? 'spinner' : 'default'}
          onChange={onChangeDate}
        />
      )}

      <FlatList
        data={reports}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({item})=>(
          <View style={styles.card}>
            <Text style={styles.title}>{item.disasterType}</Text>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={styles.date}>{formatDateLabel(item.createdAt)}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}
        ListFooterComponent={hasNext ? <ActivityIndicator style={{margin:16}}/> : null}
        ListEmptyComponent={()=><View style={styles.empty}><Text>신고 내역이 없습니다.</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1,backgroundColor:'#fff'},
  filterRow:{flexDirection:'row',justifyContent:'space-around',margin:8},
  filterBtn:{padding:6,borderRadius:4,backgroundColor:'#eee'},
  activeBtn:{backgroundColor:'#4ECDC4'},
  dateRow:{flexDirection:'row',justifyContent:'space-between',margin:8},
  dateBtn:{flex:1,padding:6,marginHorizontal:4,borderRadius:4,backgroundColor:'#eee',alignItems:'center'},
  sortBtn:{alignSelf:'flex-end',padding:8,margin:8},
  titleHeader:{fontSize:20,fontWeight:'bold',textAlign:'center',marginVertical:12},
  card:{padding:16,margin:8,borderRadius:8,backgroundColor:'#f1f1f1'},
  title:{fontSize:16,fontWeight:'bold'},
  status:{fontSize:14,marginVertical:4},
  date:{fontSize:12,color:'#666'},
  desc:{fontSize:14,marginTop:8},
  loadingContainer:{flex:1,justifyContent:'center',alignItems:'center'},
  loadingText:{marginTop:8,fontSize:16},
  empty:{flex:1,justifyContent:'center',alignItems:'center'},
});