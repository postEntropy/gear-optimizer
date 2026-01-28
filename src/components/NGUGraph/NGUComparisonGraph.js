import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { NGU } from '../../NGU';
import { shorten } from '../../util';

const NGUComparisonGraph = (props) => {
    const { ngustats, ngusData, isMagic, title } = props;
    const quirk = ngustats.quirk;

    const colors = [
        '#ff9800', '#2196f3', '#4caf50', '#f44336', '#9c27b0',
        '#00bcd4', '#ffeb3b', '#795548', '#607d8b', '#e91e63'
    ];

    const chartData = useMemo(() => {
        const nguOptimizer = new NGU(props);
        const steps = 48; // Every 30 minutes for 24 hours
        const result = [];

        // Pre-calculate initial bonuses for all NGUs
        const initialBonuses = ngusData.map(item => {
            const initialReachable = nguOptimizer.reachableBonus(item.ngu.levels || { normal: item.normal, evil: item.evil, sadistic: item.sadistic }, 0, item.pos, isMagic, quirk);
            return initialReachable.bonus.evil;
        });

        for (let i = 0; i <= steps; i++) {
            const hours = i * 0.5;
            const minutes = hours * 60;
            const dataPoint = { hours };

            ngusData.forEach((item, idx) => {
                const reachable = nguOptimizer.reachableBonus(item.ngu.levels || { normal: item.normal, evil: item.evil, sadistic: item.sadistic }, minutes, item.pos, isMagic, quirk);
                dataPoint[item.name] = reachable.bonus.evil / initialBonuses[idx];
            });

            result.push(dataPoint);
        }
        return result;
    }, [props, ngusData, isMagic, quirk]);

    return (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, mt: 2, mb: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {title}
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="hours"
                            label={{ value: 'Hours', position: 'insideBottom', offset: -10 }}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            tickFormatter={(val) => `×${shorten(val, 2)}`}
                            tick={{ fontSize: 12 }}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            formatter={(value, name) => [`×${shorten(value, 4)} (${Math.round((value - 1) * 100)}%)`, name]}
                            labelFormatter={(label) => `${label} hours`}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        {ngusData.map((item, idx) => (
                            <Line
                                key={item.name}
                                type="monotone"
                                dataKey={item.name}
                                stroke={colors[idx % colors.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default NGUComparisonGraph;
