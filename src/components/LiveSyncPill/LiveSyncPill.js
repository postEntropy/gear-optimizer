import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Tooltip, alpha, keyframes, Popover } from '@mui/material';

const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
`;

const LiveSyncPill = ({ collapsed }) => {
    const liveSync = useSelector(state => state.optimizer.liveSync);
    const { status, lastUpdate, updateCount, logs } = liveSync || {};

    const isConnected = status === 'connected';
    const isError = status === 'error';
    const isConnecting = status === 'connecting';
    const isReconnecting = status === 'reconnecting';

    const getStatusColor = () => {
        if (isConnected) return '#00ff00';
        if (isError) return '#ff1744';
        if (isConnecting || isReconnecting) return '#ffa726';
        return '#757575';
    };

    const statusLabel = isConnected ? 'LIVE'
        : isError ? 'ERROR'
        : isConnecting ? 'CONNECTING'
        : isReconnecting ? 'RECONNECTING'
        : 'OFF';

    // Timer logic
    const [timeSince, setTimeSince] = React.useState('');
    const [countdown, setCountdown] = React.useState(30);

    React.useEffect(() => {
        if (!lastUpdate) return;

        const update = () => {
            const now = Date.now();
            const diff = Math.floor((now - lastUpdate) / 1000);

            if (diff < 60) setTimeSince(`${diff}s`);
            else setTimeSince(`${Math.floor(diff / 60)}m`);

            const remaining = Math.max(0, 30 - (diff % 30));
            setCountdown(remaining);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [lastUpdate]);

    // Log popover
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (e) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const syncLogs = Array.isArray(logs) ? logs : [];
    const statusColor = getStatusColor();

    if (collapsed) {
        return (
            <Tooltip title={`Live Sync: ${statusLabel}${lastUpdate ? ` (${timeSince} ago)` : ''}${isReconnecting ? ' – reconnecting soon' : ''}`}>
                <Box onClick={handleClick} sx={{
                    width: 14, height: 14, borderRadius: '50%',
                    bgcolor: alpha(statusColor, 0.15),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid', borderColor: alpha(statusColor, 0.4),
                    cursor: 'pointer', transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.2)' }
                }}>
                    <Box sx={{
                        width: 7, height: 7, borderRadius: '50%',
                        bgcolor: statusColor,
                        boxShadow: isConnected ? `0 0 10px ${statusColor}` : 'none',
                        animation: (isConnected || isConnecting || isReconnecting) ? `${blink} 1.5s infinite` : 'none'
                    }} />
                </Box>
            </Tooltip>
        );
    }

    return (
        <>
            <Tooltip title="Clique para ver o log de sync">
                <Box onClick={handleClick} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 1.8, py: 0.6, borderRadius: '10px',
                    bgcolor: (t) => alpha(t.palette.background.paper, 0.4),
                    backdropFilter: 'blur(8px)',
                    border: '1px solid', borderColor: (t) => alpha(t.palette.divider, 0.15),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer', width: '100%',
                    '&:hover': {
                        bgcolor: (t) => alpha(t.palette.background.paper, 0.6),
                        borderColor: (t) => alpha(t.palette.primary.main, 0.35),
                        transform: 'translateY(-1px)',
                        boxShadow: (t) => `0 4px 12px ${alpha(t.palette.common.black, 0.1)}`
                    }
                }}>
                    <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: statusColor,
                        boxShadow: (isConnected || isConnecting || isReconnecting) ? `0 0 10px ${statusColor}` : 'none',
                        animation: (isConnected || isConnecting || isReconnecting) ? `${blink} 2s infinite` : 'none',
                        flexShrink: 0
                    }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 }}>
                        <Typography variant="caption" fontWeight={900} sx={{
                            color: (isConnected || isConnecting || isReconnecting) ? 'text.primary' : 'text.secondary',
                            letterSpacing: 0.8, fontSize: '0.7rem',
                            textTransform: 'uppercase', lineHeight: 1.2
                        }}>
                            Live Sync
                        </Typography>
                        {isConnected && lastUpdate && (
                            <Typography variant="caption" sx={{
                                opacity: 0.5, fontSize: '0.6rem',
                                fontFamily: 'monospace', letterSpacing: 0.2
                            }}>
                                Updated {timeSince} ago
                            </Typography>
                        )}
                        {(isConnecting || isReconnecting) && (
                            <Typography variant="caption" sx={{
                                opacity: 0.6, fontSize: '0.6rem',
                                fontFamily: 'monospace', letterSpacing: 0.2,
                                color: statusColor
                            }}>
                                {isReconnecting ? 'Reconnecting...' : 'Connecting...'}
                            </Typography>
                        )}
                    </Box>

                    {isConnected && (
                        <Box sx={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                            borderLeft: '1px solid', borderColor: 'divider', pl: 1.5
                        }}>
                            <Typography variant="caption" sx={{ fontSize: '0.55rem', opacity: 0.4, fontWeight: 700 }}>NEXT</Typography>
                            <Typography variant="caption" sx={{
                                fontWeight: 900, color: 'primary.main',
                                fontSize: '0.8rem', lineHeight: 1, fontFamily: 'monospace'
                            }}>
                                {countdown}s
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Tooltip>

            {/* Log Popover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        width: 320, maxHeight: 340,
                        bgcolor: (t) => alpha(t.palette.background.paper, 0.97),
                        backdropFilter: 'blur(12px)',
                        border: '1px solid', borderColor: alpha(statusColor, 0.25),
                        borderRadius: '12px', overflow: 'hidden',
                        boxShadow: (t) => `0 8px 32px ${alpha(t.palette.common.black, 0.35)}`
                    }
                }}
            >
                {/* Header */}
                <Box sx={{
                    px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1,
                    borderBottom: '1px solid', borderColor: (t) => alpha(t.palette.divider, 0.2),
                    bgcolor: alpha(statusColor, 0.05)
                }}>
                    <Box sx={{
                        width: 7, height: 7, borderRadius: '50%',
                        bgcolor: statusColor,
                        boxShadow: isConnected ? `0 0 8px ${statusColor}` : 'none',
                        animation: isConnected ? `${blink} 2s infinite` : 'none'
                    }} />
                    <Typography variant="caption" fontWeight={900} sx={{
                        letterSpacing: 1, fontSize: '0.7rem',
                        textTransform: 'uppercase', color: 'text.primary'
                    }}>
                        Live Sync Log
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" sx={{ opacity: 0.4, fontSize: '0.6rem', fontFamily: 'monospace' }}>
                        {updateCount || 0} syncs
                    </Typography>
                </Box>

                {/* Log entries */}
                <Box sx={{ overflowY: 'auto', maxHeight: 270 }}>
                    {syncLogs.length === 0 ? (
                        <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ opacity: 0.4, fontStyle: 'italic' }}>
                                Aguardando dados do jogo...
                            </Typography>
                        </Box>
                    ) : (
                        [...syncLogs].reverse().map((entry, idx) => (
                            <Box key={idx} sx={{
                                px: 2, py: 0.8,
                                borderBottom: '1px solid',
                                borderColor: (t) => alpha(t.palette.divider, 0.08),
                                '&:hover': { bgcolor: (t) => alpha(t.palette.action.hover, 0.05) }
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                                    <Typography variant="caption" sx={{
                                        fontFamily: 'monospace', fontSize: '0.6rem',
                                        color: entry.ok ? 'success.main' : 'error.main',
                                        fontWeight: 700
                                    }}>
                                        {entry.ok ? '✓' : '✗'} {entry.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        opacity: 0.35, fontSize: '0.55rem',
                                        fontFamily: 'monospace', whiteSpace: 'nowrap'
                                    }}>
                                        {new Date(entry.ts).toLocaleTimeString()}
                                    </Typography>
                                </Box>
                                {entry.detail && (
                                    <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.58rem', display: 'block', mt: 0.2 }}>
                                        {entry.detail}
                                    </Typography>
                                )}
                            </Box>
                        ))
                    )}
                </Box>
            </Popover>
        </>
    );
};

export default LiveSyncPill;
