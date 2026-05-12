import AntDesign from '@expo/vector-icons/AntDesign';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapControls from '../../components/map/mapControls';
import MapFilterModal from '../../components/map/mapFilterModal';
import SideMenu from "../../components/sideMenu";
import { getMarkerColor } from '../../constants/categories';
import { Incident } from '../../constants/types';
import { AuthContext } from "../../context/AuthContext";
import { ReportsContext } from '../../context/ReportsContext';
import { useMapFilters } from '../../hooks/useMapFilters';

export default function MapScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { incidents } = useContext(ReportsContext);
    const mapRef = useRef<MapView>(null);
    const params = useLocalSearchParams<{ focusLat?: string, focusLng?: string }>();
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard');
    const [menuVisible, setMenuVisible] = useState(false);
    const { logout } = useContext(AuthContext);

    const [region, setRegion] = useState({
        latitude: 38.0262,
        longitude: 23.8150,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    //computes the list of incidents to display based on selected filters
    const { 
        selectedCategory, setSelectedCategory,
        selectedStatus, setSelectedStatus,
        selectedRecency, setSelectedRecency,
        filteredIncidents,
        activeFilterCount, 
        resetFilters 
    } = useMapFilters(incidents);

    //focus on specific coordinates if passed via navigation params and
    //runs whenever the focus coordinates change
    useEffect(() => {
        if (params.focusLat && params.focusLng && mapRef.current) {
        mapRef.current.animateToRegion({
            latitude: parseFloat(params.focusLat),
            longitude: parseFloat(params.focusLng),
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        }, 1000);
        }
    }, [params.focusLat, params.focusLng]);

    //initial user location request and
    //center map on the user if permission is granted and no specific focus is set
    useEffect(() => {
        (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            let currentLocation = await Location.getCurrentPositionAsync({});
            if (!params.focusLat) {
            setRegion({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            });
            }
        }
        })();
    }, [params.focusLat]);

    const handleCenterUser = async () => {
        let currentLocation = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <View style={styles.topControls}>
                <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.backButton}>
                            <AntDesign name="bars" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Incident Map</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </View>
            
                <View style={styles.filterBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarScroll}>
                        <TouchableOpacity style={styles.mainFilterButton} onPress={() => setIsFilterModalOpen(true)}>
                            <AntDesign name="filter" size={16} color={activeFilterCount > 0 ? "#205933" : "#333"} style={{ marginRight: 8 }} />
                            <Text style={[styles.mainFilterText, activeFilterCount > 0 && { color: "#205933" }]}>Filters</Text>
                            {activeFilterCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{activeFilterCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.verticalDivider} />

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {selectedCategory !== 'All' && (
                                <View style={styles.activeFilterPill}>
                                    <Text style={styles.activeFilterPillText}>{selectedCategory}</Text>
                                </View>
                            )}
                            {selectedStatus !== 'All' && (
                                <View style={styles.activeFilterPill}>
                                    <Text style={styles.activeFilterPillText}>{selectedStatus}</Text>
                                </View>
                            )}
                            {selectedRecency !== 'All Time' && (
                                <View style={styles.activeFilterPill}>
                                    <Text style={styles.activeFilterPillText}>{selectedRecency}</Text>
                                </View>
                            )}
                            {activeFilterCount === 0 && (
                                <Text style={styles.placeholderText}>Showing all incidents nearby</Text>
                            )}
                        </ScrollView>
                    </ScrollView>

                    {activeFilterCount > 0 && (
                        <TouchableOpacity onPress={resetFilters} style={styles.clearButton}>
                            <AntDesign name="close" size={18} color="#e53935" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <SideMenu 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                logout={logout} 
            />

            <MapView
                ref={mapRef}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                region={region}
                mapType={mapType}
                showsUserLocation={true}
                showsMyLocationButton={false}
                mapPadding={{ top: insets.top + 100, bottom: 20, left: 0, right: 0 }} 
            >
                {filteredIncidents.map((incident: Incident) => (
                    <Marker
                        key={incident.id}
                        coordinate={incident.coords}
                        //assigns pin colors based on incident verification status
                        pinColor={getMarkerColor(incident.status || 'Unverified')}
                        title={incident.title}
                        description={`${incident.category} - Tap for details`}
                        onCalloutPress={() => {
                            router.push({ 
                                pathname: "/report", 
                                params: { incident: JSON.stringify(incident) } 
                            });
                        }}
                    >
                        {Platform.OS === 'ios' && (
                            <Callout>
                                <View style={styles.calloutContainer}>
                                    <Text style={styles.calloutTitle}>{incident.title}</Text>
                                    <Text style={styles.calloutCategory}>{incident.category}</Text>
                                    <Text style={styles.calloutLink}>Tap to view details</Text>
                                </View>
                            </Callout>
                        )}
                    </Marker>
                ))}
            </MapView>

            <MapControls 
                mapType={mapType}
                onToggleMapType={() => setMapType(mapType === 'standard' ? 'hybrid' : 'standard')}
                onCenterUser={handleCenterUser}
            />

            <MapFilterModal 
                visible={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onReset={resetFilters}
                resultCount={filteredIncidents.length}
                category={selectedCategory}
                setCategory={setSelectedCategory}
                status={selectedStatus}
                setStatus={setSelectedStatus}
                recency={selectedRecency}
                setRecency={setSelectedRecency}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#f4f6f8"
    },
    map: { ...StyleSheet.absoluteFillObject },
    topControls: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 10 
    },

    headerBackground: {
        backgroundColor: "#205933",
        zIndex: 2,
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

    headerTitle: { 
        fontSize: 20, 
        fontWeight: "bold", 
        color: "white",
        flex: 1,
        textAlign: 'center',
    },

    filterBar: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        zIndex: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    filterBarScroll: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    mainFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 6,
        paddingRight: 4,
    },

    mainFilterText: { 
        fontSize: 14, 
        fontWeight: '700', 
        color: '#333' 
    },

    verticalDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#ddd',
        marginHorizontal: 12,
    },

    placeholderText: {
        fontSize: 13,
        color: '#999',
        fontStyle: 'italic',
    },

    activeFilterPill: {
        backgroundColor: '#f0f7f2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d0e0d5',
    },
    activeFilterPillText: {
        fontSize: 12,
        color: '#205933',
        fontWeight: '600',
    },

    badge: {
        backgroundColor: '#205933',
        borderRadius: 9,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },

    badgeText: { 
        color: 'white', 
        fontSize: 10, 
        fontWeight: 'bold' 
    },

    clearButton: { 
        paddingLeft: 10 
    },


    calloutContainer: { 
        width: 160, 
        padding: 5 
    },

    calloutTitle: { 
        fontWeight: 'bold', 
        fontSize: 14, 
        marginBottom: 2 
    },

    calloutCategory: { 
        fontSize: 12, 
        color: '#666',
        marginBottom: 4, 
    },

    calloutLink: { 
        fontSize: 10, 
        color: '#205933', 
        fontWeight: 'bold'
    },

});