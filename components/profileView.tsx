import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from "expo-router";
import { useContext, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from "../context/AuthContext";
import { ReportsContext } from "../context/ReportsContext";
import { useRelativeTime } from "../hooks/useRelativeTime";

//maps the incident status to a specific UI color
const IncidentCard = ({ item }: { item: any }) => {
    const displayTime = useRelativeTime(item?.time || "");
    const getMarkerColor = (status: string) => {
        switch (status) {
        case 'Verified': return '#4CAF50';
        case 'False': return '#E53935';
        default: return '#FF9800';
        }
    };

    return (
        <TouchableOpacity
        style={styles.card}
        onPress={() =>
            router.push({
            pathname: "/report",
            params: { incident: JSON.stringify({ id: item.id }) },
            })
        }
        >
            <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                    <Text style={styles.incidentTitle}>{item.title}</Text>
                    <Text style={styles.category}>{item.category}</Text>
                    <Text style={styles.meta}>{displayTime}</Text>
                    </View>
                    <View style={[styles.statusBadge, item.status === "Verified" ? styles.verified : item.status === "False" ? styles.false : styles.unverified]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>
                {item.description && <Text style={styles.description} numberOfLines={3}>{item.description}</Text>}
                <View style={styles.bottomRow}>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <Text style={styles.area}>{item.area}</Text>
                    </View>
                    <View style={styles.miniMapWrapper}>
                    <MapView
                        style={styles.miniMap}
                        initialRegion={{
                        latitude: item.coords.latitude,
                        longitude: item.coords.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        cacheEnabled={true}
                    >
                        <Marker coordinate={item.coords} pinColor={getMarkerColor(item.status)} />
                    </MapView>
                    </View>
                </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

interface ProfileViewProps {
    passedId?: string;
    onMenuPress?: () => void;
}

export default function ProfileView({ passedId, onMenuPress }: ProfileViewProps) {
    const insets = useSafeAreaInsets();
    const { logout, user, users, following, followUser } = useContext(AuthContext);
    const { incidents } = useContext(ReportsContext);
    const isMainTab = !passedId;
    
    const profileId = passedId || user?.userID;
    const isOwnProfile = profileId === user?.userID;
    //find the user data for this profile
    const profileUser = isOwnProfile ? user : users.find(u => u.userID === profileId);
    const profileUsername = profileUser?.username || "User";
    
    //calculate stats
    const userReports = incidents.filter(inc => inc.userID === profileId);
    const totalReports = userReports.length;
    const verifiedReports = userReports.filter(inc => inc.status === "Verified").length;
    const unverifiedReports = userReports.filter(inc => inc.status !== "Verified").length;
    
    const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
    const isFollowing = following.includes(profileId);

    //sorting reports (newest first)
    const filteredReports = userReports
        .filter((inc) => {
        if (filter === "verified") return inc.status === "Verified";
        if (filter === "unverified") return inc.status !== "Verified";
        return true;
        })
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return (
        <View style={styles.container}>
            <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    {isMainTab ? (
                        <TouchableOpacity onPress={onMenuPress}>
                        <AntDesign name="bars" size={24} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => router.back()}>
                        <AntDesign name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>{isOwnProfile ? "My Profile" : "Profile"}</Text>
                <View style={{ width: 24 }} /> 
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
                <View style={styles.profileCard}>
                <Text style={styles.name}>{profileUsername}</Text>
                <View style={styles.reputationBadge}>
                    <Text style={styles.reputationLabel}>TRUST SCORE</Text>
                    <Text style={styles.reputationValue}>{profileUser?.reputation || 0}</Text>
                </View>
                <Text style={styles.joined}>Joined: {profileUser?.joined || "Recently"}</Text>
                {!isOwnProfile && (
                    <TouchableOpacity 
                    style={[styles.followBtnProfile, isFollowing ? styles.followingBtnActive : styles.followBtnInactive]} 
                    onPress={() => followUser(profileId, profileUsername)}
                    >
                    <Text style={[styles.followBtnText, { color: isFollowing ? '#205933' : 'white' }]}>
                        {isFollowing ? "Following" : "Follow User"}
                    </Text>
                    </TouchableOpacity>
                )}
                </View>

                <View style={styles.statsContainer}>
                <TouchableOpacity style={[styles.statCard, filter === "all" && styles.activeStat]} onPress={() => setFilter("all")}>
                    <Text style={styles.statNumber}>{totalReports}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.statCard, filter === "verified" && styles.activeStat]} onPress={() => setFilter("verified")}>
                    <Text style={styles.statNumber}>{verifiedReports}</Text>
                    <Text style={styles.statLabel}>Verified</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.statCard, filter === "unverified" && styles.activeStat]} onPress={() => setFilter("unverified")}>
                    <Text style={styles.statNumber}>{unverifiedReports}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>{isOwnProfile ? "My Reports" : `${profileUsername}'s Reports`}</Text>
                
                {filteredReports.length > 0 ? (
                filteredReports.map((inc) => <IncidentCard key={inc.id} item={inc} />)
                ) : (
                <Text style={styles.noReportsText}>No reports found.</Text>
                )}

                <View style={styles.actionsContainer}>
                {isOwnProfile && (
                    <>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/editProfile")}>
                        <Text style={styles.actionText}>Edit Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={() => logout()}>
                        <Text style={[styles.actionText, { color: 'red' }]}>Logout</Text>
                    </TouchableOpacity>
                    </>
                )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f6f8",
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

    backIcon: {
        fontSize: 24,
        color: "white",
    },

    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
    },

    profileCard: {
        backgroundColor: "#ffffff",
        margin: 15,
        padding: 20,
        borderRadius: 12,
        elevation: 2,
        alignItems: "center",
    },

    name: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 8,
    },

    email: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },

    joined: {
        fontSize: 12,
        color: "#999",
        marginTop: 5,
    },

    statsContainer: {
        flexDirection: "row",
        marginHorizontal: 10,
        marginBottom: 10,
    },

    statCard: {
        flex: 1,
        backgroundColor: "#ffffff",
        marginHorizontal: 5,
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
        elevation: 1,
        borderWidth: 2,
        borderColor: 'transparent',
    },

    activeStat: {
        borderColor: '#205933',
    },

    statNumber: {
        fontSize: 18,
        fontWeight: "bold",
    },

    statLabel: {
        fontSize: 11,
        color: "gray",
        textTransform: 'uppercase',
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 15,
        marginTop: 10,
        marginBottom: 5,
    },

    card: {
        backgroundColor: "#fff",
        marginHorizontal: 15,
        marginTop: 12,
        padding: 16,
        borderRadius: 14,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    cardTopRow: {
        flexDirection: "row",
    },

    incidentTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
    },

    category: {
        fontSize: 13,
        color: "#666",
    },

    meta: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },

    description: {
        fontSize: 14,
        color: "#444",
        marginTop: 10,
        lineHeight: 18,
    },

    bottomRow: {
        flexDirection: "row",
        marginTop: 10,
        alignItems: 'flex-end',
    },

    area: {
        fontSize: 14,
        color: "#205933", 
        fontWeight: "600",
    },
    
    miniMapWrapper: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: "hidden",
        marginLeft: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },

    miniMap: {
        flex: 1,
    },

    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },

    statusText: {
        color: "white",
        fontSize: 10,
        fontWeight: "bold",
        textTransform: 'uppercase'
    },

    verified: { 
        backgroundColor: "#4CAF50" 
    },
    unverified: { 
        backgroundColor: "#FF9800"
    },

    false: { 
        backgroundColor: "#E53935" 
    },
    
    reputationBadge: {
        backgroundColor: "#f0f7f2",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#c2d6c9",
        alignItems: "center",
        marginBottom: 10,
    },

    reputationLabel: {
        fontSize: 8,
        fontWeight: "900",
        color: "#205933",
        letterSpacing: 0.5,
    },

    reputationValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#205933",
    },

    actionsContainer: {
        marginTop: 30,
        marginHorizontal: 15,
    },

    actionButton: {
        backgroundColor: "#ffffff",
        padding: 15,
        borderRadius: 12,
        elevation: 2,
        marginBottom: 12,
        alignItems: "center",
    },

    actionText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },

    noReportsText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },

    followBtnProfile: {
        marginTop: 15,
        paddingVertical: 8,
        paddingHorizontal: 25,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 140,
    },

    followBtnInactive: {
        backgroundColor: '#205933',
        borderColor: '#205933',
    },

    followingBtnActive: {
        backgroundColor: 'white',
        borderColor: '#205933',
    },

    followBtnText: {
        fontWeight: 'bold',
        fontSize: 14,
    },

    logoutButton: {
        borderColor: '#ffcdd2',
        borderWidth: 1,
    },

});