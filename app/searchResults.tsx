import AntDesign from '@expo/vector-icons/AntDesign';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Incident, SearchResult, User } from "../constants/types";
import { AuthContext } from "../context/AuthContext";
import { ReportsContext } from "../context/ReportsContext";

export default function SearchResultsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { q } = useLocalSearchParams<{ q: string }>();
    const { users } = useContext(AuthContext);
    const { incidents } = useContext(ReportsContext);

    //useMemo ensures search results are re-calculated when 
    //the query or the data actually changes
    const filteredResults = useMemo(() => {
        if (!q) return [];
        const query = q.toLowerCase();

        //filter incidents by title, category or area
        const incidentResults = (incidents as Incident[])
        .filter(inc => 
            inc.title?.toLowerCase().includes(query) || 
            inc.category?.toLowerCase().includes(query) ||
            inc.area?.toLowerCase().includes(query)
        )
        .map(inc => ({ ...inc, type: 'incident' as const }));

        //filter users by username
        const userResults = (users as User[])
        .filter(u => u.username?.toLowerCase().includes(query))
        .map(u => ({ ...u, type: 'user' as const }));

        //combine both into a single list
        return [...userResults, ...incidentResults] as SearchResult[];
    }, [q, incidents, users]);

    return (
        <View style={styles.container}>
        <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
            <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
                <AntDesign name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Results for "{q}"</Text>
            <View style={{ width: 24 }} /> 
            </View>
        </View>

        <FlatList
            data={filteredResults}
            keyExtractor={(item) => (item.type === 'user' ? item.userID : item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }: { item: SearchResult }) => {
            const isUser = item.type === 'user';
            const mainTitle = item.type === 'user' ? item.username : item.title;
            const categoryText = item.type === 'user' ? "User Profile" : item.category;

            return (
                <TouchableOpacity 
                style={styles.resultCard}
                onPress={() => {
                    if (item.type === 'user') {
                    router.push(`../userProfile?id=${item.userID}`);
                    } else {
                    router.push({ 
                        pathname: "/report", 
                        params: { incident: JSON.stringify(item) }
                    });
                    }
                }}
                >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: isUser ? '#e8f5e9' : '#fff3e0' }]}>
                    <AntDesign 
                        name={isUser ? "user" : "warning"} 
                        size={20} 
                        color={isUser ? "#205933" : "#FF9800"} 
                    />
                    </View>
                    <View style={styles.textContainer}>
                    <Text style={styles.mainText}>{mainTitle}</Text>
                    <Text style={styles.subText}>{categoryText}</Text>
                    
                    {item.type === 'incident' && item.area && (
                        <Text style={styles.areaText}>{item.area}</Text>
                    )}
                    </View>
                    <AntDesign name="right" size={16} color="#ccc" />
                </View>
                </TouchableOpacity>
            );
            }}
            ListEmptyComponent={
            <View style={styles.emptyState}>
                <AntDesign name="search" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No matches found for your search.</Text>
            </View>
            }
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

    listContent: {
        paddingBottom: 20,
        paddingTop: 10,
    },

    resultCard: {
        backgroundColor: "#fff",
        marginHorizontal: 15,
        marginTop: 10,
        padding: 15,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },

    textContainer: {
        flex: 1,
    },

    mainText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111',
    },

    subText: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },

    areaText: {
        fontSize: 13,
        color: "#205933", 
        fontWeight: "600",
        marginTop: 4,
    },

    emptyState: {
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },

    emptyText: {
        marginTop: 20,
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
    },
    
});