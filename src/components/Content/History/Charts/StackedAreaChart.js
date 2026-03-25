import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme, alpha, Box, Typography, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useHistoryContext } from '../HistoryContext';
import { useHistoryData } from '../hooks/useHistoryData';
import { shorten } from '../../../../util';
import ChartContainer from '../Components/ChartContainer';

const StackedAreaChart = ({ title, icon, color, prefix, names, baseColorHue = 0 }) => {
    const theme = useTheme();
    const [activeSeries, setActiveSeries] = useState(null);
    const [viewMode, setViewMode] = useState('volume'); // 'volume', 'lines', 'gains'
    const { timeRange, customRange, hiddenSeries, isolateSeries } = useHistoryContext();
    const { filteredData, rawHistory } = useHistoryData(timeRange, customRange);

    const visibleSeries = useMemo(() => {
        if (!rawHistory || rawHistory.length === 0) return [];
        return names.map((name, i) => ({ name, i }))
            .filter(({ i }) => {
                if (prefix.includes('ngu_e')) return rawHistory.some(e => e.nguLevels?.[i]?.normal > 0 || e.nguLevels?.[i]?.evil > 0);
                if (prefix.includes('ngu_m')) return rawHistory.some(e => e.magicNguLevels?.[i]?.normal > 0);
                if (prefix.includes('hack')) return rawHistory.some(e => (e.hackLevels?.[i] || 0) > 0);
                return false;
            });
    }, [rawHistory, names, prefix]);

    const chartData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        const baseValues = {};
        if (viewMode === 'gains') {
            const firstEntry = filteredData[0];
            visibleSeries.forEach(({ i }) => {
                const key = `${prefix}_${i}`;
                baseValues[key] = Number(firstEntry[key]) || 0;
            });
        }
        return filteredData.map(d => {
            const safeData = { ...d };
            visibleSeries.forEach(({ i }) => {
                const key = `${prefix}_${i}`;
                let val = Number(safeData[key]) || 0;
                if (viewMode === 'gains') safeData[key] = Math.max(0, val - (baseValues[key] || 0));
                else safeData[key] = val;
            });
            return safeData;
        });
    }, [filteredData, viewMode, visibleSeries, prefix]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const sorted = [...payload].sort((a, b) => b.value - a.value);
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
                        width: useGrid ? 500 : 300,
                        maxHeight: 500,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: alpha(theme.palette.text.secondary, 0.2),
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'transparent',
                        }
                    }}
                >
                    <Typography variant="caption" sx={{ mb: 1.5, display: 'block', fontWeight: 800, color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.5 }}>{new Date(label).toLocaleString('pt-BR')}</Typography>
                    <Box sx={{
                        display: useGrid ? 'grid' : 'flex',
                        flexDirection: 'column',
                        gridTemplateColumns: useGrid ? '1fr 1fr' : 'none',
                        gap: useGrid ? 2 : 0.5
                    }}>
                        {sorted.map((entry, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                                    <Typography variant="caption" sx={{
                                        color: 'text.primary',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {entry.name}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'monospace', color: entry.color, fontSize: '0.8rem', flexShrink: 0 }}>
                                    {viewMode === 'gains' && entry.value > 0 ? '+' : ''}{shorten(entry.value)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    const controls = (
        <ToggleButtonGroup value={viewMode} exclusive onChange={(e, val) => val && setViewMode(val)} size="small" sx={{ height: 26, '.MuiToggleButton-root': { py: 0, px: 2, fontSize: '0.7rem', fontWeight: 800 } }}>
            <ToggleButton value="volume">Total</ToggleButton>
            <ToggleButton value="lines">Lines</ToggleButton>
            <ToggleButton value="gains">Gains</ToggleButton>
        </ToggleButtonGroup>
    );

    const legend = (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
            {visibleSeries.map(({ name, i }) => {
                const seriesKey = `${prefix}_${i}`;
                const isHidden = hiddenSeries.has(seriesKey);
                const hue = (i * (360 / Math.max(visibleSeries.length, 1))) % 360;
                const colorCode = `hsl(${hue}, 70%, 45%)`;
                return (
                    <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, opacity: isHidden ? 0.3 : (activeSeries && activeSeries !== seriesKey ? 0.6 : 1), transition: 'all 0.15s ease-out', cursor: 'pointer', bgcolor: isHidden ? 'transparent' : alpha(colorCode, 0.08), px: 1, py: 0.3, borderRadius: 1.5, border: `1px solid ${isHidden ? alpha(theme.palette.divider, 0.2) : alpha(colorCode, 0.3)}`, userSelect: 'none', '&:hover': { bgcolor: alpha(colorCode, 0.15), transform: 'translateY(-1px)' } }} onClick={() => isolateSeries(seriesKey, visibleSeries.map(s => `${prefix}_${s.i}`))} onMouseEnter={() => !isHidden && setActiveSeries(seriesKey)} onMouseLeave={() => setActiveSeries(null)}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: isHidden ? theme.palette.action.disabled : colorCode, pointerEvents: 'none' }} />
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: isHidden ? 'text.disabled' : 'text.primary', pointerEvents: 'none' }}>{name}</Typography>
                    </Box>
                );
            })}
        </Box>
    );

    return (
        <ChartContainer title={title} icon={icon} color={color} controls={controls} footer={legend}>
            <Box sx={{ px: 1 }}>
                <ResponsiveContainer width="100%" height={380}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} style={{ pointerEvents: 'none' }} />
                        <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleDateString('pt-BR')} stroke={theme.palette.text.secondary} fontSize={10} />
                        <YAxis tickFormatter={(v) => (viewMode === 'gains' && v > 0) ? `+${shorten(v)}` : shorten(v)} domain={['auto', 'auto']} stroke={theme.palette.text.secondary} fontSize={10} width={55} tick={{ dx: -5 }} />
                        <Tooltip content={<CustomTooltip />} />
                        {visibleSeries.map(({ name, i }) => {
                            const seriesKey = `${prefix}_${i}`;
                            const isHidden = hiddenSeries.has(seriesKey);
                            if (isHidden) return null;
                            const hue = (i * (360 / Math.max(visibleSeries.length, 1))) % 360;
                            const fillColor = `hsl(${hue}, 70%, 45%)`;
                            return (
                                <Area key={seriesKey} type="monotone" dataKey={seriesKey} name={name} stackId={viewMode === 'volume' ? "1" : undefined} stroke={fillColor} fill={fillColor} fillOpacity={viewMode === 'volume' ? (activeSeries ? (activeSeries === seriesKey ? 0.8 : 0.1) : 0.5) : (activeSeries === seriesKey ? 0.2 : 0)} strokeOpacity={activeSeries ? (activeSeries === seriesKey ? 1 : 0.2) : 1} strokeWidth={viewMode !== 'volume' ? 2 : (activeSeries === seriesKey ? 2 : 1)} activeDot={{ r: 4, strokeWidth: 0 }} />
                            );
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </ChartContainer>
    );
};

export default StackedAreaChart;
