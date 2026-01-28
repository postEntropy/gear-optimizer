import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { NGU } from '../../NGU';
import { shorten } from '../../util';

const NGUGraph = (props) => {
    const { ngustats, ngu, isMagic } = props;
    const quirk = ngustats.quirk;

    const getColor = (name) => {
        const colors = [
            '#ff9800', '#2196f3', '#4caf50', '#f44336', '#9c27b0',
            '#00bcd4', '#ffeb3b', '#795548', '#607d8b', '#e91e63'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const lineColor = useMemo(() => getColor(ngu.name), [ngu.name]);

    const data = useMemo(() => {
        const nguOptimizer = new NGU(props);
        const chartData = [];
        const steps = 48; // Every 30 minutes for 24 hours

        const currentLevels = ngu.levels;
        const pos = ngu.pos;

        // Get initial bonus to calculate change
        const initialReachable = nguOptimizer.reachableBonus(currentLevels, 0, pos, isMagic, quirk);
        const initialEvilBonus = initialReachable.bonus.evil;

        for (let i = 0; i <= steps; i++) {
            const hours = i * 0.5;
            const minutes = hours * 60;

            const reachable = nguOptimizer.reachableBonus(currentLevels, minutes, pos, isMagic, quirk);

            // Calculate multiplier change vs initial for Evil only
            const bonusChange = reachable.bonus.evil / initialEvilBonus;

            chartData.push({
                hours: hours,
                bonusChange: bonusChange,
            });
        }
        return chartData;
    }, [ngustats, ngu, isMagic, quirk]);

    return (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
                {ngu.name} - Evil Bonus Change Projection (24 Hours)
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 15 }}>
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
                            formatter={(value) => [`×${shorten(value, 4)} (${Math.round((value - 1) * 100)}%)`, 'Evil Bonus Change']}
                            labelFormatter={(label) => `${label} hours`}
                        />
                        <Line
                            type="monotone"
                            dataKey="bonusChange"
                            stroke={lineColor}
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                            dot={false}
                            name={`${ngu.name} (Evil)`}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default NGUGraph;
