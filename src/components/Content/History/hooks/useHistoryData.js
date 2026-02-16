import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { shorten, toTime } from '../../../../util';

export const useHistoryData = (timeRange, customRange) => {
    const history = useSelector(state => state.optimizer.history);

    // 1. Sort History (Oldest First for Charts)
    const sortedHistory = useMemo(() => {
        if (!history) return [];
        return [...history].sort((a, b) => a.timestamp - b.timestamp);
    }, [history]);

    // 2. Process Data for Charts (Flattening objects)
    const chartData = useMemo(() => {
        return sortedHistory.map(entry => {
            const data = {
                ...entry,
                date: new Date(entry.timestamp).toLocaleDateString(),
                dateTime: new Date(entry.timestamp).toLocaleString(),
                expLabel: shorten(entry.exp || 0),

                // Resource Values
                energyPowerVal: entry.energyPower || 0,
                energyCapVal: entry.energyCap || 0,
                energyBarsVal: entry.energyBars || 0,
                magicPowerVal: entry.magicPower || 0,
                magicCapVal: entry.magicCap || 0,
                magicBarsVal: entry.magicBars || 0,
                res3PowerVal: entry.res3Power || 0,
                res3CapVal: entry.res3Cap || 0,
                res3BarsVal: entry.res3Bars || 0,

                playtimeLabel: toTime((entry.playtime || 0) * 50),
                apLabel: shorten(entry.ap || 0),

                // Normalized Boss Score for Charting
                // S > E > N. Scale them to be continuous-ish or just distinct tiers
                // Normalized Boss Score for Charting
                highestBossScore: (entry.highestSadisticBoss > 0 ? (entry.highestSadisticBoss * 1000000) : 0) +
                    (entry.highestHardBoss > 0 ? (entry.highestHardBoss * 1000) : 0) +
                    entry.highestBoss,

                // Correctly identify the highest tier
                highestBossLabel: entry.highestSadisticBoss > 0
                    ? `Sadistic ${entry.highestSadisticBoss}`
                    : (entry.highestHardBoss > 0
                        ? `Evil ${entry.highestHardBoss}`
                        : `Normal ${entry.highestBoss}`)
            };

            // Helpers for flattening complex nested levels
            const flattenLevels = (levels, prefix, type) => {
                if (!levels) return;
                levels.forEach((level, i) => {
                    // Store highest level achieved
                    const val = level.sadistic > 0 ? level.sadistic : (level.evil > 0 ? level.evil : level.normal);
                    const diff = level.sadistic > 0 ? 'S' : (level.evil > 0 ? 'E' : 'N');
                    data[`${prefix}_${type}_${i}`] = val;
                    data[`${prefix}_${type}_${i}_diff`] = diff;
                });
            };

            flattenLevels(entry.nguLevels, 'ngu', 'e');
            flattenLevels(entry.magicNguLevels, 'ngu', 'm');

            if (entry.hackLevels) {
                entry.hackLevels.forEach((level, i) => {
                    data[`hack_${i}`] = level;
                });
            }
            if (entry.beardLevels) {
                entry.beardLevels.forEach((level, i) => {
                    data[`beard_${i}`] = level;
                });
            }

            return data;
        });
    }, [sortedHistory]);

    // 3. Filter by Time Range
    const filteredData = useMemo(() => {
        if (timeRange === 0) return chartData;

        if (timeRange === 'custom' && customRange) {
            const { start, end } = customRange;
            const endLimit = end ? new Date(end).setHours(23, 59, 59, 999) : null;
            return chartData.filter(d => {
                const ts = d.timestamp;
                if (start && ts < start.getTime()) return false;
                if (endLimit && ts > endLimit) return false;
                return true;
            });
        }

        if (typeof timeRange === 'number' && timeRange > 0) {
            const cutoff = Date.now() - (timeRange * 24 * 60 * 60 * 1000);
            return chartData.filter(d => d.timestamp >= cutoff);
        }

        return chartData;
    }, [chartData, timeRange, customRange]);

    // 4. Calculate Statistics (Best runs, averages)
    const stats = useMemo(() => {
        if (sortedHistory.length < 2) return null;

        // Example: Best Rebirth (Raw XP Gain)
        let maxExpGain = 0;
        let bestRun = null;

        for (let i = 1; i < sortedHistory.length; i++) {
            const current = sortedHistory[i];
            const prev = sortedHistory[i - 1];
            const gain = (current.exp || 0) - (prev.exp || 0);

            if (gain > maxExpGain) {
                maxExpGain = gain;
                bestRun = current;
            }
        }

        return {
            totalRebirths: sortedHistory.length,
            lastExp: sortedHistory[sortedHistory.length - 1]?.exp || 0,
            bestRun,
            maxExpGain
        };

    }, [sortedHistory]);

    return {
        rawHistory: history,
        sortedHistory, // Oldest -> Newest
        chartData,     // Processed for Recharts
        filteredData,  // Time-filtered
        stats          // Aggregated metrics
    };
};
