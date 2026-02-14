import React, { useState } from 'react';
import { Box, Paper, Typography, useTheme, alpha, IconButton, Tooltip, Popover, Divider } from '@mui/material';
import { InfoOutlined, Fullscreen } from '@mui/icons-material';

const ChartContainer = ({ title, subtitle, icon: Icon, children, controls, color = 'primary', detailsContent }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleOpenDetails = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseDetails = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <Paper sx={{
            height: '100%',
            p: 0,
            overflow: 'hidden',
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.4),
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            '&:hover': {
                boxShadow: `0 8px 32px -8px ${alpha(theme.palette.common.black, 0.2)}`,
                borderColor: alpha(theme.palette[color].main, 0.3)
            }
        }}>
            {/* Header */}
            <Box sx={{
                p: 2.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: `linear-gradient(90deg, ${alpha(theme.palette[color].main, 0.05)} 0%, transparent 100%)`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette[color].main, 0.1),
                        color: theme.palette[color].main
                    }}>
                        <Icon fontSize="small" />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '1rem' }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Controls Area */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {controls}
                    <Tooltip title="View Details">
                        <IconButton
                            size="small"
                            onClick={handleOpenDetails}
                            sx={{
                                opacity: open ? 1 : 0.5,
                                color: open ? theme.palette[color].main : 'inherit',
                                '&:hover': { opacity: 1 }
                            }}
                        >
                            <InfoOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Chart Content */}
            <Box sx={{ flexGrow: 1, p: 2, minHeight: 400, position: 'relative' }}>
                {children}
            </Box>

            {/* Details Popover */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseDetails}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        p: 2,
                        width: 320,
                        maxHeight: 500,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.background.paper, 0.95),
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: `0 12px 40px -12px ${alpha(theme.palette.common.black, 0.4)}`
                    }
                }}
            >
                {detailsContent || (
                    <Typography variant="body2" color="text.secondary">
                        No additional details available for this chart.
                    </Typography>
                )}
            </Popover>
        </Paper>
    );
};

export default ChartContainer;
