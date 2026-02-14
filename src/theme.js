import { createTheme, alpha } from '@mui/material/styles';

const getTheme = (mode, colorObj) => {
    const isDark = mode === 'dark';

    // Premium Color Logic
    const primaryMain = colorObj ? colorObj.main : (isDark ? '#8b5cf6' : '#6366f1');
    const secondaryMain = isDark ? alpha(primaryMain, 0.7) : alpha(primaryMain, 0.8);

    // Backgrounds: Deeper, More Intense Obsidian/White
    // Dark: Deep Obsidian to Rich Charcoal with a hint of the primary color
    const darkGradient = `radial-gradient(circle at 50% 0%, ${alpha(primaryMain, 0.15)} 0%, #020617 100%)`;
    // Light: Clean White to Soft Silver
    const lightGradient = 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)';

    const theme = createTheme({
        palette: {
            mode,
            primary: {
                main: primaryMain,
                contrastText: colorObj?.contrastText || '#fff',
            },
            secondary: {
                main: secondaryMain,
            },
            background: {
                default: isDark ? '#020617' : '#ffffff',
                paper: isDark ? alpha('#0f172a', 0.8) : alpha('#ffffff', 0.9),
            },
            text: {
                primary: isDark ? '#f8fafc' : '#0f172a',
                secondary: isDark ? '#94a3b8' : '#64748b',
            },
            divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        },
        typography: {
            fontFamily: "'Outfit', sans-serif",
            h1: { fontWeight: 800, letterSpacing: '-0.04em' },
            h2: { fontWeight: 800, letterSpacing: '-0.03em' },
            h3: { fontWeight: 700, letterSpacing: '-0.02em' },
            h4: { fontWeight: 700, letterSpacing: '-0.01em' },
            h5: { fontWeight: 600 },
            h6: { fontWeight: 600 },
            button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
        },
        shape: {
            borderRadius: 8, // Back to professional standard
        },
        shadows: isDark
            ? [
                'none',
                '0 1px 3px rgba(0,0,0,0.3)',
                '0 4px 6px -1px rgba(0,0,0,0.3)',
                ...Array(22).fill('0 10px 15px -3px rgba(0,0,0,0.4)')
            ]
            : [
                'none',
                '0 1px 2px rgba(0,0,0,0.05)',
                '0 4px 6px -1px rgba(0,0,0,0.1)',
                ...Array(22).fill('0 10px 15px -3px rgba(0,0,0,0.05)')
            ],
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        background: isDark ? darkGradient : lightGradient,
                        minHeight: '100vh',
                        backgroundAttachment: 'fixed',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: isDark ? '#020617' : '#f1f5f9',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: isDark ? '#1e293b' : '#cbd5e1',
                            borderRadius: '4px',
                        },
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        // Removed global backdropFilter from root - too expensive for multiple cards
                        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                        backgroundImage: 'none',
                    }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 6,
                        transition: 'background-color 0.2s, transform 0.1s, box-shadow 0.2s',
                    },
                    contained: {
                        boxShadow: 'none',
                    }
                }
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                            boxShadow: isDark ? '0 8px 16px rgba(0,0,0,0.4)' : '0 8px 16px rgba(0,0,0,0.08)',
                        }
                    }
                }
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 6,
                            backgroundColor: isDark ? alpha('#000', 0.1) : alpha('#fff', 0.5),
                        }
                    }
                }
            }
        }
    });

    return theme;
};

export default getTheme;
