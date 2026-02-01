import React, { useMemo } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Hack } from '../../Hack';
import { shorten } from '../../util';

const HackComparisonGraph = (props) => {
    const { hackstats, hacksData, title } = props;

    const colors = [
        '#ff9800', '#2196f3', '#4caf50', '#f44336', '#9c27b0',
        '#00bcd4', '#ffeb3b', '#795548', '#607d8b', '#e91e63',
        '#1de9b6', '#7c4dff', '#ff5252', '#69f0ae', '#40c4ff'
    ];

    const chartData = useMemo(() => {
        if (!hackstats || !hacksData) return [];
        const hackOptimizer = new Hack(props);
        const setTimeMinutes = hackstats.hacktime || 0;
        const setTimeHours = setTimeMinutes / 60;

        // Ensure we show at least 24 hours or the set time, whichever is greater
        const maxHours = Math.max(24, Math.ceil(setTimeHours));
        const steps = maxHours * 2; // Steps of 30 minutes
        const result = [];

        // Pre-calculate initial bonuses for all hacks
        const initialBonuses = hacksData.map(item => {
            return hackOptimizer.bonus(item.level, item.pos);
        });

        for (let i = 0; i <= steps; i++) {
            const hours = i * 0.5;
            const minutes = hours * 60;
            const dataPoint = { hours };

            hacksData.forEach((item, idx) => {
                const reachable = hackOptimizer.reachable(item.level, minutes, item.pos);
                const bonus = hackOptimizer.bonus(reachable, item.pos);
                dataPoint[item.name] = bonus / initialBonuses[idx];
            });

            result.push(dataPoint);
        }

        // Match setTime to the closest data point for the reference line
        const roundedSetTime = Math.round(setTimeHours * 2) / 2;

        return { chartData: result, roundedSetTime };
    }, [props, hackstats, hacksData]);

    return (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, mt: 2, mb: 4, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {title}
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={1}>
                    <LineChart data={chartData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
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
                        <ReferenceLine
                            x={chartData.roundedSetTime}
                            stroke="#ff1744"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            label={{ value: 'Set Time', position: 'top', fill: '#ff1744', fontSize: 12, fontWeight: 'bold' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        {hacksData.map((item, idx) => (
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

export default HackComparisonGraph;
