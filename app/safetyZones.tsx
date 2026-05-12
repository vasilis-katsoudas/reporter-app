import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useContext, useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Circle } from "react-native-maps";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebaseConfig";

const SCREEN_HEIGHT = Dimensions.get('window').height;

//preset tags to make it faster for users to label their zones
const QUICK_TAGS = [
    { label: 'Home', icon: 'home' },
    { label: 'Work', icon: 'briefcase' },
    { label: 'School', icon: 'book' },
    { label: 'Gym', icon: 'heart' },
];

export default function SafetyZones() {
    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    
    const [label, setLabel] = useState("");
    const [region, setRegion] = useState({
        latitude: 38.0262,
        longitude: 23.8150,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    //request GPS permission and center the map on the user
    useEffect(() => {
        (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            let currentLocation = await Location.getCurrentPositionAsync({});
            setRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
            });
        }
        })();
    }, []);

    //saves the current map center and chosen label to the user's document
    const addZone = async () => {
        if (!label) return alert("Please select a tag or type a name!");
        const userRef = doc(db, "users", user.userID);
        const newZone = {
        id: Date.now().toString(),
        label: label,
        coords: { latitude: region.latitude, longitude: region.longitude },
        radius: 1000,
        };

        try {
            //arrayUnion adds the new zone to the existing array in Firebase
            await updateDoc(userRef, { safetyZones: arrayUnion(newZone) });
            setLabel("");
            alert("Safety Zone active!");
        } catch (e) { 
            console.error(e); 
        }
    };

    //removes a specific zone from the user's list
    const removeZone = async (zone: any) => {
        const userRef = doc(db, "users", user.userID);
        await updateDoc(userRef, { safetyZones: arrayRemove(zone) });
    };

    return (
        <View style={styles.container}>
        <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
            <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <AntDesign name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Safety Zones</Text>
            <View style={{ width: 40 }} />
            </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.mapContainer}>
            <MapView
                ref={mapRef}
                style={styles.map}
                region={region}
                showsUserLocation={true}
                onRegionChangeComplete={(r) => setRegion(r)}
            >
                <Circle
                center={{ latitude: region.latitude, longitude: region.longitude }}
                radius={1000}
                fillColor="rgba(32, 89, 51, 0.15)"
                strokeColor="#205933"
                strokeWidth={2}
                />
            </MapView>

            <View style={styles.markerFixed} pointerEvents="none">
                <AntDesign name="environment" size={32} color="#205933" />
            </View>

            <View style={styles.floatingControls}>
                <TouchableOpacity 
                style={styles.fab} 
                onPress={async () => {
                    let currentLocation = await Location.getCurrentPositionAsync({});
                    mapRef.current?.animateToRegion({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                    }, 1000);
                }}
                >
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#205933" />
                </TouchableOpacity>
            </View>
            </View>

            <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Create New Zone</Text>
            <View style={styles.tagRow}>
                {QUICK_TAGS.map((tag) => (
                <TouchableOpacity 
                    key={tag.label} 
                    style={[styles.tagItem, label === tag.label && styles.tagSelected]}
                    onPress={() => setLabel(tag.label)}
                >
                    <Text style={[styles.tagText, label === tag.label && styles.tagTextSelected]}>{tag.label}</Text>
                </TouchableOpacity>
                ))}
            </View>

            <TextInput 
                style={styles.input} 
                placeholder="Or type custom name..." 
                value={label}
                onChangeText={setLabel}
                placeholderTextColor="#999"
            />
            
            <TouchableOpacity style={styles.saveButton} onPress={addZone}>
                <Text style={styles.saveButtonText}>Activate Monitor</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
            <Text style={styles.sectionLabel}>ACTIVE SHIELDS</Text>
            {user?.safetyZones?.map((zone: any) => (
                <View key={zone.id} style={styles.zoneCard}>
                <View style={styles.zoneInfo}>
                    <View style={styles.iconCircle}>
                    <AntDesign name="warning" size={20} color="#205933" />
                    </View>
                    <View>
                    <Text style={styles.zoneLabel}>{zone.label}</Text>
                    <Text style={styles.zoneSub}>Radius: 1000m</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => removeZone(zone)} style={styles.deleteBtn}>
                    <AntDesign name="close" size={20} color="#ff4d4d" />
                </TouchableOpacity>
                </View>
            ))}
            </View>
        </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
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

    backButton: { width: 40, justifyContent: 'center' },
    headerTitle: { 
        fontSize: 20, 
        fontWeight: "bold", 
        color: "white",
        flex: 1,
        textAlign: 'center',
    },
    mapContainer: { 
        height: SCREEN_HEIGHT * 0.35, 
        width: '100%', 
        position: 'relative'
    },

    map: { flex: 1 },

    markerFixed: { 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        marginLeft: -16, 
        marginTop: -32,
    },

    floatingControls: { 
        position: 'absolute', 
        bottom: 16, 
        right: 16, 
        zIndex: 5 
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
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },

    formCard: { 
        backgroundColor: 'white',
        margin: 15, 
        padding: 20, 
        borderRadius: 20, 
        elevation: 4, 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 10,
    },

    cardTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginBottom: 15, 
        color: '#333' 
    },

    tagRow: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 8, 
        marginBottom: 15,
    },

    tagItem: { 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 20,
        backgroundColor: '#f0f2f5', 
        borderWidth: 1, 
        borderColor: '#e0e0e0',
    },

    tagSelected: { 
        backgroundColor: '#e8f3ec',
         borderColor: '#205933',
        },

    tagText: { 
        color: '#555', 
        fontSize: 13, 
        fontWeight: '600',
    },

    tagTextSelected: { 
        color: '#205933', 
        fontWeight: 'bold' 
    },

    input: { 
        backgroundColor: '#f9f9f9', 
        padding: 12, 
        borderRadius: 12, 
        fontSize: 15, 
        marginBottom: 15,

    },

    saveButton: { 
        backgroundColor: '#205933', 
        padding: 15, 
        borderRadius: 12, 
        alignItems: 'center' 
    },

    saveButtonText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 16 
    },

    listContainer: { 
        paddingHorizontal: 20 
    },

    sectionLabel: { 
        fontSize: 12, 
        fontWeight: '800', 
        color: '#aaa', 
        letterSpacing: 1.5, 
        marginBottom: 15 
    },

    zoneCard: { 
        backgroundColor: 'white', 
        padding: 15, 
        borderRadius: 16, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 10, 
        borderWidth: 1, 
        borderColor: '#f0f0f0',
    },

    zoneInfo: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12,
    },

    iconCircle: { 
        backgroundColor: '#eef4f0', 
        padding: 8, 
        borderRadius: 10,
    },

    zoneLabel: { 
        fontSize: 15, 
        fontWeight: 'bold' 
    },

    zoneSub: { 
        fontSize: 12, 
        color: '#888' 
    },

    deleteBtn: { 
        padding: 5,
    }

});