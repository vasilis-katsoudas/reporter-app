import AntDesign from '@expo/vector-icons/AntDesign';
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SideMenu from "../../components/sideMenu";
import { getMarkerColor } from "../../constants/categories";
import { AuthContext } from "../../context/AuthContext";
import { ReportsContext } from "../../context/ReportsContext";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import { getDistance } from "../../utils/locationUtils";

type FeedMode = 'nearby' | 'zones' | 'trending';

export default function FeedScreen() {
  const [activeZoneId, setActiveZoneId] = useState<string>('all');
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const { user, users } = useContext(AuthContext);
  const { incidents, updateIncident } = useContext(ReportsContext);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>('nearby');
  const insets = useSafeAreaInsets();
  const { logout } = useContext(AuthContext);

  //handles the refresh action
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  //requests location permissions at start and
  //fetches current coordinates to initialize the map and feed when granted
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        setLoadingLocation(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLoadingLocation(false);
    })();
  }, []);

  //filters both users and incidents based on the current search query and
  //returns a unified array tagged with a 'type' property to handle routing correctly
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    const filteredIncidents = incidents
      .filter(inc => 
        (inc.title?.toLowerCase() || "").includes(query) ||
        (inc.location?.toLowerCase() || "").includes(query) ||
        (inc.category?.toLowerCase() || "").includes(query)
      )
      .map(inc => ({ ...inc, type: 'incident' })); 
  
    const filteredUsers = users
      .filter(u => u.username?.toLowerCase().includes(query))
      .map(u => ({ ...u, type: 'user' }));
  
    return [...filteredUsers, ...filteredIncidents];
  }, [searchQuery, incidents, users]);

  //derives the active list of incidents based on the currently selected feed mode and
  //handles proximity sorting, engagement score calculations and geographical boundary filtering
  const processedIncidents = useMemo(() => {
    let list = [...incidents];
  
    //sort by absolute distance from current user location
    if (feedMode === 'nearby') {
      if (location) {
        list = list
          .filter(inc => {
            if (!inc.coords) return false;
            const dist = getDistance(
              location.latitude, 
              location.longitude, 
              inc.coords.latitude, 
              inc.coords.longitude
            );
            return dist <= 3;
          })
          .sort((a, b) => {
            const distA = a.coords ? getDistance(location.latitude, location.longitude, a.coords.latitude, a.coords.longitude) : Infinity;
            const distB = b.coords ? getDistance(location.latitude, location.longitude, b.coords.latitude, b.coords.longitude) : Infinity;
            return distA - distB;
        });
      }
    } 
    //sort by aggregate engagement score (upvotes+downvotes+comments)
    else if (feedMode === 'trending') {
      list.sort((a, b) => {
        const scoreA = (a.upvotedBy?.length || 0) + (a.downvotedBy?.length || 0) + (a.comments?.length || 0);
        const scoreB = (b.upvotedBy?.length || 0) + (b.downvotedBy?.length || 0) + (b.comments?.length || 0);
        return scoreB - scoreA;
      });
    } 
    //filter out incidents that do not fall within the radiuses of the user's defined safety zones and
    //sort zone results chronologically (newest first)
    else if (feedMode === 'zones') {
      if (user?.safetyZones && user.safetyZones.length > 0) {
        list = list.filter(inc => {
          if (!inc.coords) return false;

          const zonesToFilter = activeZoneId === 'all' 
            ? user.safetyZones 
            : user.safetyZones.filter((z: any) => (z.id || z.label) === activeZoneId);
  
          return zonesToFilter.some((zone: any) => {
            const zLat = zone.coords?.latitude ?? zone.latitude;
            const zLon = zone.coords?.longitude ?? zone.longitude;
            
            if (!zLat || !zLon) return false;
  
            const distKm = getDistance(
              Number(zLat), 
              Number(zLon), 
              Number(inc.coords.latitude), 
              Number(inc.coords.longitude)
            );
  
            const radiusKm = (Number(zone.radius || zone.coords?.radius) || 1000) / 1000; 
            
            return distKm <= radiusKm;
          });
        });
        
        list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      } else {
        list = [];
      }
    }
  
    return list;
  }, [incidents, location, feedMode, user, activeZoneId]);

  //card component for displaying individual incident summaries in the feed
  const IncidentCard = ({ item }: { item: any }) => {
    const displayTime = useRelativeTime(item?.time || "");
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/report",
            params: { incident: JSON.stringify({ id: item.id }) }, 
          })
        }
      >
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.incidentTitle}>{item.title || "Untitled Incident"}</Text>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.meta}>{item.user || "Unknown"} • {displayTime}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              item.status === "Verified" ? styles.verified : item.status === "False" ? styles.false : styles.unverified,
            ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          <Text style={styles.area}>{item.area}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          {!isSearching ? (
              <>
                <TouchableOpacity onPress={() => setMenuVisible(true)}>
                  <AntDesign name="bars" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reporter</Text>
                <View style={styles.rightIconsContainer}>
                  <TouchableOpacity style={styles.iconSpacing} onPress={() => router.push("../createReport")}>
                    <AntDesign name="plus" size={22} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconSpacing} onPress={() => setIsSearching(true)}>
                    <AntDesign name="search" size={22} color="white" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.searchHeaderInner}>
                <TouchableOpacity 
                  style={styles.leftIconButton}
                  onPress={() => { setIsSearching(false); setSearchQuery(""); }}
                >
                  <AntDesign name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.expandedSearchBar}>
                  <TextInput
                    placeholder="Search users or reports..."
                    placeholderTextColor="#ccc"
                    style={styles.headerSearchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                    returnKeyType="search"
                    onSubmitEditing={() => {
                      if (searchQuery.trim()) {
                        router.push({
                          pathname: "../searchResults",
                          params: { q: searchQuery }
                        });
                        setIsSearching(false);
                      }
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <AntDesign name="close" size={16} color="#ccc" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* search results dropdown overlay */}
        {isSearching && (
          <View style={[styles.searchResultsOverlay, { top: insets.top + 60 }]}>
            <FlatList
              data={searchResults}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item, idx) => item.type === 'user' ? `u-${item.userID}` : `i-${item.id}`}
              renderItem={({ item }) => {
                const isUser = item.type === 'user';
                return (
                  <TouchableOpacity 
                    style={styles.searchResultItem}
                    onPress={() => {
                      setIsSearching(false);
                      setSearchQuery("");
                      isUser
                        ? router.push(`../userProfile?id=${item.userID}`)
                        : router.push({ 
                            pathname: "/report", 
                            params: { incident: JSON.stringify(item) }
                          });
                    }}
                  >
                    <AntDesign 
                      name={isUser ? "user" : "alert"} 
                      size={18} 
                      color={isUser ? "#205933" : "#666"} 
                    />
                    <View style={{ marginLeft: 15 }}>
                      <Text style={styles.resultTitle}>{isUser ? item.username : item.title}</Text>
                      <Text style={styles.resultSub}>{isUser ? "User Profile" : item.location}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.noResultText}>
                  {searchQuery ? "No results found" : "Search for users or reports"}
                </Text>
              }
            />
          </View>
        )}

      {/* main feed */}
      <FlatList
        ListHeaderComponent={
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Incidents Near You</Text>
              <TouchableOpacity onPress={() => router.push("/map")}>
                <Text style={styles.sectionLink}>Expand Map</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
              {loadingLocation ? (
                <ActivityIndicator size="large" color="#205933" />
              ) : location ? (
                <MapView
                  style={styles.map}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  showsUserLocation={true}
                  initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                >
                  {incidents
                    .filter((inc) => inc && inc.id && inc.coords?.latitude && inc.coords?.longitude)
                    .map((inc) => (
                      <Marker
                        key={inc.id}
                        coordinate={inc.coords}
                        pinColor={getMarkerColor(inc.status)}
                        title={inc.title}
                        description={`${inc.category} - Tap for details`}
                        onCalloutPress={() => {
                        router.push({ 
                            pathname: "/report", 
                            params: { incident: JSON.stringify(inc) } 
                        });
                        }}
                    >
                        {Platform.OS === 'ios' && (
                        <Callout 
                            onPress={() => {
                            router.push({ 
                                pathname: "/report", 
                                params: { incident: JSON.stringify(inc) } 
                            });
                            }}
                        >
                            <View style={styles.calloutContainer}>
                            <Text style={styles.calloutTitle}>{inc.title}</Text>
                            <Text style={styles.calloutCategory}>{inc.category}</Text>
                            <Text style={styles.calloutLink}>Tap to view details</Text>
                            </View>
                        </Callout>
                        )}
                    </Marker>
                  ))}
                </MapView>
              ) : <Text style={{textAlign: 'center', marginTop: 20}}>Location error</Text>}
              <TouchableOpacity 
                style={styles.mapClickOverlay}
                onPress={() => router.push("/map")}
              >
                  <Text style={styles.mapClickText}>Live View</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 25, marginBottom: 10 }]}>
              <Text style={styles.sectionTitle}>Incidents Feed</Text>
            </View>

            <View style={styles.tabsContainer}>
              {['nearby', 'zones', 'trending'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.tabButton, feedMode === mode && styles.activeTab]}
                  onPress={() => setFeedMode(mode as FeedMode)}
                >
                  <Text style={[styles.tabText, feedMode === mode && styles.activeTabText]}>
                    {mode === 'nearby' ? 'Nearby' : mode === 'zones' ? 'Safety Zones' : 'Trending'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {feedMode === 'zones' && (
              <View style={styles.subTabWrapper}>
                {user?.safetyZones && user.safetyZones.length > 0 ? (
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[{ label: 'All', id: 'all' }, ...user.safetyZones]}
                    keyExtractor={(item, index) => item.id || item.label || index.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.subTabButton,
                          activeZoneId === (item.id || item.label) && styles.activeSubTab
                        ]}
                        onPress={() => setActiveZoneId(item.id || item.label)}
                      >
                        <Text style={[
                          styles.subTabText,
                          activeZoneId === (item.id || item.label) && styles.activeSubTabText
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingVertical: 10 }}
                  />
                ) : (
                  <TouchableOpacity 
                    style={styles.addZonesPrompt}
                    onPress={() => router.push("/safetyZones")}
                  >
                    <Text style={styles.addZonesText}>No zones found. Add Zones</Text>
                    <AntDesign name="plus" size={20} color="#205933" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        }
        data={processedIncidents}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#205933']}
            tintColor={'#205933'}
          />
        }
        renderItem={({ item }) => <IncidentCard item={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 30, color: '#666' }}>
            No incidents found for this filter.
          </Text>
        }
      />

      {/* show navigation menu */}
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
    backgroundColor: "#205933",
    paddingHorizontal: 15,
    paddingVertical: 15,
  },

  leftIconButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  rightIconsContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    width: 100,
    justifyContent: 'flex-end',
  },
  
  iconSpacing: {
    marginRight: 15,
  },
  
  menuIcon: {
    fontSize: 24,
    color: "white",
  },
  
  profileIcon: {
    marginLeft: 10,
  },
  
  mapContainer: {
    height: 200,
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    position: 'relative',
  },

  mapClickOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(32, 89, 51, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  
  mapClickText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  map: {
    flex: 1,
  },
  
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    flexDirection: "row",
  },
  
  menu: {
    width: "70%",
    backgroundColor: "white",
    padding: 20,
  },
  
  menuTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  }, 

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: 'center',
  },
  
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    elevation: 3,
  },
  
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  
  incidentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  
  category: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  
  meta: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  
  description: {
    fontSize: 14,
    color: "#333",
    marginTop: 10,
    lineHeight: 20,
  },
  
  area: {
    fontSize: 14,
    color: "#205933", 
    fontWeight: "600",
    marginTop: 5,
  },

  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  
  verified: {
    backgroundColor: "#4CAF50",
  },
  
  unverified: {
    backgroundColor: "#FF9800",
  },
  
  false: {
    backgroundColor: "#E53935",
  },
  
  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: 'uppercase'
  },

  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
    borderRadius: 20,
    height: 36,
  },

  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },

  resultSub: {
    fontSize: 12,
    color: '#666',
  },

  noResultText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
  },

  searchHeaderInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  expandedSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginLeft: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },

  headerSearchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    height: '100%',
  },

  searchResultsOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },

  searchResultItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },

  drawerDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },

  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#205933',
  },

  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 5,
    backgroundColor: '#e6e6e6',
    borderRadius: 10,
    padding: 4,
  },
  
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777',
  },
  
  activeTabText: {
    color: '#205933',
  },

  subTabWrapper: {
    backgroundColor: '#f4f6f8',
    marginBottom: 5,
  },
  subTabButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeSubTab: {
    backgroundColor: '#205933',
    borderColor: '#205933',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeSubTabText: {
    color: '#fff',
  },
  addZonesPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#e8f0e9',
    marginHorizontal: 15,
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#205933',
  },
  addZonesText: {
    marginLeft: 10,
    color: '#205933',
    fontWeight: '700',
  },
  calloutContainer: { 
    width: 160, 
    padding: 5 
  },

  calloutTitle: { 
    fontWeight: 'bold', 
    fontSize: 14, 
    marginBottom: 2,
  },

  calloutCategory: { 
    fontSize: 12, 
    color: '#666', 
    marginBottom: 4 
  },

  calloutLink: { 
    fontSize: 10, 
    color: '#205933', 
    fontWeight: 'bold',
  },

  androidCallout: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
  },

  calloutContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 4,
  },
  
  calloutArrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: 'white',
    borderWidth: 12,
    alignSelf: 'center',
    marginTop: -1,
  },
  
});