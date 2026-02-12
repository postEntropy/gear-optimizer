import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

const Crement = ({ header, value, name, handleClick, min, max, size }) => {
    const isInfinity = value === Infinity;
    const displayValue = isInfinity ? '∞' : value;

    const boxStyle = size === 'small'
        ? { display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.25, px: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }
        : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 };

    const valueStyle = size === 'small'
        ? { fontWeight: 'bold', minWidth: '1.5ch', textAlign: 'center' }
        : { fontWeight: 'bold', minWidth: '2ch', textAlign: 'center' };

    return (
        <Box sx={boxStyle}>
            <Typography variant="body2" color="text.secondary">{header}:</Typography>
            <IconButton
                onClick={() => handleClick(name, -1, min, max)}
                size="small"
                disabled={!isInfinity && value <= min}
            >
                <Remove fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={valueStyle}>
                {displayValue}
            </Typography>
            <IconButton
                onClick={() => handleClick(name, 1, min, max)}
                size="small"
                disabled={!isInfinity && value >= max}
            >
                <Add fontSize="small" />
            </IconButton>
        </Box>
    );
};

Crement.propTypes = {
    header: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.any,
    min: PropTypes.number,
    max: PropTypes.number
};

export default Crement;