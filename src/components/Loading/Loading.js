import React from 'react';
import { Box } from '@mui/material';

// Loading Component (M3 Expressive / Starburst)
const Loading = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                minHeight: '60vh', // Ensure it takes up substantial vertical space
                flexGrow: 1
            }}
        >
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    color: 'primary.main',
                    animation: 'spin 2s linear infinite',
                    '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                    }
                }}
            >
                {/* 12-point starburst SVG - M3 Expressive shape */}
                <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
                    <path d="M23,12L20.56,9.22L20.9,5.54L17.29,4.72L15.4,1.54L12,3L8.6,1.54L6.71,4.72L3.1,5.53L3.44,9.21L1,12L3.44,14.78L3.1,18.47L6.71,19.29L8.6,22.47L12,21L15.4,22.46L17.29,19.28L20.9,18.46L20.56,14.78L23,12Z" />
                </svg>
            </Box>
        </Box>
    );
};

export default Loading;
