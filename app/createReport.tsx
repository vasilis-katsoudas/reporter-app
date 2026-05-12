import AntDesign from '@expo/vector-icons/AntDesign';
import * as Location from "expo-location";
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { ReportsContext } from "../context/ReportsContext";

//define the available incident types and icons
const categories = [
  { name: "Crime", icon: "warning" },
  { name: "Accident", icon: "car" },
  { name: "Suspicious Activity", icon: "eye" },
  { name: "Environmental Hazard", icon: "thunderbolt" },
  { name: "Lost Item/Pet", icon: "search" },
];

export default function CreateReport() {
  const { addIncident } = useContext(ReportsContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(true);
  const [areaName, setAreaName] = useState<string>("Detecting area...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  //converts coordinates into a human-readable address
  const getAreaFromCoords = async (lat: number, lng: number) => {
    try {
      const reversed = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (reversed.length > 0) {
        const addr = reversed[0];
        const displayArea = addr.name || addr.district || addr.street || "Unknown Area";
        setAreaName(displayArea);
      }
    } catch (e) { console.log(e); }
  };

  //requests permission and fetches the user's current coordinates
  const fetchCurrentLocation = async () => {
    setLoadingLocation(true);
    setIsUsingCurrentLocation(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permission denied");
      setLoadingLocation(false);
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setLocation(coords);
    await getAreaFromCoords(coords.latitude, coords.longitude);
    setLoadingLocation(false);
  };

  //automatically fetch location when the screen opens
  useEffect(() => { fetchCurrentLocation(); }, []);

  //validates input and pushes the report to the database
  const handlePost = async () => {
    if (!title.trim() || !selectedCategory || !location) {
      return alert("Please fill all required fields");
    }

    if (isSubmitting) return;
    
    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      await addIncident({
        title: title.trim(),
        category: selectedCategory,
        description: description.trim(),
        area: areaName,
        coords: location,
        time: new Date().toISOString(), 
      });
      router.replace("/");
      
    } catch (error) {
      alert("Submission failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backBtn}
            disabled={isSubmitting}
          >
            <AntDesign name="close" size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Report</Text>

          <TouchableOpacity onPress={handlePost} disabled={isSubmitting}>
            <Text style={[styles.headerPostText, isSubmitting && { opacity: 0.5 }]}>
              {isSubmitting ? "..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.card}>
            <Text style={styles.label}>What's happening?</Text>
            <TextInput
              style={styles.singleLineInput}
              placeholder="Title of the incident"
              value={title}
              onChangeText={setTitle}
              editable={!isSubmitting}
            />
            <TextInput
              style={styles.multiLineInput}
              placeholder="Additional details (optional)..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!isSubmitting}
            />
          </View>

          <Text style={styles.sectionTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                disabled={isSubmitting}
                style={[styles.categoryChip, selectedCategory === cat.name && styles.categorySelected]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <AntDesign name={cat.icon as any} size={16} color={selectedCategory === cat.name ? "white" : "#205933"} />
                <Text style={[styles.categoryText, selectedCategory === cat.name && styles.categoryTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.card}>
            <View style={styles.locationInfoRow}>
                <AntDesign name="environment" size={18} color="#205933" />
                <Text style={styles.areaText}>{areaName}</Text>
            </View>
            
            <View style={styles.locationActionRow}>
                <TouchableOpacity 
                    disabled={isSubmitting}
                    style={[styles.locBtn, isUsingCurrentLocation && styles.locBtnActive]} 
                    onPress={fetchCurrentLocation}
                >
                    <Text style={[styles.locBtnText, isUsingCurrentLocation && styles.locBtnTextActive]}>Current</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    disabled={isSubmitting}
                    style={[styles.locBtn, mapVisible && styles.locBtnActive]} 
                    onPress={() => setMapVisible(!mapVisible)}
                >
                    <Text style={[styles.locBtnText, mapVisible && styles.locBtnTextActive]}>Map Pick</Text>
                </TouchableOpacity>
            </View>

            {mapVisible && (
              <View style={styles.mapWrapper}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: location?.latitude || 37.98,
                    longitude: location?.longitude || 23.72,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  onPress={(e) => {
                    if (isSubmitting) return;
                    setLocation(e.nativeEvent.coordinate);
                    setIsUsingCurrentLocation(false);
                    getAreaFromCoords(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
                  }}
                >
                  {location && <Marker coordinate={location} />}
                </MapView>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} 
            onPress={handlePost}
            disabled={isSubmitting}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? "Posting Report..." : "Submit Report"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  headerBackground: {
    backgroundColor: "#205933",
    elevation: 4,
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 5,
  },

  header: { 
    height: 60, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 20,
  },

  headerTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "white",
  },

  headerPostText: { 
    color: "white", 
    fontWeight: "bold", 
    fontSize: 16,
  },

  backBtn: { 
    width: 40,
  },
  
  scrollContent: { 
    padding: 20,
  },

  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#888', 
    textTransform: 'uppercase', 
    marginBottom: 10, 
    letterSpacing: 1, 
    marginLeft: 5,
  },
  
  card: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 20, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8 },
  
  label: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1a1a1a', 
    marginBottom: 12,
  },

  singleLineInput: { 
    fontSize: 16, 
    color: '#333', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
  },

  multiLineInput: { 
    fontSize: 16, 
    color: '#333', 
    height: 100, 
    textAlignVertical: 'top',
    marginTop: 10,
  },

  categoryScroll: { 
    paddingLeft: 5, 
    paddingBottom: 20, 
    gap: 10,
  },

  categoryChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: '#eee',
  },

  categorySelected: { 
    backgroundColor: '#205933', 
    borderColor: '#205933',
  },

  categoryText: { 
    marginLeft: 8, 
    fontWeight: '600', 
    color: '#444',
  },

  categoryTextSelected: { 
    color: 'white',
  },

  locationInfoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f0f4f1', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 15,
  },

  areaText: { 
    marginLeft: 10, 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#205933', 
    flex: 1,
  },

  locationActionRow: { 
    flexDirection: 'row', 
    gap: 10,
  },

  locBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 8, 
    backgroundColor: '#f5f5f5',
  },

  locBtnActive: { 
    backgroundColor: '#205933',
  },

  locBtnText: { 
    fontWeight: '700', 
    color: '#666', 
    fontSize: 13,
  },

  locBtnTextActive: { 
    color: 'white', 
  },

  mapWrapper: { 
    height: 200, 
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },

  map: { 
    flex: 1,
  },

  submitButton: { 
    backgroundColor: "#205933",
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
    shadowColor: '#205933',
    shadowOpacity: 0.3, 
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },

  submitText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 16,
  },

});