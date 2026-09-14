import React from 'react';
import { Box, Paper, Typography, Tooltip, alpha, useTheme } from '@mui/material';
import { Inventory2, CheckCircleOutline, DeleteSweep, SwapHoriz } from '@mui/icons-material';

const Tile = ({ label, value, icon: Icon, color, hint }) => {
    const theme = useTheme();
    return (
        <Tooltip title={hint || ''} arrow disableHoverListener={!hint}>
            <Paper
                variant="outlined"
                sx={{
                    flex: '1 1 150px',
                    minWidth: 0,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: 3
                }}
            >
                <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette[color].main, 0.12),
                    color: theme.palette[color].main,
                    display: 'flex'
                }}>
                    <Icon fontSize="small" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ fontWeight: 600 }}>
                        {label}
                    </Typography>
                </Box>
            </Paper>
        </Tooltip>
    );
};

const CleaningSummary = ({ report }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
            <Tile
                label="Owned"
                value={report.ownedCount.toLocaleString()}
                icon={Inventory2}
                color="info"
                hint="Items you own, derived from your imported save"
            />
            <Tile
                label="In use"
                value={report.usedCount.toLocaleString()}
                icon={CheckCircleOutline}
                color="success"
                hint="Equipped, stored in a loadout, or optimal for at least one priority"
            />
            <Tile
                label="Unused"
                value={report.unusedCount.toLocaleString()}
                icon={DeleteSweep}
                color="warning"
                hint="Never optimal for any priority"
            />
            <Tile
                label="Replaceable"
                value={report.replaceableCount.toLocaleString()}
                icon={SwapHoriz}
                color="secondary"
                hint="In use but a strictly better item you own exists in the same slot"
            />
        </Box>
    );
};

export default CleaningSummary;
