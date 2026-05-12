import { addDoc, collection, deleteDoc, doc, getDoc, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Incident } from "../constants/types";
import { db } from "../firebaseConfig";
import { getDistance } from "../utils/locationUtils";
import { AuthContext } from "./AuthContext";

export const ReportsContext = createContext<any>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
    const { user, users } = useContext(AuthContext);
    const [incidents, setIncidents] = useState<Incident[]>([]);
  
    //listen to the reports collection in real-time
    useEffect(() => {
        const q = query(collection(db, "reports"), orderBy("time", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const firebaseData = snapshot.docs
              .map(doc => {
                const data = doc.data();
                if (!data) return null;
                const timestamp = data.time?.toDate 
                    ? data.time.toDate().toISOString() 
                    : new Date().toISOString();

                return {
                  id: doc.id,
                  ...data,
                  time: timestamp,
                };
              })
              .filter((item): item is Incident => item !== null);
          
            setIncidents(firebaseData);
          }, (error) => {
              console.error("Snapshot listener error:", error);
          });
        
        return () => unsubscribe();
      }, []);

    //create a new incident and alert nearby users
    const addIncident = async (incident: Incident) => {
        if (!user || !user.username) {
            alert("You must be logged in to report.");
            return;
        }
    
        try {
            //save the report to Firestore
            const docRef = await addDoc(collection(db, "reports"), {
                ...incident,
                userID: user.userID,
                user: user.username, 
                upvotedBy: [],  
                downvotedBy: [],
                comments: [],
                score: 0,
                status: "Unverified",
                time: serverTimestamp(), 
            });

            //loop through all users to see if this incident is near their Safety Zones
            users.forEach(async (otherUser: any) => {
                if (otherUser.userID === user.userID) return;
            
                if (otherUser.safetyZones && otherUser.safetyZones.length > 0) {
                    const matchingZone = otherUser.safetyZones.find((zone: any) => {
                        const distance = getDistance(
                            incident.coords!.latitude,
                            incident.coords!.longitude,
                            zone.coords.latitude,
                            zone.coords.longitude
                        );
                        return distance <= 1000;
                    });
            
                    if (matchingZone) {
                        try {
                            const notifRef = collection(db, "users", otherUser.userID, "notifications");
                            await addDoc(notifRef, {
                                type: 'safety_alert',
                                message: `Alert near ${matchingZone.label}: ${incident.title}!`,
                                reportID: docRef.id,
                                fromUser: user.username,
                                time: new Date().toISOString(),
                                read: false
                            });
                        } catch (err) {
                            console.error("Failed to send notification to", otherUser.userID, err);
                        }
                    }
                }
            });
        } catch (e) { console.error(e); }
    };

    //update an existing incident's details
    const updateIncident = async (updated: Incident) => {
        try {
            const reportRef = doc(db, "reports", updated.id);
            const { time, id, ...dataToUpdate } = updated;
            await updateDoc(reportRef, dataToUpdate);
            console.log("Incident updated successfully!");
        } catch (e) {
            console.error("Error updating incident:", e);
        }
    };

    //remove an incident from Firestore
    const deleteIncident = async (id: string) => {
        try {
            await deleteDoc(doc(db, "reports", id));
        } catch (e) {
            console.error("Error deleting incident:", e);
        }
    };

    //handle upvoting/downvoting and reputation changes
    const voteIncident = async (incidentId: string, voterId: string, authorId: string, isUpvote: boolean) => {
        const incidentRef = doc(db, "reports", incidentId);
        const authorRef = doc(db, "users", authorId);
        
        const incident = incidents.find(i => i.id === incidentId);
        if (!incident) return;
      
        let { upvotedBy = [], downvotedBy = [], score = 0, status = "Unverified" } = incident;

        //determine gravity: higher reputation users have more weight in their votes
        const voterRef = doc(db, "users", voterId);
        const voterSnap = await getDoc(voterRef);
        const voterData = voterSnap.exists() ? voterSnap.data() : null;
        const voterRep = voterData?.reputation || 1;
        const gravity = Math.max(1, Math.min(5, Math.floor(voterRep / 5) + 1));
      
        let scoreChange = 0;
        const alreadyUpvoted = upvotedBy.includes(voterId);
        const alreadyDownvoted = downvotedBy.includes(voterId);
      
        //handle upvotes and notify user
        if (isUpvote) {
            if (alreadyUpvoted) {
                upvotedBy = upvotedBy.filter(id => id !== voterId);
                scoreChange = -gravity;
            } else {
                if (alreadyDownvoted) {
                downvotedBy = downvotedBy.filter(id => id !== voterId);
                scoreChange += gravity;
                }
                upvotedBy.push(voterId);
                scoreChange += gravity;

                if (voterId !== authorId) {
                const targetNotifRef = collection(db, "users", authorId, "notifications");
                await addDoc(targetNotifRef, {
                    type: 'upvote',
                    recipientID: authorId,
                    reportID: incident.id,
                    message: `Your report "${incident.title}" got ${upvotedBy.length} upvotes!`,
                    time: new Date().toISOString(),
                    read: false
                });
                }
            }
        } else {
            //handle downvotes
            if (alreadyDownvoted) {
                downvotedBy = downvotedBy.filter(id => id !== voterId);
                scoreChange = gravity;
            } else {
                if (alreadyUpvoted) {
                upvotedBy = upvotedBy.filter(id => id !== voterId);
                scoreChange -= gravity;
                }
                downvotedBy.push(voterId);
                scoreChange -= gravity;
            }
        }
      
        //calculate new score and check if it reaches the threshold for verification
        const newScore = score + scoreChange;
        let newStatus = "Unverified";
        
        //parameters
        const verificationThreshold = 15;  
        const minVoters = 5;        
        const consensusRatio = 0.75;       
        const totalVoters = upvotedBy.length + downvotedBy.length;
        const upvoteRatio = totalVoters > 0 ? upvotedBy.length / totalVoters : 0;
        const downvoteRatio = totalVoters > 0 ? downvotedBy.length / totalVoters : 0;

        //check criteria to become verified
        const meetsVerifyScore = newScore >= verificationThreshold;
        const meetsMinUpvoters = upvotedBy.length >= minVoters;
        const meetsPositiveConsensus = upvoteRatio >= consensusRatio;

        //check criteria to be flagged as false
        const meetsFalseScore = newScore <= -10; 
        const meetsMinDownvoters = downvotedBy.length >= minVoters;
        const meetsNegativeConsensus = downvoteRatio >= consensusRatio;

        //apply new status
        if (meetsVerifyScore && meetsMinUpvoters && meetsPositiveConsensus) {
            newStatus = "Verified";
        } else if (meetsFalseScore && meetsMinDownvoters && meetsNegativeConsensus) {
            newStatus = "False";
        }
      
        //author reputation
        if (status === "Unverified" && newStatus === "Verified") {
            await updateDoc(authorRef, { reputation: increment(10) });
        } else if (status === "Verified" && newStatus === "Unverified") {
            await updateDoc(authorRef, { reputation: increment(-10) });
        } else if (status === "Unverified" && newStatus === "False") {
            await updateDoc(authorRef, { reputation: increment(-5) });
        } else if (status === "False" && newStatus === "Unverified") {
            await updateDoc(authorRef, { reputation: increment(5) });
        }

        //early voter reputation
        if (status === "Verified" && newStatus === "Unverified") {
            for (const id of upvotedBy) {
                await updateDoc(doc(db, "users", id), { reputation: increment(-1) });
            }
            if (!isUpvote && alreadyUpvoted) {
                await updateDoc(voterRef, { reputation: increment(-1) });
            }
        } 
        else if (status === "False" && newStatus === "Unverified") {
            for (const id of downvotedBy) {
                await updateDoc(doc(db, "users", id), { reputation: increment(-1) });
            }
            if (isUpvote && alreadyDownvoted) {
                await updateDoc(voterRef, { reputation: increment(-1) });
            }
        }
        else if (status === "Unverified" && newStatus === "Verified") {
            for (const id of upvotedBy) {
                await updateDoc(doc(db, "users", id), { reputation: increment(1) });
            }
        }
        else if (status === "Unverified" && newStatus === "False") {
            for (const id of downvotedBy) {
                await updateDoc(doc(db, "users", id), { reputation: increment(1) });
            }
        }
      
        //update the report document with new vote arrays and score
        await updateDoc(incidentRef, {
            upvotedBy,
            downvotedBy,
            score: newScore,
            status: newStatus
        });
      };
  
    return (
        <ReportsContext.Provider value={{ incidents, addIncident, updateIncident, deleteIncident, voteIncident }}>
            {children}
        </ReportsContext.Provider>
    );
    
}
