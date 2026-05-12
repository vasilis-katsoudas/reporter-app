import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  logout?: () => void;
}

export default function SideMenu({ visible, onClose, logout }: SideMenuProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  //local state to keep the component mounted during the exit animation
  const [shouldRender, setShouldRender] = useState(visible);
  //animation refs for the sliding drawer and the dark background fade
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      //run slide-in and fade-in at the same time
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.back(0.5)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      //run slide-out and fade-out at the same time
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SCREEN_WIDTH,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        //unmount after animation finishes
        setShouldRender(false);
      });
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalWrapper}>
        <Animated.View style={[styles.drawerOverlay, { opacity: opacityAnim }]}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={onClose} 
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.drawerContent, 
            { 
              paddingTop: insets.top,
              transform: [{ translateX: slideAnim }] 
            }
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text style={styles.menuTitleReporter}>Reporter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItemsContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { onClose(); router.push("/profile"); }}
            >
              <AntDesign name="user" size={20} color="#205933" />
              <Text style={styles.menuItemText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                onClose();
                router.push("/safetyZones");
              }}
            >
              <AntDesign name="alert" size={20} color="#205933" />
              <Text style={styles.menuItemText}>Safety Zones</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                onClose();
                router.push("/settings");
              }}
            >
              <AntDesign name="setting" size={20} color="#205933" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => { 
                onClose(); 
                router.push("/help"); 
              }}
            >
              <AntDesign name="question" size={20} color="#205933" />
              <Text style={styles.menuItemText}>Help Center</Text>
            </TouchableOpacity>

            <View style={styles.drawerDivider} />
          </View>

          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem, { marginBottom: insets.bottom + 20 }]}
            onPress={() => { onClose(); if(logout) logout(); }}
          >
            <AntDesign name="logout" size={20} color="#E53935" />
            <Text style={[styles.menuItemText, { color: '#E53935' }]}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    flexDirection: 'row',
  },

  drawerOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  drawerContent: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: 'white',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
  },

  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  menuTitleReporter: {
    fontSize: 22,
    fontWeight: "800",
    color: "#205933",
    letterSpacing: -0.5,
  },

  closeButton: {
    padding: 5,
  },

  menuItemsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },

  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
    fontWeight: '600',
  },

  drawerDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },

  logoutItem: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  
});