import React from 'react';
import PropTypes from 'prop-types';
import { Button, CircularProgress } from '@mui/material';
import { AutoAwesome, Stop } from '@mui/icons-material';

const OptimizeButton = ({ running, abort, optimize, text, ...props }) => {
    if (running) {
        return (
            <Button
                variant="contained"
                color="error"
                onClick={() => abort()}
                startIcon={<Stop />}
                endIcon={<CircularProgress size={20} color="inherit" />}
                {...props}
            >
                Abort
            </Button>
        );
    } else {
        return (
            <Button
                variant="contained"
                color="primary"
                onClick={() => optimize()}
                startIcon={<AutoAwesome />}
                {...props}
            >
                {'Optimize ' + text}
            </Button>
        );
    }
}

OptimizeButton.propTypes = {
    running: PropTypes.bool.isRequired,
    abort: PropTypes.func.isRequired,
    optimize: PropTypes.func.isRequired,
    text: PropTypes.string
};

export default OptimizeButton;
