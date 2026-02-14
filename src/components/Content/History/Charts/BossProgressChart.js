import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme, alpha, Box, Typography, Paper, Divider } from '@mui/material';
import { useHistoryContext } from '../HistoryContext';
import { useHistoryData } from '../hooks/useHistoryData';
import ChartContainer from '../Components/ChartContainer';
import { EmojiEvents } from '@mui/icons-material';

const BossProgressChart = () => {
    const theme = useTheme();
    const [activeSeries, setActiveSeries] = React.useState(null);
    const { timeRange } = useHistoryContext();
    const { filteredData } = useHistoryData(timeRange);

    const getClosestSeries = (e) => {
        if (!e || !e.activePayload || e.activePayload.length === 0) return null;
        return e.activePayload[0].dataKey;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const entry = payload[0];
            const rawValue = entry.value;
            let displayLabel = "";
            if (entry.payload.highestSadisticBoss > 1) displayLabel = `Sadistic ${entry.payload.highestSadisticBoss}`;
            else if (entry.payload.highestHardBoss > 0) displayLabel = `Evil ${entry.payload.highestHardBoss}`;
            else displayLabel = `Normal ${entry.payload.highestBoss}`;

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                            {displayLabel}
                        </Typography>
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    const detailsContent = (
        <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, color: 'secondary.main' }}>
                Boss Scaling Logic
            </Typography>
            <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.secondary', lineHeight: 1.4 }}>
                Boss progress is normalized to show a smooth line:
                <strong> Sadistic</strong> (x1,000,000), <strong>Evil</strong> (x1,000), and <strong>Normal</strong> (x1).
                The chart auto-scales to show even a +1 boss improvement.
            </Typography>
            <Divider sx={{ my: 1.5, opacity: 0.1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                Latest Triumphs:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredData.slice(-5).reverse().map((d, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {new Date(d.timestamp).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, px: 1, py: 0.2, borderRadius: 1, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                            {d.highestBossLabel}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );

    return (
        <ChartContainer
            title="Boss Progression"
            subtitle="Highest boss defeated"
            icon={EmojiEvents}
            color="secondary"
            detailsContent={detailsContent}
        >
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                    data={filteredData}
                    onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                    onMouseLeave={() => setActiveSeries(null)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorBossOnly" x1="0" y1="0" x2="0" y2="1">
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
                        tickFormatter={(v) => {
                            if (v > 1000000) return `S${Math.floor(v / 1000000)}`;
                            if (v > 1000) return `E${Math.floor(v / 1000)}`;
                            return `N${v}`;
                        }}
                        domain={['dataMin', 'dataMax']}
                        stroke={theme.palette.secondary.main}
                        fontSize={11}
                        width={40}
                        style={{ pointerEvents: 'none' }}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    <Area
                        type="step"
                        dataKey="highestBossScore"
                        name="Boss Level"
                        stroke={theme.palette.secondary.main}
                        fill="url(#colorBossOnly)"
                        strokeWidth={activeSeries === 'highestBossScore' ? 4 : 2}
                        fillOpacity={activeSeries ? (activeSeries === 'highestBossScore' ? 1 : 0.1) : 0.6}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: theme.palette.secondary.main }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};

export default BossProgressChart;
