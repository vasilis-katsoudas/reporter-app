import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from "expo-router";
import { useContext, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from "../context/AuthContext";

export default function EditProfileScreen() {
  const { user, updateUser, deleteUser } = useContext(AuthContext);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const insets = useSafeAreaInsets();

  //validates passwords and calls the context update function
  const handleSave = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert("Error", "Username and email cannot be empty.");
      return;
    }
  
    //password security logic
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "New passwords do not match.");
        return;
      }
      if (!currentPassword) {
        Alert.alert("Error", "Current password required to make security changes.");
        return;
      }
    }

    if (isSaving) return;
    setIsSaving(true);
    Keyboard.dismiss();
  
    try {
      const updatedUser = {
        ...user!,
        username: username.trim(),
        email: email.trim(),
      };
  
      //send updates to Firebase
      await updateUser(updatedUser, currentPassword, newPassword || undefined);
      
      Alert.alert("Success", "Profile updated successfully.");
      router.back();
    } catch (error: any) {
      Alert.alert("Update Failed", error.message || "Something went wrong.");
      setIsSaving(false);
    }
  };

  //delete account option
  const handleDeleteAccount = () => {
    if (!user?.userID) return;

    Alert.alert(
      "Delete Account",
      "Are you sure? This will delete your profile data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              router.replace("/loginscreen");
              
              setTimeout(async () => {
                await deleteUser(user.userID);
              }, 200);
            } catch (error) {
              Alert.alert("Error", "Could not delete account.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <AntDesign name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.headerSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          
          <Text style={styles.sectionTitle}>General Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput 
                style={styles.input} 
                value={username} 
                onChangeText={setUsername} 
                placeholder="Choose a username"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={[styles.input, styles.disabledInput]} 
                value={email} 
                editable={false} 
                placeholder="Email address"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput 
                style={styles.input} 
                value={currentPassword} 
                onChangeText={setCurrentPassword} 
                secureTextEntry 
                placeholderTextColor="#999"
                placeholder="Required for any changes"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput 
                style={styles.input} 
                value={newPassword} 
                onChangeText={setNewPassword} 
                secureTextEntry 
                placeholderTextColor="#"
                placeholder="Leave blank to keep current"
              />
            </View>

            <View style={[styles.inputGroup, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput 
                style={styles.input} 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry 
                placeholderTextColor="#999"
                placeholder="Repeat new password"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.mainSaveButton, isSaving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <AntDesign name="delete" size={16} color="#d11a2a" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
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

  headerSaveText: { 
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
    paddingHorizontal: 16, 
    marginBottom: 25, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8,
  },

  inputGroup: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  label: { 
    fontSize: 12, 
    fontWeight: "700", 
    color: "#205933", 
    marginBottom: 4,
  },

  input: { 
    fontSize: 16, 
    color: '#333', 
    paddingVertical: 4,
  },

  disabledInput: {
     color: '#aaa',
    },

  mainSaveButton: {
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

  saveButtonText: { 
    color: "white", 
    fontWeight: "800", 
    fontSize: 16,
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    padding: 10,
  },

  deleteButtonText: { 
    color: "#d11a2a", 
    fontWeight: "700", 
    fontSize: 14,
    marginLeft: 8,
  },
  
});