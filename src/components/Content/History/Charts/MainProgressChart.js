import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useTheme, alpha, Box, Typography, Paper, Divider } from '@mui/material';
import { useHistoryContext } from '../HistoryContext';
import { useHistoryData } from '../hooks/useHistoryData';
import { shorten } from '../../../../util';
import ChartContainer from '../Components/ChartContainer';
import { TrendingUp, Timeline, ShowChart } from '@mui/icons-material';

const MainProgressChart = () => {
    const theme = useTheme();
    const [activeSeries, setActiveSeries] = React.useState(null);
    const { timeRange, customRange, setTimeRange } = useHistoryContext();
    const { filteredData } = useHistoryData(timeRange, customRange);

    const getClosestSeries = (e) => {
        if (!e || !e.activePayload || e.activePayload.length === 0) return null;
        if (e.activePayload.length === 1) return e.activePayload[0].dataKey;

        const mouseY = e.chartY;
        let closest = e.activePayload[0];
        let minDiff = Math.abs((e.activePayload[0].cy || 0) - mouseY);

        for (let i = 1; i < e.activePayload.length; i++) {
            const p = e.activePayload[i];
            const diff = Math.abs((p.cy || 0) - mouseY);
            if (diff < minDiff) {
                minDiff = diff;
                closest = p;
            }
        }
        return closest.dataKey;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Paper
                    elevation={10}
                    sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                        minWidth: 200
                    }}
                >
                    <Typography variant="subtitle2" sx={{ mb: 1.5, pb: 1, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 700 }}>
                        {new Date(label).toLocaleString()}
                    </Typography>
                    {payload.map((entry, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                                <Typography variant="caption" sx={{ color: entry.color, fontWeight: 600 }}>{entry.name}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                {shorten(entry.value)}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            );
        }
        return null;
    };

    const detailsContent = (
        <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                XP Calculation Details
            </Typography>
            <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>
                Total Experience includes all XP earned throughout your career, including spent XP.
                The "pulinho" on the chart highlights your gain since the last recorded save.
            </Typography>
            <Divider sx={{ my: 1.5, opacity: 0.1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                Latest Recorded Gains:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredData.slice(-5).reverse().map((d, i, arr) => {
                    const prev = filteredData[filteredData.indexOf(d) - 1];
                    const gain = prev ? d.exp - prev.exp : 0;
                    return (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                    {new Date(d.timestamp).toLocaleDateString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                    {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                    {shorten(d.exp)}
                                </Typography>
                                {gain > 0 && (
                                    <Typography variant="caption" color="success.main" sx={{ fontSize: '0.65rem', fontWeight: 700 }}>
                                        +{shorten(gain)}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );

    return (
        <ChartContainer
            title="XP Progression"
            subtitle="Track your raw Experience gain over time"
            icon={TrendingUp}
            color="primary"
            detailsContent={detailsContent}
        >
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                    data={filteredData}
                    onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                    onMouseLeave={() => setActiveSeries(null)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorBoss" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} style={{ pointerEvents: 'none' }} />
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(t) => new Date(t).toLocaleDateString()}
                        stroke={theme.palette.text.secondary}
                        fontSize={11}
                        style={{ pointerEvents: 'none' }}
                    />
                    <YAxis
                        yAxisId="exp"
                        tickFormatter={(v) => shorten(v)}
                        domain={['auto', 'auto']}
                        stroke={theme.palette.primary.main}
                        fontSize={11}
                        width={40}
                        style={{ pointerEvents: 'none' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />

                    <Area
                        yAxisId="exp"
                        type="monotone"
                        dataKey="exp"
                        name="Total XP"
                        stroke={theme.palette.primary.main}
                        fill="url(#colorExp)"
                        strokeWidth={activeSeries === 'exp' ? 4 : 2}
                        fillOpacity={activeSeries ? (activeSeries === 'exp' ? 1 : 0.1) : 1}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: theme.palette.primary.main }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default MainProgressChart;
