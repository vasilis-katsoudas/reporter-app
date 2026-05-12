import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, RECENCIES, STATUSES } from '../../constants/categories';

const FilterSection = ({ title, options, selected, onSelect }: any) => (
    <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>{title}</Text>
        <View style={styles.chipContainer}>
            {options.map((opt: string) => (
                <TouchableOpacity
                    key={opt}
                    style={[styles.filterChip, selected === opt && styles.filterChipActive]}
                    onPress={() => onSelect(opt)}
                >
                    <Text style={[styles.filterChipText, selected === opt && styles.filterChipTextActive]}>
                        {opt}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

export default function MapFilterModal({ 
    visible, onClose, onReset, resultCount,
    category, setCategory, status, setStatus, recency, setRecency 
}: any) {
    const insets = useSafeAreaInsets();

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
                <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onReset}>
                            <Text style={styles.modalResetText}>Reset</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Filters</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.modalDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <FilterSection title="Category" options={CATEGORIES} selected={category} onSelect={setCategory} />
                        <FilterSection title="Status" options={STATUSES} selected={status} onSelect={setStatus} />
                        <FilterSection title="Timeframe" options={RECENCIES} selected={recency} onSelect={setRecency} />
                    </ScrollView>
                    
                    <TouchableOpacity style={styles.applyButton} onPress={onClose}>
                        <Text style={styles.applyButtonText}>Show {resultCount} Results</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },

    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingTop: 15,
        paddingHorizontal: 20,
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 15,
    },

    modalTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#111' 
    },

    modalResetText: { 
        fontSize: 16, 
        color: '#666' 
    },

    modalDoneText: { 
        fontSize: 16, 
        color: '#205933', 
        fontWeight: 'bold',
    },

    filterSection: { 
        marginBottom: 25
     },

    filterSectionTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#333', 
        marginBottom: 12 
    },

    chipContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 10 
    },

    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f0f2f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },

    filterChipActive: { 
        backgroundColor: '#e8f3ec', 
        borderColor: '#205933' 
    },
    
    filterChipText: { 
        fontSize: 14, 
        color: '#555', 
        fontWeight: '500' 
    },

    filterChipTextActive: { 
        color: '#205933', 
        fontWeight: 'bold'
    },

    applyButton: {
        backgroundColor: '#205933',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },

    applyButtonText: { 
        color: 'white', 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
});