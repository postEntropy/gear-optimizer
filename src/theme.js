import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
    palette: {
        mode,
        primary: {
            main: '#5A7896', // Slate Blue from screenshot
        },
        secondary: {
            main: '#5A7896',
        },
        background: {
            default: mode === 'dark' ? '#1C1B1F' : '#FFFBFE',
            paper: mode === 'dark' ? '#1C1B1F' : '#FFFBFE',
        },
    },
    typography: {
        fontFamily: [
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '20px', // Rounder buttons for M3
                    textTransform: 'none',
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                // Remove number input arrows/spinners
                'input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button': {
                    '-webkit-appearance': 'none',
                    margin: 0,
                },
                'input[type=number]': {
                    '-moz-appearance': 'textfield',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: ({ theme }) => ({
                    backgroundImage: 'none',
                    borderRadius: '12px',
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0px 4px 20px 0px rgba(0, 0, 0, 0.4)' // Stronger shadow for dark mode
                        : '0px 2px 12px 0px rgba(0, 0, 0, 0.08)', // Soft uniform shadow for light mode
                    border: 'none',
                }),
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'filled',
            },
            styleOverrides: {
                root: {
                    '& .MuiFilledInput-root': {
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                    },
                },
            },
        },
    },
});

export default getTheme;
