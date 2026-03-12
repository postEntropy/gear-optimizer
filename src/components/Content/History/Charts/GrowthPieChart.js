import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTheme, alpha, Box, Typography, Paper } from '@mui/material';
import { useHistoryContext } from '../HistoryContext';
import { useHistoryData } from '../hooks/useHistoryData';
import { shorten } from '../../../../util';
import ChartContainer from '../Components/ChartContainer';

const GrowthPieChart = ({ title, icon, color, prefix, names }) => {
    const theme = useTheme();
    const { timeRange, customRange } = useHistoryContext();
    const { filteredData } = useHistoryData(timeRange, customRange);

    const pieData = useMemo(() => {
        if (!filteredData || filteredData.length < 2) return [];

        const start = filteredData[0];
        const end = filteredData[filteredData.length - 1];

        const data = names.map((name, i) => {
            const key = `${prefix}_${i}`;
            const valStart = Number(start[key]) || 0;
            const valEnd = Number(end[key]) || 0;
            const growth = Math.max(0, valEnd - valStart);
            
            return {
                name,
                value: growth,
                originalTotal: valEnd,
                index: i
            };
        }).filter(item => item.value > 0);

        return data.sort((a, b) => b.value - a.value);
    }, [filteredData, names, prefix]);

    const totalGrowth = useMemo(() => pieData.reduce((acc, curr) => acc + curr.value, 0), [pieData]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = totalGrowth > 0 ? ((data.value / totalGrowth) * 100).toFixed(1) : 0;
            
            return (
                <Paper
                    elevation={10}
                    sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.95),
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        minWidth: 160
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.5 }}>
                        {data.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">Levels Up:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>+{shorten(data.value)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">Focus %:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{percentage}%</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mt: 0.5, pt: 0.5, borderTop: `1px dashed ${theme.palette.divider}` }}>
                            <Typography variant="caption" color="text.secondary">Current Lvl:</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{shorten(data.originalTotal)}</Typography>
                        </Box>
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    if (pieData.length === 0) {
        return (
            <ChartContainer title={title} icon={icon} color={color}>
                <Box sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant="h6" color="text.disabled" sx={{ fontWeight: 800 }}>+ 0</Typography>
                    <Typography variant="body2" color="text.disabled">No levels gained in this period</Typography>
                </Box>
            </ChartContainer>
        );
    }

    return (
        <ChartContainer title={title} icon={icon} color={color}>
            <Box sx={{ height: 380, position: 'relative' }}>
                {/* Center text showing Total Growth */}
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 0
                }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, mb: -0.5 }}>
                        TOTAL GAIN
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: theme.palette.text.primary }}>
                        +{shorten(totalGrowth)}
                    </Typography>
                </Box>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={90}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                            animationDuration={1000}
                        >
                            {pieData.map((entry, index) => {
                                // Calculate hue based on original index to maintain consistent colors
                                const hue = (entry.index * (360 / Math.max(names.length, 1))) % 360;
                                const fillColor = `hsl(${hue}, 70%, 55%)`;
                                return <Cell key={`cell-${index}`} fill={fillColor} />;
                            })}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            content={(props) => {
                                const { payload } = props;
                                return (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, mt: 2 }}>
                                        {payload.map((entry, index) => (
                                            <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color }} />
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                    {entry.value}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </ChartContainer>
    );
};

export default GrowthPieChart;
