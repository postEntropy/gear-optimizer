import React from 'react';
import { Box, Card, CardContent, Grid, Typography, useTheme, alpha } from '@mui/material';
import { TrendingUp, History, Star, AccessTime } from '@mui/icons-material';
import { shorten, toTime } from '../../../util';

const StatCard = ({ title, value, subtext, icon: Icon, color, gradient }) => {
    const theme = useTheme();

    return (
        <Card sx={{
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
            background: gradient || alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 24px -10px ${alpha(theme.palette[color].main, 0.4)}`,
                borderColor: theme.palette[color].main
            }
        }}>
            <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette[color].main, 0.2)} 0%, transparent 70%)`,
                zIndex: 0
            }} />

            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: gradient ? 'rgba(255,255,255,0.15)' : alpha(theme.palette[color].main, 0.1),
                        color: gradient ? '#fff' : theme.palette[color].main,
                        display: 'flex'
                    }}>
                        <Icon fontSize="small" />
                    </Box>
                    {subtext && (
                        <Box sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 10,
                            bgcolor: gradient ? 'rgba(255,255,255,0.2)' : alpha(theme.palette[color].main, 0.1),
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: gradient ? '#fff' : theme.palette[color].main
                        }}>
                            {subtext}
                        </Box>
                    )}
                </Box>

                <Typography variant="h4" sx={{
                    fontWeight: 800,
                    mb: 0.5,
                    background: gradient ? 'none' : `linear-gradient(45deg, ${theme.palette.text.primary} 30%, ${theme.palette[color].main} 90%)`,
                    WebkitBackgroundClip: gradient ? 'none' : 'text',
                    WebkitTextFillColor: gradient ? '#fff' : 'transparent',
                    color: gradient ? '#fff' : 'inherit',
                    textShadow: gradient ? '0 2px 10px rgba(0,0,0,0.2)' : 'none'
                }}>
                    {value}
                </Typography>

                <Typography variant="caption" sx={{
                    color: gradient ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase'
                }}>
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );
};

const SummaryCards = ({ history }) => {
    const theme = useTheme();

    if (!history || history.length === 0) return null;

    const latest = history[history.length - 1]; // Newest entry assuming sorted
    const previous = history.length > 1 ? history[history.length - 2] : null;

    // Calculate Growth
    const expGrowth = previous ? ((latest.exp / previous.exp) - 1) * 100 : 0;

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Total Rebirths"
                    value={latest.rebirths}
                    icon={History}
                    color="primary"
                    gradient={`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`}
                    subtext="All Time"
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Total Experience"
                    value={shorten(latest.exp)}
                    icon={TrendingUp}
                    color="success"
                    subtext={`+${expGrowth.toFixed(1)}%`}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Highest Boss"
                    value={latest.highestSadisticBoss > 1 ? `S${latest.highestSadisticBoss}` : (latest.highestHardBoss > 0 ? `E${latest.highestHardBoss}` : `N${latest.highestBoss}`)}
                    icon={Star}
                    color="warning"
                    subtext={latest.highestSadisticBoss > 1 ? 'Sadistic' : (latest.highestHardBoss > 0 ? 'Evil' : 'Normal')}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    title="Playtime"
                    value={toTime((latest.playtime || 0) * 50)}
                    icon={AccessTime}
                    color="info"
                />
            </Grid>
        </Grid>
    );
};

export default SummaryCards;
