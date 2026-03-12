import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts';
import { useTheme, alpha, Box, Typography, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useHistoryContext } from '../HistoryContext';
import { useHistoryData } from '../hooks/useHistoryData';
import { shorten } from '../../../../util';
import ChartContainer from '../Components/ChartContainer';

const DeltaBarChart = ({ title, icon, color, prefix, names }) => {
    const theme = useTheme();
    const [activeSeries, setActiveSeries] = useState(null);
    const { timeRange, customRange, hiddenSeries } = useHistoryContext();
    const { filteredData, sortedHistory } = useHistoryData(timeRange, customRange);

    const visibleSeries = useMemo(() => {
        return names.map((name, i) => ({ name, i }));
    }, [names]);

    const chartData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        
        // Find the index of the first filtered item in the main sortedHistory 
        // to properly calculate the delta of the first visible bar
        return filteredData.map((d, index) => {
            const currentRecord = d;
            
            // To get delta, we need the previous record.
            // If it's the very first in filteredData, we try to find its predecessor in sortedHistory
            let prevRecord = null;
            if (index > 0) {
                prevRecord = filteredData[index - 1];
            } else {
                const globalIndex = sortedHistory.findIndex(sh => sh.timestamp === d.timestamp);
                if (globalIndex > 0) {
                    prevRecord = sortedHistory[globalIndex - 1];
                }
            }

            const safeData = {
                timestamp: d.timestamp,
                date: d.date,
                dateTime: d.dateTime,
                rebirths: d.rebirths
            };

            visibleSeries.forEach(({ i }) => {
                const key = `${prefix}_${i}`;
                if (hiddenSeries.has(key)) return;

                const currVal = Number(currentRecord[key]) || 0;
                const prevVal = prevRecord ? (Number(prevRecord[key]) || 0) : currVal;
                
                // Only consider positive growth as a bar segment
                const delta = Math.max(0, currVal - prevVal);
                safeData[key] = delta;
                
                // Store actual level for tooltip
                safeData[`${key}_actual`] = currVal;
            });

            return safeData;
        });
    }, [filteredData, sortedHistory, visibleSeries, hiddenSeries, prefix]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Sort to show highest gains first
            const sorted = [...payload]
                .filter(p => p.value > 0) // Only show the ones that actually gained levels in this rebirth
                .sort((a, b) => b.value - a.value);
            
            const useGrid = sorted.length > 8;

            return (
                <Paper
                    elevation={10}
                    sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.95),
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        width: useGrid ? 350 : 220,
                        maxHeight: 400,
                        overflowY: 'auto'
                    }}
                >
                    <Box sx={{ mb: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.5 }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary' }}>
                            {new Date(label).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'primary.main' }}>
                            Snapshot at Rebirth #{payload[0]?.payload?.rebirths || '?'}
                        </Typography>
                    </Box>

                    {sorted.length === 0 ? (
                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                            No level gains recorded in this interval.
                        </Typography>
                    ) : (
                        <Box sx={{
                            display: useGrid ? 'grid' : 'flex',
                            flexDirection: 'column',
                            gridTemplateColumns: useGrid ? '1fr 1fr' : 'none',
                            gap: useGrid ? 1.5 : 0.5
                        }}>
                            {sorted.map((entry, index) => {
                                const actualLevel = entry.payload[`${entry.dataKey}_actual`];
                                return (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                                            <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                                                {entry.name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.65rem' }}>
                                                Lvl {shorten(actualLevel)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'monospace', color: 'success.main', fontSize: '0.8rem', minWidth: 35, textAlign: 'right' }}>
                                                +{shorten(entry.value)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Paper>
            );
        }
        return null;
    };

    return (
        <ChartContainer title={title} icon={icon} color={color} subtitle="Levels gained per Rebirth snapshot">
            <Box sx={{ px: 1 }}>
                <ResponsiveContainer width="100%" height={380}>
                    <BarChart
                        data={chartData}
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
                            tickFormatter={(v) => `+${shorten(v)}`}
                            stroke={theme.palette.text.secondary}
                            fontSize={10}
                            width={55}
                            tick={{ dx: -5 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: alpha(theme.palette.divider, 0.1) }} />

                        {visibleSeries.map(({ name, i }) => {
                            const seriesKey = `${prefix}_${i}`;
                            if (hiddenSeries.has(seriesKey)) return null;

                            const hue = (i * (360 / Math.max(visibleSeries.length, 1))) % 360;
                            const fillColor = `hsl(${hue}, 70%, 50%)`;

                            return (
                                <Bar
                                    key={seriesKey}
                                    dataKey={seriesKey}
                                    name={name}
                                    stackId="1"
                                    fill={fillColor}
                                    onMouseEnter={() => setActiveSeries(seriesKey)}
                                    onMouseLeave={() => setActiveSeries(null)}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={fillColor} 
                                            fillOpacity={activeSeries ? (activeSeries === seriesKey ? 1 : 0.2) : 0.9} 
                                        />
                                    ))}
                                </Bar>
                            );
                        })}
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </ChartContainer>
    );
};

export default DeltaBarChart;
