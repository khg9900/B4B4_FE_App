import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');

const FOOTER_HEIGHT = height * 0.08;
const ICON_SIZE = width * 0.20;

const Footer = () => {
  const navigation = useNavigation(); 

  return (
    <View style={[styles.footer]}>
      <TouchableOpacity onPress={() => navigation.navigate('MainScreen' as never)}>
        <Image
          source={require('../img/home.png')}
          style={styles.icon}
        />
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity onPress={() => navigation.navigate('VolunteerPosts' as never)}>
        <Image
          source={require('../img/volunteericon.png')}
          style={styles.icon}
        />
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity onPress={() => navigation.navigate('MyActivities' as never)}>
        <Image
          source={require('../img/mypageicon.png')}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    height: FOOTER_HEIGHT,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    resizeMode: 'contain',
  },
});

export default Footer;