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
        return filteredData.map((d, index) => {
            const currentRecord = d;
            let prevRecord = null;
            if (index > 0) prevRecord = filteredData[index - 1];
            else {
                const globalIndex = sortedHistory.findIndex(sh => sh.timestamp === d.timestamp);
                if (globalIndex > 0) prevRecord = sortedHistory[globalIndex - 1];
            }
            const safeData = { timestamp: d.timestamp, date: d.date, dateTime: d.dateTime, rebirths: d.rebirths };
            visibleSeries.forEach(({ i }) => {
                const key = `${prefix}_${i}`;
                const currVal = Number(currentRecord[key]) || 0;
                const prevVal = prevRecord ? (Number(prevRecord[key]) || 0) : currVal;
                safeData[key] = Math.max(0, currVal - prevVal);
                safeData[`${key}_actual`] = currVal;
                safeData[`${key}_prev`] = prevVal;
            });
            return safeData;
        });
    }, [filteredData, sortedHistory, visibleSeries, prefix]);

    const getBonusValue = (prefix, i, level) => {
        if (prefix === 'ngu_e') {
            const ngu = NGUs.energy[i];
            return 1 + level * ngu.normal.bonus;
        }
        if (prefix === 'ngu_m') {
            const ngu = NGUs.magic[i];
            return 1 + level * ngu.normal.bonus;
        }
        if (prefix === 'hack') {
            const hack = Hacks[i];
            const milestones = Math.floor(level / hack[4]);
            return (level * hack[2] + 100) * (hack[3] ** milestones);
        }
        return 0;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const sorted = [...payload].filter(p => p.value > 0).sort((a, b) => b.value - a.value);
            const useGrid = sorted.length > 8;
            return (
                <Paper elevation={10} sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(8px)', border: `1px solid ${theme.palette.divider}`, borderRadius: 2, width: useGrid ? 450 : 320, maxHeight: 400, overflowY: 'auto' }}>
                    <Box sx={{ mb: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.5 }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.secondary' }}>{new Date(label).toLocaleString('pt-BR')}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'primary.main' }}>Snapshot at Rebirth #{payload[0]?.payload?.rebirths || '?'}</Typography>
                    </Box>
                    <Box sx={{ display: useGrid ? 'grid' : 'flex', flexDirection: 'column', gridTemplateColumns: useGrid ? '1fr 1fr' : 'none', gap: useGrid ? 1.5 : 0.5 }}>
                        {sorted.map((entry, index) => {
                            const i = parseInt(entry.dataKey.split('_').pop());
                            const actualLevel = entry.payload[`${entry.dataKey}_actual`];
                            const prevLevel = entry.payload[`${entry.dataKey}_prev`];
                            
                            const suffix = (prefix === 'ngu_e' || prefix === 'ngu_m') ? 'x' : '%';
                            const currentBonus = getBonusValue(prefix, i, actualLevel);
                            const prevBonus = getBonusValue(prefix, i, prevLevel !== undefined ? prevLevel : actualLevel);
                            const bonusDelta = Math.max(0, currentBonus - prevBonus);
                            
                            const bonusStr = `${shorten(currentBonus, 2)}${suffix}`;
                            const bonusDeltaStr = bonusDelta > 0 ? `(+${shorten(bonusDelta, 2)}${suffix})` : '';

                            return (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
                                        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{entry.name}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.65rem' }}>
                                            Lvl {shorten(actualLevel)} ({bonusStr})
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, minWidth: 70, justifyContent: 'flex-end' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: 'monospace', color: 'success.main', fontSize: '0.8rem' }}>
                                                +{shorten(entry.value)}
                                            </Typography>
                                            {bonusDelta > 0 && (
                                                <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace', color: alpha(theme.palette.success.main, 0.8), fontSize: '0.65rem' }}>
                                                    {bonusDeltaStr}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    const legend = (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
            {visibleSeries.map(({ name, i }) => {
                const seriesKey = `${prefix}_${i}`;
                const isHidden = hiddenSeries.has(seriesKey);
                const hue = (i * (360 / Math.max(visibleSeries.length, 1))) % 360;
                const colorCode = `hsl(${hue}, 70%, 50%)`;
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
        <ChartContainer title={title} icon={icon} color={color} subtitle="Levels gained per Rebirth snapshot" footer={legend}>
            <Box sx={{ px: 1 }}>
                <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} style={{ pointerEvents: 'none' }} />
                        <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleDateString('pt-BR')} stroke={theme.palette.text.secondary} fontSize={10} />
                        <YAxis tickFormatter={(v) => `+${shorten(v)}`} stroke={theme.palette.text.secondary} fontSize={10} width={55} tick={{ dx: -5 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: alpha(theme.palette.divider, 0.1) }} />
                        {visibleSeries.map(({ name, i }) => {
                            const seriesKey = `${prefix}_${i}`;
                            const isHidden = hiddenSeries.has(seriesKey);
                            if (isHidden) return null;
                            const hue = (i * (360 / Math.max(visibleSeries.length, 1))) % 360;
                            const fillColor = `hsl(${hue}, 70%, 50%)`;
                            return (
                                <Bar key={seriesKey} dataKey={seriesKey} name={name} stackId="1" fill={fillColor} onMouseEnter={() => setActiveSeries(seriesKey)} onMouseLeave={() => setActiveSeries(null)}>
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={fillColor} fillOpacity={activeSeries ? (activeSeries === seriesKey ? 1 : 0.2) : 0.9} />)}
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
