import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useTheme, alpha, Box, Typography, Paper, ToggleButton, ToggleButtonGroup, Divider } from '@mui/material';
import { useHistoryContext } from '../HistoryContext';
import { useHistoryData } from '../hooks/useHistoryData';
import { shorten } from '../../../../util';
import ChartContainer from '../Components/ChartContainer';
import { FlashOn, Science, AutoFixHigh } from '@mui/icons-material';

const ResourceChart = ({ type = 'energy' }) => { // type: 'energy' | 'magic' | 'res3'
    const theme = useTheme();
    const [activeSeries, setActiveSeries] = React.useState(null);
    const { timeRange, chartMode, setChartMode, showR3, hiddenSeries, toggleSeries } = useHistoryContext();
    const { filteredData, rawHistory } = useHistoryData(timeRange);

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

    // Configuration based on type
    const config = {
        energy: {
            title: "Energy Metrics",
            icon: FlashOn,
            color: "success",
            keys: ['energyCapVal', 'energyPowerVal', 'energyBarsVal'],
            labels: ['Cap', 'Power', 'Bars'],
            colors: ['#ff9800', '#4caf50', '#2196f3'] // Orange, Green, Blue
        },
        magic: {
            title: "Magic Metrics",
            icon: AutoFixHigh,
            color: "info",
            keys: ['magicCapVal', 'magicPowerVal', 'magicBarsVal'],
            labels: ['Cap', 'Power', 'Bars'],
            colors: ['#009688', '#2196f3', '#9c27b0'] // Teal, Blue, Purple
        },
        res3: {
            title: "Resource 3 Metrics",
            icon: Science,
            color: "secondary",
            keys: ['res3CapVal', 'res3PowerVal', 'res3BarsVal'],
            labels: ['Cap', 'Power', 'Bars'],
            colors: ['#ff9800', '#f44336', '#e91e63'] // Orange, Red, Pink
        }
    }[type];

    if (!config) return null;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Paper
                    elevation={10}
                    sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2
                    }}
                >
                    <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 700, color: 'text.secondary' }}>
                        {new Date(label).toLocaleString()}
                    </Typography>
                    {/* Sort payload by value descending so the highest line is always at the top of the tooltip */}
                    {[...payload].sort((a, b) => b.value - a.value).map((entry, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                                <Typography variant="body2" sx={{ color: entry.color, fontWeight: 600 }}>{entry.name}</Typography>
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

    // Y-Axis formatting
    const formatYAxis = (val) => shorten(val);
    const [scaleType, setScaleType] = React.useState('log');

    const detailsContent = (
        <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, color: `${config.color}.main` }}>
                {config.title} Breakdown
            </Typography>
            <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>
                <strong>Split View:</strong> Due to the massive difference between millions and billions, we've split the chart.
                The <strong>top section</strong> shows Power and Bars, while the <strong>bottom section</strong> shows Capacity. Both stay synced!
            </Typography>
            <Divider sx={{ my: 1.5, opacity: 0.1 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.5 }}>Date</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.5, textAlign: 'right' }}>Power</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.5, textAlign: 'right' }}>Cap</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.5, textAlign: 'right' }}>Bars</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredData.slice(-5).reverse().map((d, i) => (
                    <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {new Date(d.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                        </Typography>
                        <Typography variant="caption" sx={{ textAlign: 'right', fontWeight: 700, color: 'text.secondary' }}>{shorten(d[config.keys[0]])}</Typography>
                        <Typography variant="caption" sx={{ textAlign: 'right', fontWeight: 700 }}>{shorten(d[config.keys[1]])}</Typography>
                        <Typography variant="caption" sx={{ textAlign: 'right', fontWeight: 700, color: `${config.color}.main` }}>{shorten(d[config.keys[2]])}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );

    return (
        <ChartContainer
            title={config.title}
            icon={config.icon}
            color={config.color}
            subtitle="Power, Cap, and Bars progression"
            detailsContent={detailsContent}
        >
            <Box sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
                {/* TOP CHART: Power & Bars */}
                <ResponsiveContainer width="100%" height="65%">
                    <LineChart
                        data={filteredData}
                        syncId={type}
                        onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                        onMouseLeave={() => setActiveSeries(null)}
                        margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            hide
                            domain={['dataMin', 'dataMax']}
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            domain={['auto', 'auto']}
                            stroke={theme.palette.text.secondary}
                            fontSize={10}
                            width={75}
                            tick={{ dx: -5 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {!hiddenSeries.has(config.keys[1]) && (
                            <Line
                                type="monotone"
                                dataKey={config.keys[1]}
                                name={config.labels[1]}
                                stroke={config.colors[1]}
                                strokeWidth={activeSeries === config.keys[1] ? 4 : 2}
                                strokeOpacity={activeSeries && activeSeries !== config.keys[1] ? 0.2 : 1}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                style={{ transition: 'all 0.2s' }}
                            />
                        )}
                        {!hiddenSeries.has(config.keys[2]) && (
                            <Line
                                type="monotone"
                                dataKey={config.keys[2]}
                                name={config.labels[2]}
                                stroke={config.colors[2]}
                                strokeWidth={activeSeries === config.keys[2] ? 4 : 2}
                                strokeOpacity={activeSeries && activeSeries !== config.keys[2] ? 0.2 : 1}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                style={{ transition: 'all 0.2s' }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>

                <Divider sx={{ my: 1, opacity: 0.1 }} />

                {/* BOTTOM CHART: Capacity */}
                <ResponsiveContainer width="100%" height="35%">
                    <LineChart
                        data={filteredData}
                        syncId={type}
                        onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                        onMouseLeave={() => setActiveSeries(null)}
                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(t) => new Date(t).toLocaleDateString()}
                            stroke={theme.palette.text.secondary}
                            fontSize={9}
                            offset={0}
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            domain={['auto', 'auto']}
                            stroke={config.colors[1]}
                            fontSize={10}
                            width={75}
                            tick={{ dx: -5 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {!hiddenSeries.has(config.keys[0]) && (
                            <Line
                                type="monotone"
                                dataKey={config.keys[0]}
                                name={config.labels[0]}
                                stroke={config.colors[0]}
                                strokeWidth={activeSeries === config.keys[0] ? 4 : 2}
                                strokeOpacity={activeSeries && activeSeries !== config.keys[0] ? 0.2 : 1}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                style={{ transition: 'all 0.2s' }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>

                {/* Interactive Legend */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, mb: 1, flexWrap: 'wrap' }}>
                    {config.labels.map((label, idx) => {
                        const seriesKey = config.keys[idx];
                        const isHidden = hiddenSeries.has(seriesKey);
                        const colorCode = config.colors[idx];
                        return (
                            <Box
                                key={label}
                                onClick={() => toggleSeries(seriesKey)}
                                onMouseEnter={() => !isHidden && setActiveSeries(seriesKey)}
                                onMouseLeave={() => setActiveSeries(null)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    cursor: 'pointer',
                                    px: 1.5,
                                    py: 0.8,
                                    borderRadius: 1.5,
                                    bgcolor: isHidden ? 'transparent' : alpha(colorCode, 0.08),
                                    border: `1px solid ${isHidden ? alpha(theme.palette.divider, 0.2) : alpha(colorCode, 0.3)}`,
                                    opacity: isHidden ? 0.4 : (activeSeries && activeSeries !== seriesKey ? 0.6 : 1),
                                    transition: 'all 0.15s ease-out',
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
                            >
                                <Box sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: isHidden ? theme.palette.action.disabled : colorCode,
                                    boxShadow: isHidden ? 'none' : `0 0 8px ${alpha(colorCode, 0.5)}`,
                                    pointerEvents: 'none'
                                }} />
                                <Typography variant="caption" sx={{
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    color: isHidden ? 'text.disabled' : 'text.primary',
                                    textDecoration: isHidden ? 'line-through' : 'none',
                                    pointerEvents: 'none'
                                }}>
                                    {label}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </ChartContainer>
    );
};

export default ResourceChart;
