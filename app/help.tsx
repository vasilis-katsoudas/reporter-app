import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

//static data for the FAQ section
const FAQS = [
    {
        question: "How do I verify a report?",
        answer: "Reports are verified by the community. Upvoting a report increases its score; once it reaches a certain threshold, it becomes 'Verified'."
    },
    {
        question: "What is Reputation?",
        answer: "Reputation is earned when your reports are verified or when you contribute helpful votes. Higher reputation gives your votes more weight."
    },
    {
        question: "Can I report anonymously?",
        answer: "Currently, all reports are linked to your username to maintain accountability and trust within the community."
    }
];

export default function HelpCenter() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
        <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
            <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <AntDesign name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Help Center</Text>
            <View style={{ width: 40 }} />
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
            
            {FAQS.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
                <Text style={styles.question}>{faq.question}</Text>
                <Text style={styles.answer}>{faq.answer}</Text>
            </View>
            ))}

            <Text style={styles.sectionLabel}>STILL NEED HELP?</Text>
            <TouchableOpacity 
            style={styles.contactCard}
            >
            <AntDesign name="mail" size={20} color="#205933" />
            <View style={styles.contactTextContent}>
                <Text style={styles.contactTitle}>Contact Support</Text>
                <Text style={styles.contactSub}>Get in touch with our team</Text>
            </View>
            <AntDesign name="right" size={16} color="#ccc" />
            </TouchableOpacity>
        </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1,
        backgroundColor: '#f4f6f8', 
    },
    headerBackground: { 
        backgroundColor: "#205933", 
        elevation: 6, 
        shadowColor: '#000', 
        shadowOpacity: 0.25, 
        shadowRadius: 4,
    },

    header: { 
        height: 60, 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-between", 
        paddingHorizontal: 15,
    },

    headerTitle: { 
        fontSize: 20, 
        fontWeight: "bold", 
        color: "white",
    },

    backButton: { 
        width: 40,
    },

    content: { 
        padding: 20,
    },

    sectionLabel: { 
        fontSize: 12, 
        fontWeight: '700', 
        color: '#888', 
        marginBottom: 12, 
        letterSpacing: 1,
    },

    faqCard: { 
        backgroundColor: 'white', 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 15, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOpacity: 0.05, 
        shadowRadius: 5,
    },

    question: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#333',
        marginBottom: 8,
    },

    answer: { 
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },

    contactCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        padding: 20, 
        borderRadius: 12, 
        elevation: 2,
    },

    contactTextContent: { 
        flex: 1, 
        marginLeft: 15,
    },

    contactTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#333',
    },

    contactSub: { 
        fontSize: 13, 
        color: '#888',
    },

});