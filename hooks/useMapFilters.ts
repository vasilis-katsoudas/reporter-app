import { useMemo, useState } from 'react';
import { Incident } from '../constants/types';

export function useMapFilters(allIncidents: Incident[]) {
    //manages state for category, status and time filters to keep the map UI organized
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedStatus, setSelectedStatus] = useState<string>('All');
    const [selectedRecency, setSelectedRecency] = useState<string>('All Time');

    //handles the core filtering logic by cross-referencing incidents against user selections 
    //and performing time-based math to determine report recency
    const filteredIncidents = useMemo(() => {
        return allIncidents.filter((inc) => {
            const matchCategory = selectedCategory === 'All' || inc.category.includes(selectedCategory);
            const incStatus = inc.status || 'Unverified';
            const matchStatus = selectedStatus === 'All' || incStatus === selectedStatus;
            
            let matchRecency = true;
            //converts timestamp strings to numbers and calculates the hour difference 
            //to filter reports by 24h, 7-day, or 30-day windows
            if (selectedRecency !== 'All Time' && inc.time) {
                const incTime = new Date(inc.time).getTime();
                const diffHours = (Date.now() - incTime) / (1000 * 60 * 60);
                if (selectedRecency === 'Last 24h') matchRecency = diffHours <= 24;
                else if (selectedRecency === 'Last 7 Days') matchRecency = diffHours <= (24 * 7);
                else if (selectedRecency === 'Last 30 Days') matchRecency = diffHours <= (24 * 30);
            }
            return matchCategory && matchStatus && matchRecency;
        });
    }, [allIncidents, selectedCategory, selectedStatus, selectedRecency]);

    //tracks how many active filters are currently applied to update UI badges or count indicators
    const activeFilterCount = 
        (selectedCategory !== 'All' ? 1 : 0) + 
        (selectedStatus !== 'All' ? 1 : 0) + 
        (selectedRecency !== 'All Time' ? 1 : 0);

    //clear all selections and return the map to its default state        
    const resetFilters = () => {
        setSelectedCategory('All');
        setSelectedStatus('All');
        setSelectedRecency('All Time');
    };

    return { selectedCategory, setSelectedCategory, selectedStatus, setSelectedStatus,
        selectedRecency, setSelectedRecency, filteredIncidents, activeFilterCount, resetFilters
    };
}