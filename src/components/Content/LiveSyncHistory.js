import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, alpha, Divider } from '@mui/material';
import SyncIcon from '@mui/icons-material/SyncAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const LiveSyncHistory = () => {
    const logs = useSelector(state => state.optimizer.liveSync?.logs) || [];

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <SyncIcon color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: 1 }}>
                    Live Sync History
                </Typography>
            </Box>

            {logs.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: (t) => alpha(t.palette.background.paper, 0.4) }}>
                    <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.6 }}>
                        No sync events recorded yet. Connect your game and perform a save to begin tracking history!
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{ position: 'relative' }}>
                    {/* Vertical line connecting timeline */}
                    <Box sx={{
                        position: 'absolute',
                        left: 28,
                        top: 20,
                        bottom: 20,
                        width: 2,
                        bgcolor: (t) => alpha(t.palette.divider, 0.3)
                    }} />

                    {[...logs].reverse().map((log, index) => {
                        const date = new Date(log.ts);
                        
                        return (
                            <Box key={index} sx={{ display: 'flex', mb: 3, position: 'relative' }}>
                                {/* Timeline Dot */}
                                <Box sx={{ 
                                    width: 58, 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'flex-start',
                                    pt: 1.5,
                                    zIndex: 1
                                }}>
                                    {log.ok ? 
                                        <CheckCircleIcon color="success" sx={{ fontSize: 24, bgcolor: 'background.default', borderRadius: '50%' }} /> : 
                                        <ErrorOutlineIcon color="error" sx={{ fontSize: 24, bgcolor: 'background.default', borderRadius: '50%' }} />
                                    }
                                </Box>

                                {/* Card Content */}
                                <Paper sx={{ 
                                    flex: 1, 
                                    p: 3, 
                                    borderRadius: 3,
                                    boxShadow: (t) => `0 4px 20px ${alpha(t.palette.common.black, 0.05)}`,
                                    border: '1px solid',
                                    borderColor: (t) => alpha(t.palette.divider, 0.1),
                                    bgcolor: (t) => alpha(t.palette.background.paper, 0.7),
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {log.label}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                            {date.toLocaleDateString()} {date.toLocaleTimeString()}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'monospace' }}>
                                        {log.detail}
                                    </Typography>

                                    {log.diffs && log.diffs.length > 0 && (
                                        <>
                                            <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                                            <Typography variant="overline" color="primary" fontWeight={700} sx={{ mb: 1, display: 'block', letterSpacing: 1.5 }}>
                                                LEVEL PROGRESSIONS
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {log.diffs.map((diff, i) => {
                                                    const isNgu = diff.startsWith('NGU');
                                                    const isHack = diff.startsWith('Hack');
                                                    const isWish = diff.startsWith('Wish');
                                                    const isTM = diff.startsWith('TM');
                                                    const isWandoos = diff.startsWith('Wandoos');
                                                    const isAT = diff.startsWith('AT');
                                                    const isAugment = diff.startsWith('Augment');
                                                    const isBlood = diff.startsWith('Blood');
                                                    const isMacguffin = diff.startsWith('MacGuffin');
                                                    
                                                    let color = '#4caf50'; // default green
                                                    if (isNgu) color = '#ff9800'; // orange
                                                    else if (isHack) color = '#f44336'; // red
                                                    else if (isWish) color = '#2196f3'; // blue
                                                    else if (isTM) color = '#00bcd4'; // cyan
                                                    else if (isWandoos) color = '#9c27b0'; // purple
                                                    else if (isAT) color = '#3f51b5'; // indigo
                                                    else if (isAugment) color = '#e91e63'; // pink
                                                    else if (isBlood) color = '#d32f2f'; // dark red
                                                    else if (isMacguffin) color = '#795548'; // brown

                                                    return (
                                                        <Box key={i} sx={{
                                                            bgcolor: alpha(color, 0.1),
                                                            color: color,
                                                            px: 1.5, py: 0.5, borderRadius: 1.5,
                                                            border: `1px solid ${alpha(color, 0.3)}`,
                                                            display: 'flex', alignItems: 'center', gap: 0.5
                                                        }}>
                                                            <Typography variant="body2" fontWeight={800} fontSize="0.75rem">
                                                                {diff}
                                                            </Typography>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </>
                                    )}
                                </Paper>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

export default LiveSyncHistory;
