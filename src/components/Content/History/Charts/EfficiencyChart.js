import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useTheme, alpha, Box, Typography, Paper } from '@mui/material';
import { useHistoryContext } from '../HistoryContext';
import { useHistoryData } from '../hooks/useHistoryData';
import { shorten } from '../../../../util';
import ChartContainer from '../Components/ChartContainer';
import { Speed } from '@mui/icons-material';

const CustomTooltip = ({ active, payload, label, theme }) => {
    if (active && payload && payload.length) {
        return (
            <Paper
                elevation={10}
                sx={{
                    p: 1.5,
                    bgcolor: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                }}
            >
                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 800, color: 'text.secondary' }}>
                    {new Date(label).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                    Efficiency: {payload[0].value.toFixed(2)} pts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    (XP Gain / Total Power Ratio)
                </Typography>
            </Paper>
        );
    }
    return null;
};

const EfficiencyChart = () => {
    const theme = useTheme();
    const { timeRange, customRange } = useHistoryContext();
    const { filteredData } = useHistoryData(timeRange, customRange);

    return (
        <ChartContainer
            title="Resource Efficiency Index"
            icon={Speed}
            color="primary"
            subtitle="Calculates how much XP you gain per unit of Power"
        >
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData}>
                        <defs>
                            <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis 
                            dataKey="timestamp" 
                            type="number" 
                            domain={['dataMin', 'dataMax']} 
                            tickFormatter={(t) => new Date(t).toLocaleDateString()}
                            fontSize={10}
                        />
                        <YAxis 
                            fontSize={10}
                            tickFormatter={(v) => v.toFixed(1)}
                        />
                        <Tooltip content={<CustomTooltip theme={theme} />} />
                        <Area 
                            type="monotone" 
                            dataKey="efficiencyXP" 
                            name="Efficiency Index" 
                            stroke={theme.palette.primary.main} 
                            fill="url(#colorEff)" 
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
        </ChartContainer>
    );
};

export default EfficiencyChart;
