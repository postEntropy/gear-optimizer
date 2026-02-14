import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useTheme, alpha, Box, Typography, Paper } from '@mui/material';
import { useHistoryContext } from '../HistoryContext';
import { useHistoryData } from '../hooks/useHistoryData';
import { shorten } from '../../../../util';
import ChartContainer from '../Components/ChartContainer';

const StackedAreaChart = ({ title, icon, color, prefix, names, baseColorHue = 0 }) => {
    const theme = useTheme();
    const [activeSeries, setActiveSeries] = React.useState(null);
    const { timeRange, hiddenSeries, toggleSeries } = useHistoryContext();
    const { filteredData, rawHistory } = useHistoryData(timeRange);

    // Identify which series have data
    const visibleSeries = useMemo(() => {
        if (!rawHistory || rawHistory.length === 0) return [];
        return names.map((name, i) => ({ name, i }))
            .filter(({ i }) => {
                const key = `${prefix}_${i}`;
                // Check if any entry has > 0 for this key
                return rawHistory.some(e => {
                    // Need to check the processed data logic match
                    // For now, let's assume if it exists in filteredData it's valid
                    // Actually, rawHistory doesn't have the flattened keys yet (except in useHistoryData).
                    // Let's use filteredData for checking presence if possible, or just check the raw structure again?
                    // raw structure check is safer:
                    if (prefix.includes('ngu_e')) return e.nguLevels?.[i]?.normal > 0 || e.nguLevels?.[i]?.evil > 0;
                    if (prefix.includes('ngu_m')) return e.magicNguLevels?.[i]?.normal > 0;
                    if (prefix.includes('hack')) return (e.hackLevels?.[i] || 0) > 0;
                    return false;
                });
            });
    }, [rawHistory, names, prefix]);

    const getClosestSeries = (e) => {
        if (!e || !e.activePayload || e.activePayload.length === 0) return null;
        // For stacked charts, finding "closest" is tricky because they stack.
        // Usually, just hovering the area is enough, implemented by Recharts by default?
        // Recharts `onMouseMove` gives the active payload (all series at that X).
        // To highlight a specific stack item, we check which one the mouse Y is inside?
        // Actually, let's stick to mouse proximity or just simple legend hovering for specific series.
        // For stacked, usually we want to see the whole stack.
        // Let's return the key that has the largest value at this point? Or just null to not force specific highlight?
        // Improving: Return the series closest to the mouse Y *visually*.
        // Stacked Y coordinates are cumulative. Recharts payload contains `y` (top of rect) usually?
        // Let's try simple proximity to the `y` value provided in payload.

        const mouseY = e.chartY;
        let closest = null;
        let minDiff = Infinity;

        // In stacked area, the 'y' property of payload entry is the rendered Y coordinate of the point?
        // It seems Recharts payload for 'Area' might not have exact Y. 
        // Let's skip complex logic for now and rely on Tooltip to show details.
        return null;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const sorted = [...payload].sort((a, b) => b.value - a.value);
            const useGrid = sorted.length > 8;

            return (
                <Paper
                    elevation={10}
                    sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        width: useGrid ? 350 : 200,
                        maxHeight: 400,
                        overflowY: 'auto'
                    }}
                >
                    <Typography variant="caption" sx={{ mb: 1.5, display: 'block', fontWeight: 800, color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.5 }}>
                        {new Date(label).toLocaleString()}
                    </Typography>
                    <Box sx={{
                        display: useGrid ? 'grid' : 'flex',
                        flexDirection: 'column',
                        gridTemplateColumns: useGrid ? '1fr 1fr' : 'none',
                        gap: useGrid ? 1.5 : 0.5
                    }}>
                        {sorted.map((entry, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                                    <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                                        {entry.name}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace', color: entry.color, fontSize: '0.75rem' }}>
                                    {shorten(entry.value)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    return (
        <ChartContainer title={title} icon={icon} color={color}>
            <Box sx={{ px: 1 }}>
                <ResponsiveContainer width="100%" height={380}>
                    <AreaChart
                        data={filteredData}
                        margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} style={{ pointerEvents: 'none' }} />
                        <XAxis
                            dataKey="timestamp"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(t) => new Date(t).toLocaleDateString()}
                            stroke={theme.palette.text.secondary}
                            fontSize={10}
                        />
                        <YAxis
                            tickFormatter={(v) => shorten(v)}
                            stroke={theme.palette.text.secondary}
                            fontSize={10}
                            width={65}
                            tick={{ dx: -5 }}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {visibleSeries.map(({ name, i }) => {
                            const seriesKey = `${prefix}_${i}`;
                            const isHidden = hiddenSeries.has(seriesKey);
                            if (isHidden) return null;

                            // Use a better distribution of hues for high counts (Hacks have ~15)
                            const hue = (i * (360 / Math.max(visibleSeries.length, 1))) % 360;
                            const fillColor = `hsl(${hue}, 70%, 45%)`;

                            return (
                                <Area
                                    key={seriesKey}
                                    type="monotone"
                                    dataKey={seriesKey}
                                    name={name}
                                    stackId="1"
                                    stroke={fillColor}
                                    fill={fillColor}
                                    fillOpacity={activeSeries ? (activeSeries === seriesKey ? 0.8 : 0.1) : 0.5}
                                    strokeOpacity={activeSeries ? (activeSeries === seriesKey ? 1 : 0.2) : 1}
                                    strokeWidth={activeSeries === seriesKey ? 2 : 1}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                />
                            );
                        })}
                    </AreaChart>
                </ResponsiveContainer>

                {/* Custom Legend - More compact and multi-row */}
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 1.5,
                    mt: 2,
                    pb: 1,
                    px: 2
                }}>
                    {visibleSeries.map(({ name, i }) => {
                        const seriesKey = `${prefix}_${i}`;
                        const isHidden = hiddenSeries.has(seriesKey);
                        const hue = (i * (360 / Math.max(visibleSeries.length, 1))) % 360;
                        const colorCode = `hsl(${hue}, 70%, 45%)`;
                        return (
                            <Box
                                key={name}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.8,
                                    opacity: isHidden ? 0.3 : (activeSeries && activeSeries !== seriesKey ? 0.6 : 1),
                                    transition: 'all 0.15s ease-out',
                                    cursor: 'pointer',
                                    bgcolor: isHidden ? 'transparent' : alpha(colorCode, 0.08),
                                    px: 1.2,
                                    py: 0.5,
                                    borderRadius: 1.5,
                                    border: `1px solid ${isHidden ? alpha(theme.palette.divider, 0.2) : alpha(colorCode, 0.3)}`,
                                    userSelect: 'none',
                                    '&:hover': {
                                        bgcolor: alpha(colorCode, 0.15),
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 2px 4px ${alpha(colorCode, 0.2)}`
                                    },
                                    '&:active': {
                                        transform: 'scale(0.95)'
                                    }
                                }}
                                onClick={() => toggleSeries(seriesKey)}
                                onMouseEnter={() => !isHidden && setActiveSeries(seriesKey)}
                                onMouseLeave={() => setActiveSeries(null)}
                            >
                                <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: isHidden ? theme.palette.action.disabled : colorCode,
                                    boxShadow: isHidden ? 'none' : `0 0 5px ${alpha(colorCode, 0.5)}`,
                                    pointerEvents: 'none'
                                }} />
                                <Typography sx={{
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    color: isHidden ? 'text.disabled' : 'text.primary',
                                    textDecoration: isHidden ? 'line-through' : 'none',
                                    pointerEvents: 'none'
                                }}>
                                    {name}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </ChartContainer>
    );
};

export default StackedAreaChart;
