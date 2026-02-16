import React, { createContext, useContext, useState, useMemo } from 'react';

const HistoryContext = createContext();

export const HistoryProvider = ({ children }) => {
    // Filter State
    const [timeRange, setTimeRange] = useState(30); // Days or 'custom'
    const [customRange, setCustomRange] = useState({ start: null, end: null }); // {start: Date, end: Date}
    const [chartMode, setChartMode] = useState('absolute'); // 'absolute' | 'relative' | 'stacked'
    const [showR3, setShowR3] = useState(false);

    // Interaction State - Global settings only
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
                setSelectedSaves(prev => [prev[1], save]);
            } else {
                setSelectedSaves(prev => [...prev, save]);
            }
        }
    };

    const isolateSeries = (key, allKeys) => {
        setHiddenSeries(prev => {
            const others = allKeys.filter(k => k !== key);
            const allOthersHidden = others.every(k => prev.has(k));
            const isCurrentlyOnlyVisible = !prev.has(key) && allOthersHidden;

            const next = new Set(prev);
            if (isCurrentlyOnlyVisible) {
                // Reset: Show all in this group
                allKeys.forEach(k => next.delete(k));
            } else {
                // Focus: Hide all others, show this one
                others.forEach(k => next.add(k));
                next.delete(key);
            }
            return next;
        });
    };

    const value = {
        timeRange, setTimeRange,
        customRange, setCustomRange,
        chartMode, setChartMode,
        showR3, setShowR3,
        hiddenSeries, toggleSeries, isolateSeries,
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
