//categories for filtering
export const CATEGORIES = ['All', 'Crime', 'Accident', 'Suspicious Activity', 'Environmental Hazard', 'Lost Item/Pet'];
export const STATUSES = ['All', 'Verified', 'Unverified', 'False'];
export const RECENCIES = ['All Time', 'Last 24h', 'Last 7 Days', 'Last 30 Days'];

export const getMarkerColor = (status: string) => {
    switch (status) {
        case 'Verified': return '#4CAF50';
        case 'False': return '#E53935';
        default: return '#FF9800';
    }
};