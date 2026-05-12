import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function MapControls({ mapType, onToggleMapType, onCenterUser }: any) {
    return (
        <View style={styles.floatingControls}>
            <TouchableOpacity style={styles.fab} onPress={onToggleMapType}>
                <MaterialCommunityIcons name="layers-outline" size={24} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.fab, { marginTop: 12 }]} onPress={onCenterUser}>
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#205933" />
            </TouchableOpacity>
        </View>
    );
}


const styles = StyleSheet.create({ 
    floatingControls: {
        position: 'absolute',
        bottom: 40,
        right: 16,
        zIndex: 5,
    },

    fab: {
        backgroundColor: 'white',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
});