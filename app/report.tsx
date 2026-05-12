import AntDesign from '@expo/vector-icons/AntDesign';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMarkerColor } from "../constants/categories";
import { AuthContext } from "../context/AuthContext";
import { ReportsContext } from "../context/ReportsContext";
import { useRelativeTime } from "../hooks/useRelativeTime";

export default function ReportDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ incident?: string }>();
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ index: number; user: string } | null>(null);
  
  const { user } = useContext(AuthContext);
  const { incidents, voteIncident, deleteIncident, updateIncident } = useContext(ReportsContext);

  //parse the incident data passed through navigation parameters
  let incidentId = null;
    try {
      if (params?.incident) {
        const parsed = JSON.parse(params.incident);
        incidentId = parsed?.id;
      }
    } catch (e) {
      console.log("Navigation parse error");
    }

  //reset deleting state if the ID changes
  useEffect(() => {
    setIsDeleting(false);
  }, [incidentId]);

  //find the specific incident from global context
  const incident = incidents.find((i) => i.id === incidentId);
  const displayTime = useRelativeTime(incident?.time || new Date().toISOString());

  //show error state if incident isn't found
  if (isDeleting || !incident) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f4f6f8", justifyContent: 'center', alignItems: 'center' }}>
        {isDeleting ? (
           <ActivityIndicator size="large" color="#205933" />
        ) : (
          <>
            <Text>Incident not found.</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: '#205933', marginTop: 10 }}>Go Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  const currentUsername = user?.username || "guest";
  const comments = incident?.comments ?? [];
  const isAuthor = incident?.user === currentUsername;
  const currentUserId = user?.userID;
  const hasUpvoted = incident.upvotedBy?.includes(currentUserId);
  const hasDownvoted = incident.downvotedBy?.includes(currentUserId);
  const upvotesCount = incident.upvotedBy?.length || 0;
  const downvotesCount = incident.downvotedBy?.length || 0;

  //triggers the weighted voting logic in ReportsContext
  const handleVote = (isUpvote: boolean) => {
    if (!currentUserId) {
      Alert.alert("Login Required", "You must be logged in to vote.");
      return;
    }
    voteIncident(incident.id, currentUserId, incident.userID, isUpvote);
  };
  
  //handles adding a comment or a nested reply
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    let updatedComments = [...(incident.comments ?? [])];
    if (replyingTo) {
      const parentComment = updatedComments[replyingTo.index];
      const newReply = {
        user: user?.username || "Anonymous",
        userID: user?.userID,
        text: newComment,
        time: new Date().toISOString(),
      };
      parentComment.replies = parentComment.replies ? [...parentComment.replies, newReply] : [newReply];
      setReplyingTo(null);
    } else {
      updatedComments.push({
        user: user?.username || "Anonymous",
        userID: user?.userID,
        text: newComment,
        time: new Date().toISOString(),
        replies: []
      });
    }
    updateIncident({ ...incident, comments: updatedComments });
    setNewComment("");
  };

  //helper to trigger the reply mode
  const handleReplyPress = (index: number, user: string) => {
    setReplyingTo({ index, user });
    inputRef.current?.focus();
  };

  //delete reply or comment
  const handleDeleteReply = (commentIndex: number, replyIndex: number) => {
    const updatedComments = [...(incident.comments ?? [])];
    updatedComments[commentIndex].replies?.splice(replyIndex, 1);
    updateIncident({ ...incident, comments: updatedComments });
  };
  const handleDeleteComment = (commentIndex: number) => {
    const updatedComments = [...(incident.comments ?? [])];
    updatedComments.splice(commentIndex, 1);
    updateIncident({ ...incident, comments: updatedComments });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Incident Information</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item, idx) => idx.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Pressable onPress={Keyboard.dismiss} style={{ backgroundColor: "#f4f6f8" }}>
              <View style={styles.incidentHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.incidentTitle}>{incident.title || "Untitled Incident"}</Text>
                  <Text style={styles.incidentCategory}>{incident.category}</Text>
                  <TouchableOpacity onPress={() => router.push(`../userProfile?id=${incident.userID}`)}>
                    <Text style={styles.authorName}>By {incident.user}</Text>
                  </TouchableOpacity>
                </View>

                {isAuthor && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      Alert.alert("Delete Report", "Are you sure?", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => {
                            const idToDelete = incident.id;
                            router.back();
                            setTimeout(() => {
                              deleteIncident(idToDelete);
                            }, 100);
                          }
                        }
                      ]);
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.time}>{displayTime}</Text>

              <View style={styles.mapContainer}>
                {incident.coords && (
                  <>
                    <MapView
                      style={styles.map}
                      scrollEnabled={true}
                      zoomEnabled={true}
                      region={{
                        latitude: incident.coords.latitude,
                        longitude: incident.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01
                      }}
                    >
                      <Marker
                        coordinate={incident.coords}
                        pinColor={getMarkerColor(incident.status)}
                      />
                    </MapView>
                    <TouchableOpacity
                      style={styles.fullMapButton}
                      onPress={() => router.push({
                        pathname: "/map",
                        params: {
                          focusLat: incident.coords.latitude,
                          focusLng: incident.coords.longitude
                        }
                      })}
                    >
                      <AntDesign name="global" size={14} color="white" />
                      <Text style={styles.fullMapText}>Full Map</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.descriptionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Location</Text>
                    <Text style={styles.area}>{incident.area}</Text>
                    <Text style={styles.location}>{incident.location}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    incident.status === "Verified" ? styles.verified : incident.status === "False" ? styles.false : styles.unverified,
                  ]}>
                    <Text style={styles.statusText}>{incident.status}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <Text style={styles.scoreText}>Reliability Score: {incident.score}</Text>
                <Text style={styles.description}>{incident.description || "No description provided."}</Text>
              </View>

              <View style={styles.votesContainer}>
                <TouchableOpacity
                  style={[styles.voteButton, hasUpvoted && { backgroundColor: "#205933" }]}
                  onPress={() => handleVote(true)}
                >
                  <Text style={[styles.voteBtnText, hasUpvoted && { color: "white" }]}>
                    ▲ {upvotesCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voteButton, hasDownvoted && { backgroundColor: "#a32a2a" }]}
                  onPress={() => handleVote(false)}
                >
                  <Text style={[styles.voteBtnText, hasDownvoted && { color: "white" }]}>
                    ▼ {downvotesCount}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.sectionTitle, { marginHorizontal: 15, marginTop: 20 }]}>
                Comments
              </Text>
            </Pressable>
          }
          renderItem={({ item, index }) => (
            <Pressable onPress={Keyboard.dismiss}>
              <View style={[styles.commentCard, { marginHorizontal: 15 }]}>
                <View style={styles.commentHeader}>
                  <TouchableOpacity onPress={() => router.push(`../userProfile?id=${item.userID}`)}>
                    <Text style={styles.commentUser}>{item.user}</Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity onPress={() => handleReplyPress(index, item.user)}>
                      <Text style={styles.replyLink}>Reply</Text>
                    </TouchableOpacity>
                    {item.user === currentUsername && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComment(index)}
                        style={[styles.deleteCommentButton, { marginLeft: 15 }]}
                      >
                        <Text style={{ color: "white", fontWeight: "bold" }}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text>{item.text}</Text>
                {item.replies?.map((reply, rIdx) => (
                  <View key={rIdx} style={styles.replyCard}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>{reply.user}</Text>
                      {reply.user === currentUsername && (
                        <TouchableOpacity
                          onPress={() => handleDeleteReply(index, rIdx)}
                          style={[styles.deleteCommentButton, { marginLeft: 15 }]}
                        >
                          <Text style={{ color: "white", fontWeight: "bold" }}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text>{reply.text}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={{ color: "gray", textAlign: 'center', marginTop: 10 }}>
                No comments yet.
              </Text>
            </Pressable>
          }
        />

        <View style={[styles.inputWrapper, { 
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 15) : 15 
          }
        ]}>
          {replyingTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>
                Replying to <Text style={{ fontWeight: 'bold' }}>{replyingTo.user}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <AntDesign name="close" size={16} color="#e53935" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.addCommentContainer}>
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#999"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled, {marginLeft: 12}]} 
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <AntDesign name="right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f4f6f8" 
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
    paddingVertical: 12,
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

  time: { 
    marginHorizontal: 15, 
    color: "gray", 
    marginBottom: 10 },

  mapContainer: { 
    height: 200, 
    marginHorizontal: 15, 
    borderRadius: 12, 
    overflow: "hidden",
  },

  map: { 
    flex: 1
  },
  descriptionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 12,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  description: { color: "#444" },
  votesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 15,
    marginTop: 12,
  },
  voteButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  commentsContainer: { marginHorizontal: 15, marginTop: 12, flex: 1 },
  commentCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    elevation: 1,
    marginTop: 5,
  },

  addButton: {
    marginLeft: 8,
    backgroundColor: "#205933",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  deleteCommentButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "red",
  },

  incidentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 15,
  },
  
  incidentTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
  },
  
  incidentCategory: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  
  deleteButton: {
    backgroundColor: "red",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  authorName: {
    fontSize: 14,
    color: "#205933", 
    marginTop: 4,
    fontWeight: "500",
    textDecorationLine: "underline",
  },

  replyLink: {
    color: "#205933",
    fontSize: 12,
    fontWeight: "bold",
  },

  replyCard: {
    marginLeft: 20,
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#205933",
    backgroundColor: "#f9f9f9",
    paddingVertical: 5,
  },

  commentUser: {
    fontWeight: "bold",
    color: "#205933",
  },
  
  commentHeader: {
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 4 
  },

  area: {
    fontSize: 14,
    color: "#205933", 
    fontWeight: "600",
    marginTop: 5,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  
  voteBtnText: {
      fontWeight: 'bold',
      fontSize: 16
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

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },

  scoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444",
    marginBottom: 5,
  },

  location: {
    fontSize: 12,
    color: "#777",
  },

  inputWrapper: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ececec",
    paddingHorizontal: 12,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },

  replyIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f7f2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#205933",
  },

  replyIndicatorText: {
    fontSize: 12,
    color: "#205933",
  },

  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  commentInput: {
    flex: 1,
    backgroundColor: "#f0f2f5", 
    color: "#111",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 22,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  sendButton: {
    backgroundColor: "#205933",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  sendButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },

  fullMapButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(32, 89, 51, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  
  fullMapText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
});



