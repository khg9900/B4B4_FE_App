import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

const HEADER_HEIGHT = height * 0.08;
const ICON_SIZE = width * 0.20;

const Header = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <TouchableOpacity style={{ marginTop: -20 }}>
        <Image
          source={require('../img/b4b4.png')}
          style={styles.icon}
        />
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={{ marginTop: -12}} onPress={() => navigation.navigate('Alert' as never)} >
        <Image
          source={require('../img/alertoff.png')}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    height: HEADER_HEIGHT,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    resizeMode: 'contain',
  },
});

export default Header;