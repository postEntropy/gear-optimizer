import React, { useMemo, useState } from 'react';
import { Box, Paper, Typography, useTheme, alpha, Avatar, Tooltip, Chip, Button, Grid } from '@mui/material';
import { TrendingUp, Star, AccessTime, Bolt } from '@mui/icons-material';
import { shorten, toTime } from '../../../util';

const TimelineItem = ({ entry, previous, isLast }) => {
    const theme = useTheme();
    
    const expGain = useMemo(() => {
        if (!previous) return null;
        const gain = entry.exp - previous.exp;
        const pct = (gain / previous.exp) * 100;
        return { gain, pct };
    }, [entry.exp, previous]);

    const bossDisplay = useMemo(() => {
        if (entry.highestSadisticBoss > 1) return { label: `S${entry.highestSadisticBoss}`, color: 'error' };
        if (entry.highestHardBoss > 0) return { label: `E${entry.highestHardBoss}`, color: 'warning' };
        return { label: `N${entry.highestBoss}`, color: 'primary' };
    }, [entry]);

    const isRecord = useMemo(() => {
        if (!previous) return false;
        return entry.highestSadisticBoss > previous.highestSadisticBoss || 
               entry.highestHardBoss > previous.highestHardBoss || 
               entry.highestBoss > previous.highestBoss;
    }, [entry, previous]);

    return (
        <Box sx={{ display: 'flex', gap: 3, position: 'relative' }}>
            {/* Left Side: Timeline Connector */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar sx={{ 
                    bgcolor: isRecord ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.primary.main, 0.1), 
                    color: isRecord ? 'warning.main' : 'primary.main',
                    width: 40,
                    height: 40,
                    border: `2px solid ${isRecord ? theme.palette.warning.main : theme.palette.primary.main}`,
                    boxShadow: isRecord ? `0 0 10px ${alpha(theme.palette.warning.main, 0.4)}` : 'none',
                    zIndex: 2
                }}>
                    <Bolt />
                </Avatar>
                {!isLast && <Box sx={{ flexGrow: 1, width: 2, bgcolor: alpha(theme.palette.divider, 0.5), my: 1 }} />}
            </Box>

            {/* Right Side: Content Card */}
            <Box sx={{ flexGrow: 1, pb: isLast ? 0 : 4 }}>
                <Paper sx={{ 
                    p: 2.5, 
                    borderRadius: 4, 
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                        transform: 'translateX(8px)',
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        boxShadow: `0 8px 24px -12px rgba(0,0,0,0.2)`
                    },
                    '&::after': isRecord ? {
                        content: '"NEW RECORD"',
                        position: 'absolute',
                        top: 10,
                        right: -30,
                        bgcolor: 'warning.main',
                        color: 'warning.contrastText',
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        px: 4,
                        py: 0.5,
                        transform: 'rotate(45deg)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    } : {}
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                Rebirth #{entry.rebirths.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {new Date(entry.timestamp).toLocaleString()}
                            </Typography>
                        </Box>
                        <Tooltip title="Highest Boss Reached" arrow>
                            <Chip 
                                label={bossDisplay.label} 
                                color={bossDisplay.color} 
                                size="small" 
                                sx={{ fontWeight: 900, borderRadius: 1.5, px: 1 }} 
                            />
                        </Tooltip>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', display: 'flex' }}>
                                    <TrendingUp fontSize="small" />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={800}>{shorten(entry.exp)} XP</Typography>
                                    {expGain && (
                                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 700, display: 'block' }}>
                                            +{expGain.pct.toFixed(1)}% gain
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', display: 'flex' }}>
                                    <AccessTime fontSize="small" />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={800}>{toTime((entry.playtime || 0) * 50)}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Rebirth Length</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', display: 'flex' }}>
                                    <Star fontSize="small" />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={800}>{shorten(entry.ap)} AP</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total AP</Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
};

const HistoryTimeline = ({ history }) => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 15;
    
    const visibleHistory = useMemo(() => {
        return history.slice(0, page * itemsPerPage);
    }, [history, page]);

    const hasMore = visibleHistory.length < history.length;

    return (
        <Box sx={{ py: 2, maxWidth: 800, mx: 'auto' }}>
            {visibleHistory.map((entry, index) => (
                <TimelineItem 
                    key={entry.timestamp} 
                    entry={entry} 
                    previous={history[index + 1]} 
                    isLast={index === visibleHistory.length - 1 && !hasMore}
                />
            ))}
            
            {hasMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                    <Button 
                        variant="contained" 
                        onClick={() => setPage(p => p + 1)}
                        sx={{ 
                            borderRadius: 3, 
                            textTransform: 'none', 
                            fontWeight: 800,
                            px: 4,
                            py: 1,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        Load More Rebirths
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default HistoryTimeline;
