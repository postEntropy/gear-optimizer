import React, { useMemo } from 'react';
import { Box, Typography, Tooltip, useTheme, alpha, Paper } from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';
import { shorten } from '../../../../util';

const ProgressionHeatmap = ({ history }) => {
    const theme = useTheme();

    const data = useMemo(() => {
        const days = {};
        const now = new Date();
        // Last 90 days
        for (let i = 89; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            days[d.toDateString()] = { count: 0, gain: 0, date: d };
        }

        history.forEach((entry, idx) => {
            const dateStr = new Date(entry.timestamp).toDateString();
            if (days[dateStr]) {
                days[dateStr].count += 1;
                const prev = history[idx - 1];
                if (prev) {
                    days[dateStr].gain += Math.max(0, entry.exp - prev.exp);
                }
            }
        });

        return Object.values(days);
    }, [history]);

    const maxGain = useMemo(() => Math.max(...data.map(d => d.gain), 1), [data]);

    const getLevel = (gain) => {
        if (gain === 0) return 0;
        const ratio = gain / maxGain;
        if (ratio < 0.25) return 1;
        if (ratio < 0.5) return 2;
        if (ratio < 0.75) return 3;
        return 4;
    };

    const colors = [
        alpha(theme.palette.divider, 0.1),
        alpha(theme.palette.primary.light, 0.3),
        alpha(theme.palette.primary.light, 0.6),
        theme.palette.primary.main,
        theme.palette.primary.dark,
    ];

    return (
        <Paper sx={{ 
            p: 3, 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4, 
            bgcolor: alpha(theme.palette.background.paper, 0.4),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <CalendarMonth color="primary" />
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Progression Heatmap</Typography>
                    <Typography variant="caption" color="text.secondary">Daily XP gains over the last 90 days</Typography>
                </Box>
            </Box>

            <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 0.6,
                justifyContent: 'center',
                flexGrow: 1,
                alignContent: 'center'
            }}>
                {data.map((day, i) => {
                    const level = getLevel(day.gain);
                    return (
                        <Tooltip 
                            key={i} 
                            arrow
                            title={
                                <Box sx={{ p: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                                        {day.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </Typography>
                                    <Typography variant="caption" display="block">Saves: {day.count}</Typography>
                                    <Typography variant="caption" display="block" color="primary.light">Gain: {shorten(day.gain)} XP</Typography>
                                </Box>
                            }
                        >
                            <Box sx={{ 
                                width: 14, 
                                height: 14, 
                                borderRadius: 0.5, 
                                bgcolor: colors[level],
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.3)',
                                    zIndex: 10,
                                    boxShadow: `0 0 10px ${colors[level]}`
                                }
                            }} />
                        </Tooltip>
                    );
                })}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Less</Typography>
                {colors.map((c, i) => (
                    <Box key={i} sx={{ width: 10, height: 10, borderRadius: 0.25, bgcolor: c }} />
                ))}
                <Typography variant="caption" color="text.secondary">More Gain</Typography>
            </Box>
        </Paper>
    );
};

export default ProgressionHeatmap;
