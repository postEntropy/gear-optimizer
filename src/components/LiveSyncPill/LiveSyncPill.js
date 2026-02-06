import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Tooltip, alpha, keyframes } from '@mui/material';
import { Sensors, SensorsOff, Sync } from '@mui/icons-material';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
`;

const LiveSyncPill = ({ collapsed }) => {
    const liveSync = useSelector(state => state.optimizer.liveSync);
    const { status, lastUpdate, updateCount } = liveSync || {};

    const isConnected = status === 'connected';
    const isError = status === 'error';

    const getStatusColor = () => {
        if (isConnected) return '#00ff00';
        if (isError) return '#ff1744';
        return '#757575';
    };

    const statusLabel = isConnected ? 'LIVE' : isError ? 'ERROR' : 'OFF';

    // Timer logic
    const [timeSince, setTimeSince] = React.useState('');
    const [countdown, setCountdown] = React.useState(30);

    React.useEffect(() => {
        if (!lastUpdate) return;

        const update = () => {
            const now = Date.now();
            const diff = Math.floor((now - lastUpdate) / 1000);

            // Time since update
            if (diff < 60) setTimeSince(`${diff}s`);
            else setTimeSince(`${Math.floor(diff / 60)}m`);

            // Countdown to next auto-save (detected 30s)
            // Resets to 30 every time new data arrives (lastUpdate changes)
            const remaining = Math.max(0, 30 - (diff % 30));
            setCountdown(remaining);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [lastUpdate]);

    if (collapsed) {
        return (
            <Tooltip title={`Live Sync: ${statusLabel}${lastUpdate ? ` (Sync ${timeSince} ago)` : ''}`}>
                <Box sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: alpha(getStatusColor(), 0.15),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid',
                    borderColor: alpha(getStatusColor(), 0.4),
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.2)' }
                }}>
                    <Box sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor: getStatusColor(),
                        boxShadow: isConnected ? `0 0 10px ${getStatusColor()}` : 'none',
                        animation: isConnected ? `${blink} 1.5s infinite` : 'none'
                    }} />
                </Box>
            </Tooltip>
        );
    }

    return (
        <Tooltip title={
            <Box sx={{ p: 0.5 }}>
                <Typography variant="caption" display="block">Status: <b>{status}</b></Typography>
                <Typography variant="caption" display="block">Updates Received: <b>{updateCount}</b></Typography>
                {lastUpdate && <Typography variant="caption" display="block">Last Sync: <b>{new Date(lastUpdate).toLocaleTimeString()}</b></Typography>}
                <Typography variant="caption" display="block">Next expected: <b>~{countdown}s</b></Typography>
            </Box>
        }>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.8,
                py: 0.6,
                borderRadius: '10px',
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(8px)',
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.divider, 0.15),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default',
                width: '100%',
                '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.35),
                    transform: 'translateY(-1px)',
                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
                }
            }}>
                <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: getStatusColor(),
                    boxShadow: isConnected ? `0 0 10px ${getStatusColor()}` : 'none',
                    animation: isConnected ? `${blink} 2s infinite` : 'none'
                }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 }}>
                    <Typography
                        variant="caption"
                        fontWeight={900}
                        sx={{
                            color: isConnected ? 'text.primary' : 'text.secondary',
                            letterSpacing: 0.8,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            lineHeight: 1.2
                        }}
                    >
                        Live Sync
                    </Typography>

                    {isConnected && lastUpdate && (
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.5,
                                fontSize: '0.6rem',
                                fontFamily: 'monospace',
                                letterSpacing: 0.2
                            }}
                        >
                            Updated {timeSince} ago
                        </Typography>
                    )}
                </Box>

                {isConnected && (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        pl: 1.5
                    }}>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', opacity: 0.4, fontWeight: 700 }}>NEXT</Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 900,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                lineHeight: 1,
                                fontFamily: 'monospace'
                            }}
                        >
                            {countdown}s
                        </Typography>
                    </Box>
                )}
            </Box>
        </Tooltip>
    );
};

export default LiveSyncPill;
