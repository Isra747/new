import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

const Footer = () => {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[styles.navItem, route.name === 'Home' && styles.activeNavItem]}
        onPress={() => navigation.navigate('Home')}
      >
        <Icon name="home" size={24} color={route.name === 'Home' ? '#5a4635' : '#aaa'} />
        <Text style={[styles.navText, route.name === 'Home' && styles.activeNavText]}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.navItem, route.name === 'Notification' && styles.activeNavItem]}
        onPress={() => navigation.navigate('Notification')}
      >
        <Icon name="notifications" size={24} color={route.name === 'Notification' ? '#5a4635' : '#aaa'} />
        <Text style={[styles.navText, route.name === 'Notification' && styles.activeNavText]}>Notifications</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.navItem, route.name === 'Profile' && styles.activeNavItem]}
        onPress={() => navigation.navigate('Profile')}
      >
        <Icon name="person" size={24} color={route.name === 'Profile' ? '#5a4635' : '#aaa'} />
        <Text style={[styles.navText, route.name === 'Profile' && styles.activeNavText]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#aaa',
  },
  activeNavItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#5a4635',
  },
  activeNavText: {
    fontSize: 12,
    color: '#5a4635',
    fontWeight: 'bold',
  },
});

export default Footer;
