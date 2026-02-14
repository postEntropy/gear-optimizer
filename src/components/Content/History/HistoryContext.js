import React, { createContext, useContext, useState, useMemo } from 'react';

const HistoryContext = createContext();

export const HistoryProvider = ({ children }) => {
    // Filter State
    const [timeRange, setTimeRange] = useState(30); // Days
    const [chartMode, setChartMode] = useState('absolute'); // 'absolute' | 'relative' | 'stacked'
    const [showR3, setShowR3] = useState(false);

    // Interaction State
    const [activeSeries, setActiveSeries] = useState(null);
    const [hiddenSeries, setHiddenSeries] = useState(new Set());

    // Compare Mode State
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedSaves, setSelectedSaves] = useState([]); // [save1, save2]

    const toggleSeries = (key) => {
        setHiddenSeries(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleSaveSelection = (save) => {
        if (selectedSaves.find(s => s.timestamp === save.timestamp)) {
            setSelectedSaves(prev => prev.filter(s => s.timestamp !== save.timestamp));
        } else {
            if (selectedSaves.length >= 2) {
                // Replace the oldest selection or just warn? Let's generic approach: remove first, add new
                setSelectedSaves(prev => [prev[1], save]);
            } else {
                setSelectedSaves(prev => [...prev, save]);
            }
        }
    };

    const value = {
        timeRange, setTimeRange,
        chartMode, setChartMode,
        showR3, setShowR3,
        activeSeries, setActiveSeries,
        hiddenSeries, toggleSeries,
        isCompareMode, setIsCompareMode,
        selectedSaves, toggleSaveSelection,
        clearSelection: () => setSelectedSaves([])
    };

    return (
        <HistoryContext.Provider value={value}>
            {children}
        </HistoryContext.Provider>
    );
};

export const useHistoryContext = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistoryContext must be used within a HistoryProvider');
    }
    return context;
};
