import React, { useMemo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Hack } from '../../Hack';
import { shorten } from '../../util';

const HackGraph = (props) => {
    const { hackstats, hack, isMagic } = props;

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

    const lineColor = useMemo(() => getColor(hack.name), [hack.name]);

    const data = useMemo(() => {
        if (!hackstats || !hack) return { chartData: [], setTimeHours: 0 };
        const hackOptimizer = new Hack(props);
        const chartData = [];
        const setTimeMinutes = hackstats.hacktime || 0;
        const setTimeHours = setTimeMinutes / 60;

        // Ensure we show at least 24 hours or the set time, whichever is greater
        const maxHours = Math.max(24, Math.ceil(setTimeHours));
        const steps = maxHours * 2; // Steps of 30 minutes

        const currentLevel = hack.level;
        const pos = hack.pos;

        const initialBonus = hackOptimizer.bonus(currentLevel, pos);

        for (let i = 0; i <= steps; i++) {
            const hours = i * 0.5;
            const minutes = hours * 60;

            const reachableLevel = hackOptimizer.reachable(currentLevel, minutes, pos);
            const bonusAtLevel = hackOptimizer.bonus(reachableLevel, pos);

            // Calculate multiplier change vs initial
            const bonusChange = bonusAtLevel / initialBonus;

            chartData.push({
                hours: hours,
                bonusChange: bonusChange,
                percentage: Math.round((bonusChange - 1) * 100)
            });
        }

        // Match setTime to the closest data point for the reference line to show up on a category axis
        const roundedSetTime = Math.round(setTimeHours * 2) / 2;

        return { chartData, setTimeHours, roundedSetTime };
    }, [hackstats, hack, props]);

    return (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
                {hack.name} - Bonus Change Projection (24 Hours)
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={1}>
                    <LineChart data={data.chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="hours"
                            label={{ value: 'Hours', position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                            interval={0}
                        />
                        <YAxis
                            tickFormatter={(val) => `×${shorten(val, 2)}`}
                            tick={{ fontSize: 12 }}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            formatter={(value) => [`×${shorten(value, 4)} (${Math.round((value - 1) * 100)}%)`, 'Bonus Change']}
                            labelFormatter={(label) => `${label} hours`}
                        />
                        <ReferenceLine
                            x={data.roundedSetTime}
                            stroke="#ff1744"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            label={{ value: 'Set Time', position: 'top', fill: '#ff1744', fontSize: 12, fontWeight: 'bold' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="bonusChange"
                            stroke={lineColor}
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                            dot={false}
                            name={`${hack.name} Bonus`}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default HackGraph;
