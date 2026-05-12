import AntDesign from '@expo/vector-icons/AntDesign';
import { useIsFocused } from '@react-navigation/native';
import { router } from "expo-router";
import { useContext, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SideMenu from "../../components/sideMenu";
import { AuthContext } from '../../context/AuthContext';

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const { notifications } = useContext(AuthContext);
    const { markNotificationsAsRead } = useContext(AuthContext);
    const [menuVisible, setMenuVisible] = useState(false);
    const { logout } = useContext(AuthContext);

    //automatically triggers the mark as read logic whenever the user navigates to this screen
    useEffect(() => {
        if (isFocused) {
            markNotificationsAsRead();
        }
    }, [isFocused]);

     //groups the raw notifications array into sections
    const sections = useMemo(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recent = notifications.filter(n => new Date(n.time) >= sevenDaysAgo);
        const lastMonth = notifications.filter(n => {
            const date = new Date(n.time);
            return date < sevenDaysAgo && date >= thirtyDaysAgo;
        });
        const older = notifications.filter(n => new Date(n.time) < thirtyDaysAgo);

        const data = [];
        if (recent.length > 0) data.push({ title: 'Last 7 Days', data: recent });
        if (lastMonth.length > 0) data.push({ title: 'Last 30 Days', data: lastMonth });
        if (older.length > 0) data.push({ title: 'Older', data: older });
        
        return data;
    }, [notifications]);

    //handles navigation based on notification type
    const handleNotificationPress = (item: any) => {
        if (item.type === 'follow') {
            const profileId = item.fromUserID || item.senderID;
            if (profileId) {
                router.push(`../userProfile?id=${profileId}`);
            }
        } 
        else if (item.type === 'upvote') {
            const reportId = item.reportID || item.incidentID;
            if (reportId) {
                router.push({
                    pathname: "/report",
                    params: { incident: JSON.stringify({ id: reportId }) },
                });
            }
        }
        else if (item.type === 'safety_alert') {
            if (item.reportID) {
                router.push({
                    pathname: "/report",
                    params: { incident: JSON.stringify({ id: item.reportID }) },
                });
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.backButton}>
                    <AntDesign name="bars" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <View style={{ width: 40 }} /> 
                </View>
            </View>
    
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                stickySectionHeadersEnabled={false}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionHeader}>{title}</Text>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.notifCard} 
                        onPress={() => handleNotificationPress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.notifContent}>
                            <View style={styles.notifHeader}>
                                <AntDesign 
                                    name={
                                        item.type === 'follow' ? "user" : 
                                        item.type === 'safety_alert' ? "alert" : "up"
                                    }
                                    size={16} 
                                    color="#205933" 
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={styles.notifText}>{item.message}</Text>
                            </View>
                            <Text style={styles.notifTime}>
                                {item.time ? new Date(item.time).toLocaleDateString() : ''} at {item.time ? new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No notifications yet.</Text>
                    </View>
                }
            />
    
            <SideMenu 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                logout={logout} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    
    container: { 
        flex: 1, 
        backgroundColor: '#f4f6f8' 
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

    backButton: {
        width: 40,
        justifyContent: 'center',
    },

    title: { 
        fontSize: 20, 
        fontWeight: "bold", 
        color: "white" 
    },

    listContent: {
        paddingTop: 15,
        paddingBottom: 20,
    },

    notifCard: { 
        backgroundColor: 'white', 
        flexDirection: 'row',
        padding: 15, 
        marginHorizontal: 15, 
        marginBottom: 10, 
        borderRadius: 12, 
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        alignItems: 'center'
    },

    notifHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },

    notifContent: {
        flex: 1
    },

    notifText: { 
        fontSize: 15, 
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },

    notifTime: { 
        fontSize: 12, 
        color: '#999', 
        marginTop: 5 
    },

    emptyContainer: {
        marginTop: 100,
        alignItems: 'center'
    },

    emptyText: { 
        color: '#999',
        fontSize: 16
    },

    sectionHeader: {
        fontSize: 14,
        fontWeight: '800',
        color: '#888',
        marginTop: 10,
        marginBottom: 10,
        marginHorizontal: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

});