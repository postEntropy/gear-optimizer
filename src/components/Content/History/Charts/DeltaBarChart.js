import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useTheme, alpha, Box, Typography, Paper } from '@mui/material';
import { useHistoryContext } from '../HistoryContext';
import { useHistoryData } from '../hooks/useHistoryData';
import { shorten } from '../../../../util';
import ChartContainer from '../Components/ChartContainer';
import { Hacks, NGUs } from '../../../../assets/ItemAux';

const DeltaBarChart = ({ title, icon, color, prefix, names }) => {
    const theme = useTheme();
    const [activeSeries, setActiveSeries] = useState(null);
    const { timeRange, customRange, hiddenSeries, isolateSeries } = useHistoryContext();
    const { filteredData, sortedHistory } = useHistoryData(timeRange, customRange);

    const visibleSeries = useMemo(() => {
        return names.map((name, i) => ({ name, i }));
    }, [names]);

    const chartData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        const results = filteredData.map((d, index) => {
            const currentRecord = d;
            let prevRecord = null;
            if (index > 0) prevRecord = filteredData[index - 1];
            else {
                const globalIndex = sortedHistory.findIndex(sh => sh.timestamp === d.timestamp);
                if (globalIndex > 0) prevRecord = sortedHistory[globalIndex - 1];
            }
            const safeData = { timestamp: d.timestamp, date: d.date, dateTime: d.dateTime, rebirths: d.rebirths };
            let totalGain = 0;
            visibleSeries.forEach(({ i }) => {
                const key = `${prefix}_${i}`;
                const currVal = Number(currentRecord[key]) || 0;
                const prevVal = prevRecord ? (Number(prevRecord[key]) || 0) : currVal;
                const gain = Math.max(0, currVal - prevVal);
                safeData[key] = gain;
                safeData[`${key}_actual`] = currVal;
                safeData[`${key}_prev`] = prevVal;
                totalGain += gain;
            });
            safeData.totalGain = totalGain;
            return safeData;
        });

        return results.filter(r => r.totalGain > 0);
    }, [filteredData, sortedHistory, visibleSeries, prefix]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const sorted = [...payload].filter(p => p.value > 0).sort((a, b) => b.value - a.value);
            return (
                <Paper
                    elevation={10}
                    sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.98), // Nearly opaque
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${theme.palette.divider}`, // More solid border
                        borderRadius: 2,
                        width: 200,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.5)', // Stronger shadow for separation
                        transform: 'translateY(-70px)', 
                        pointerEvents: 'none',
                        zIndex: 1000
                    }}
                >
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', display: 'block', mb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, pb: 0.5 }}>
                        Rebirth #{payload[0].payload.rebirths}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        {sorted.map((entry, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0, flex: 1 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {entry.name}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'monospace', color: 'success.main', fontSize: '0.8rem', flexShrink: 0 }}>
                                    +{shorten(entry.value)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    const legend = (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.8, p: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
            {visibleSeries.map(({ name, i }) => {
                const seriesKey = `${prefix}_${i}`;
                const isHidden = hiddenSeries.has(seriesKey);
                const hue = (i * (360 / Math.max(visibleSeries.length, 1))) % 360;
                const colorCode = `hsl(${hue}, 70%, 50%)`;
                return (
                    <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 0.7, opacity: isHidden ? 0.3 : (activeSeries && activeSeries !== seriesKey ? 0.6 : 1), transition: 'all 0.15s ease-out', cursor: 'pointer', bgcolor: isHidden ? 'transparent' : alpha(colorCode, 0.08), px: 1, py: 0.4, borderRadius: 1.2, border: `1px solid ${isHidden ? alpha(theme.palette.divider, 0.2) : alpha(colorCode, 0.3)}`, userSelect: 'none', '&:hover': { bgcolor: alpha(colorCode, 0.15), transform: 'translateY(-1px)' } }} onClick={() => isolateSeries(seriesKey, visibleSeries.map(s => `${prefix}_${s.i}`))} onMouseEnter={() => !isHidden && setActiveSeries(seriesKey)} onMouseLeave={() => setActiveSeries(null)}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isHidden ? theme.palette.action.disabled : colorCode, pointerEvents: 'none' }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: isHidden ? 'text.disabled' : 'text.primary', pointerEvents: 'none' }}>{name}</Typography>
                    </Box>
                );
            })}
        </Box>
    );

    return (
        <ChartContainer title={title} icon={icon} color={color} subtitle="Levels gained per Rebirth snapshot" footer={legend}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={chartData} 
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} style={{ pointerEvents: 'none' }} />
                    <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(t) => new Date(t).toLocaleDateString([], { month: 'numeric', day: 'numeric' })} 
                        stroke={theme.palette.text.secondary} 
                        fontSize={10} 
                    />
                    <YAxis tickFormatter={(v) => `+${shorten(v)}`} stroke={theme.palette.text.secondary} fontSize={10} width={50} tick={{ dx: -5 }} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: alpha(theme.palette.divider, 0.05) }} />
                    {visibleSeries.map(({ name, i }) => {
                        const seriesKey = `${prefix}_${i}`;
                        const isHidden = hiddenSeries.has(seriesKey);
                        if (isHidden) return null;
                        const hue = (i * (360 / Math.max(visibleSeries.length, 1))) % 360;
                        const fillColor = `hsl(${hue}, 70%, 50%)`;
                        return (
                            <Bar key={seriesKey} dataKey={seriesKey} name={name} stackId="1" fill={fillColor} onMouseEnter={() => setActiveSeries(seriesKey)} onMouseLeave={() => setActiveSeries(null)} isAnimationActive={false}>
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={fillColor} fillOpacity={activeSeries ? (activeSeries === seriesKey ? 1 : 0.2) : 0.9} />)}
                            </Bar>
                        );
                    })}
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default DeltaBarChart;
