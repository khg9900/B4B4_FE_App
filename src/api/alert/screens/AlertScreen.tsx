// 📁 src/alert/screens/AlertScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { useAlert } from '../hooks/useAlert';
import { AlertItem } from '../components/AlertItem';

const AlertTab = ({ type }: { type: 'disaster' | 'volunteer' }) => {
  const { alerts, loading, refetch } = useAlert(type);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <FlatList
      style={styles.alertList}
      data={alerts}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item }) => <AlertItem alert={item} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
};

const AlertScreen = () => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'disaster', title: '재난' },
    { key: 'volunteer', title: '봉사' },
  ]);

  const renderScene = SceneMap({
    disaster: () => <AlertTab type="disaster" />,
    volunteer: () => <AlertTab type="volunteer" />,
  });

  return (
    <View style={styles.container}>
      <View style={styles.buttonGroup}>
        {routes.map((route, i) => (
          <TouchableOpacity
            key={route.key}
            style={[styles.button, index === i && styles.activeButton]}
            onPress={() => setIndex(i)}
          >
            <Text style={index === i ? styles.activeText : styles.buttonText}>
              {route.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={() => null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  alertList: {
    flex: 1,
    padding: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  button: {
    backgroundColor: '#eee',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeButton: {
    backgroundColor: '#ff7c33',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  activeText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});

export default AlertScreen;
