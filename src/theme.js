import { createTheme, alpha } from '@mui/material/styles';

const getTheme = (mode, colorObj) => {
    const isDark = mode === 'dark';

    // Premium Color Logic
    // If a custom color is selected, use it. Otherwise default to a safe premium color.
    const primaryMain = colorObj ? colorObj.main : (isDark ? '#38bdf8' : '#0284c7'); // Sky Blue (Dark) / Ocean Blue (Light)
    const secondaryMain = colorObj ? colorObj.main : (isDark ? '#2dd4bf' : '#0d9488'); // Teal

    // Backgrounds: Subtle, Professional Gradients (No more disco)
    // Dark: Slate 900 to Slate 800 (Deep Blue Grey)
    const darkGradient = 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%)';
    // Light: Slate 50 to Slate 100 (Crisp White/Silver)
    const lightGradient = 'radial-gradient(circle at 50% 0%, #ffffff 0%, #f1f5f9 100%)';

    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: primaryMain,
            },
            secondary: {
                main: secondaryMain,
            },
            background: {
                default: isDark ? '#0f172a' : '#f8fafc', // Fallback
                paper: isDark ? alpha('#1e293b', 0.7) : alpha('#ffffff', 0.8),
            },
            text: {
                primary: isDark ? '#f1f5f9' : '#0f172a', // Slate 100 / Slate 900
                secondary: isDark ? '#94a3b8' : '#64748b', // Slate 400 / Slate 500
            }
        },
        typography: {
            fontFamily: "'Outfit', sans-serif",
            h1: { fontWeight: 700, letterSpacing: '-0.025em' },
            h2: { fontWeight: 700, letterSpacing: '-0.025em' },
            h3: { fontWeight: 600, letterSpacing: '-0.025em' },
            h4: { fontWeight: 600 },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            button: { fontWeight: 600, textTransform: 'none' },
        },
        shape: {
            borderRadius: 12, // Slightly tighter radius for professional look
        },
        shadows: isDark
            ? Array(25).fill('0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)') // Darker, deeper shadows
            : Array(25).fill('0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'), // Soft modern shadows
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        background: isDark ? darkGradient : lightGradient,
                        minHeight: '100vh',
                        backgroundAttachment: 'fixed',
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backdropFilter: 'blur(12px)',
                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.04)',
                        backgroundImage: 'none',
                    }
                }
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8, // Match standard buttons
                    }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: 'none',
                            backgroundColor: alpha(primaryMain, 0.12),
                        }
                    },
                    contained: {
                        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
                        '&:hover': {
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }
                    }
                }
            },
            MuiTextField: {
                defaultProps: {
                    variant: 'outlined', // Switch to outlined for cleaner look
                },
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: isDark ? alpha('#000', 0.2) : alpha('#fff', 0.6),
                            '& fieldset': {
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            },
                            '&:hover fieldset': {
                                borderColor: primaryMain,
                            },
                        }
                    }
                }
            }
        }
    });

    return theme;
};

export default getTheme;
