import React, { useState } from 'react';
import { Box, Paper, Typography, useTheme, alpha, IconButton, Tooltip, Popover, Divider } from '@mui/material';
import { InfoOutlined, Fullscreen } from '@mui/icons-material';

const ChartContainer = ({ title, subtitle, icon: Icon, children, controls, footer, color = 'primary', detailsContent }) => {
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
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.3),
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease',
            '&:hover': {
                borderColor: alpha(theme.palette[color].main, 0.4)
            }
        }}>
            {/* Header */}
            <Box sx={{
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{
                        p: 0.8,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette[color].main, 0.08),
                        color: theme.palette[color].main,
                        display: 'flex'
                    }}>
                        <Icon sx={{ fontSize: '1.1rem' }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.65rem', display: 'block', mt: 0.2 }}>
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
            <Box sx={{ flexGrow: 1, p: 1, position: 'relative' }}>
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

            {/* Footer Area */}
            {footer && (
                <Box sx={{ mt: 'auto' }}>
                    {footer}
                </Box>
            )}
        </Paper>
    );
};

export default ChartContainer;
