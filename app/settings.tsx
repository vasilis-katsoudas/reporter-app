import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [locationSharing, setLocationSharing] = useState(true);

    //handles both toggle and navigation items
    const SettingItem = ({ icon, title, value, onValueChange, type = 'switch' }: any) => (
        <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
            <AntDesign name={icon} size={20} color="#205933" />
            <Text style={styles.settingText}>{title}</Text>
        </View>
        {type === 'switch' ? (
            <Switch
            trackColor={{ false: '#ddd', true: '#205933' }}
            thumbColor={Platform.OS === 'ios' ? '#fff' : value ? '#fff' : '#f4f3f4'}
            onValueChange={onValueChange}
            value={value}
            />
        ) : (
            <AntDesign name="right" size={16} color="#ccc" />
        )}
        </View>
    );

    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
            <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <AntDesign name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 40 }} />
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionLabel}>APPEARANCE</Text>
            <View style={styles.sectionCard}>
            <SettingItem 
                icon="bulb" 
                title="Dark Mode" 
                value={isDarkMode} 
                onValueChange={setIsDarkMode} 
            />
            </View>

            <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
            <View style={styles.sectionCard}>
            <SettingItem 
                icon="alert" 
                title="Push Notifications" 
                value={pushEnabled} 
                onValueChange={setPushEnabled} 
            />
            <View style={styles.divider} />
            <SettingItem 
                icon="mail" 
                title="Email Updates" 
                type="link" 
            />
            </View>

            <Text style={styles.sectionLabel}>PRIVACY & SAFETY</Text>
            <View style={styles.sectionCard}>
            <SettingItem 
                icon="environment" 
                title="Location Sharing" 
                value={locationSharing} 
                onValueChange={setLocationSharing} 
            />
            <View style={styles.divider} />
            <SettingItem 
                icon="lock" 
                title="Blocked Users" 
                type="link" 
            />
            </View>

            <TouchableOpacity style={styles.dangerZone}>
            <Text style={styles.dangerText}>Delete Account</Text>
            </TouchableOpacity>
        </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f4f6f8' 
    },

    containerDark: { 
        backgroundColor: '#121212' 
    },

    headerBackground: {
        backgroundColor: "#205933",
        zIndex: 10,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        paddingVertical: 15,
    },

    headerTitle: { 
        fontSize: 20, 
        fontWeight: "bold", 
        color: "white",
    },

    backButton: { 
        width: 40,
    },

    scrollContent: { 
        padding: 20
     },

    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 1,
    },

    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },

    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },

    settingLeft: { 
        flexDirection: 'row',
        alignItems: 'center' 
    },

    settingText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        fontWeight: '500',
    },

    divider: { 
        height: 1, 
        backgroundColor: '#f0f0f0' 
    },

    dangerZone: {
        marginTop: 10,
        padding: 16,
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ffcdd2',
    },

    dangerText: { 
        color: '#d32f2f', 
        fontWeight: '700' 
    },

});