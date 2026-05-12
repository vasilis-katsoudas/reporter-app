import { useCallback, useEffect, useState } from "react";

export function useRelativeTime(timestamp: string | null | undefined) {
    //logic to calculate the string difference between now and the timestamp
    const calculate = useCallback(() => {
        if (!timestamp) return "";
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "";

        const diffMs = new Date().getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        //minute difference
        if (diffMins < 1) return "just now";
        if (diffMins === 1) return "1 minute ago";
        if (diffMins < 60) return `${diffMins} minutes ago`;

        //hour difference
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) return "1 hour ago";
        if (diffHours < 24) return `${diffHours} hours ago`;

        //day difference
        const diffDays = Math.floor(diffHours / 24);
        return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    }, [timestamp]);

    const [relativeTime, setRelativeTime] = useState(calculate());

    useEffect(() => {
        //immediate update when timestamp changes
        setRelativeTime(calculate());

        if (!timestamp) return;

        //auto-refresh the string every minute
        const interval = setInterval(() => {
        setRelativeTime(calculate());
        }, 60000); 

        //cleanup interval on unmount to prevent memory leaks
        return () => clearInterval(interval);
    }, [calculate, timestamp]);

    return relativeTime;
    
}