import { createTheme, alpha } from '@mui/material/styles';

// Helper to blend two colors (Target on top of Base)
// Simple approximation for Hex colors
const blend = (base, color, opacity) => {
    return alpha(color, opacity) // We will rely on alpha for now as full blending logic is verbose
    // Actually, to fix transparency, we need the theme to NOT use rgba for the main backgrounds if possible, 
    // OR we just accept we need a backdrop.
    // Let's stick to alpha but make sure 'paper' is distinct.
};

// Better approach: Use solid background colors that simulate the tint.
// Since we can't easily mix hexes without a library, we will rely on carefully chosen specific tinted dark/light greys 
// OR simpler: Use standard colors and rely on 'Surface Container' pattern if we could.
// 
// Let's implement a 'fake blend' by assuming white/black base.

const getTheme = (mode, colorObj) => {
    const primaryMain = colorObj ? colorObj.main : '#DCE775';
    const contrastOverride = colorObj && colorObj.contrastText ? colorObj.contrastText : null;
    const isDark = mode === 'dark';

    // To avoid transparency issues (see-through menus), we should ideally use solid colors.
    // However, calculating the hex mix relative to #FFFFFF or #1C1B1F is hard without a lib.
    // COMPROMISE: We will use `background.paper` as a higher opacity or just 'alpha' 
    // BUT we will enable `backgroundImage: 'none'` and rely on the browser compositing over the body background for pages,
    // and for Menus/Modals, we need a solid backdrop.

    // Actually, the user's issue is likely that the Menu's Paper IS transparent because of alpha.
    // We can fix the Menu specifically or fix the theme.
    // Let's try to make the Paper background effectively opaque by stacking.
    // Or just use the 'surface' logic from M3 which usually is a solid color.

    return createTheme({
        palette: {
            mode,
            primary: {
                main: primaryMain,
            },
            secondary: {
                main: primaryMain,
            },
            background: {
                default: isDark ? '#1C1B1F' : '#FDFDFD', // Solid base 
                paper: isDark ? '#2B2930' : '#F5F5F5',   // Solid base, we will tint via overlays or specific overrides if needed
                // Reverting to solid greys/whites to fix the "transparent popup" issue immediately, 
                // but we will apply the TINT via the components.
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
            MuiTypography: {
                styleOverrides: {
                    subtitle2: ({ theme }) => ({
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                    }),
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '20px',
                        textTransform: 'none',
                    },
                    ...(contrastOverride && {
                        outlinedPrimary: {
                            color: contrastOverride,
                            borderColor: contrastOverride,
                            '&:hover': {
                                borderColor: contrastOverride,
                                backgroundColor: alpha(primaryMain, 0.08),
                            }
                        },
                        textPrimary: {
                            color: contrastOverride,
                        }
                    })
                },
            },
            MuiCssBaseline: {
                styleOverrides: {
                    'input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                    },
                    'input[type=number]': {
                        MozAppearance: 'textfield',
                    },
                    body: {
                        // Apply the global tint to the BODY background using a pseudo-element or just simple background-color
                        // If we want the tint, we have to cheat if we can't compute the hex.
                        // Let's set the body background to the tint color directly (rgba) which is fine for the page root.
                        backgroundColor: isDark ? '#1C1B1F' : alpha(primaryMain, 0.02),
                        // Note: If body is transparent rgba, it shows white canvas.
                    }
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundImage: 'none',
                        // For the Box-in-Box issue:
                        // We make the default Paper background SOLID and TINTED manually if we can,
                        // or we use a semi-transparent layer but with backdrop-filter? No.

                        // FIX: Use a hardcoded tint-mix for common colors? 
                        // Let's use the 'surfaceTintColor' prop style of M3?
                        // We will set backgroundColor to something that looks like Surface 1 / Surface 2

                        backgroundColor: isDark
                            ? alpha(primaryMain, 0.08) // On dark, alpha is visible against the dark body.
                            : '#FFFFFF', // On light, make Papers WHITE by default (Solid)

                        // To get the "tinted surface" look in Light Mode without transparency:
                        // We use the `::before` overlay trick or just use a very light solid color if we could compute it.
                        // Let's stick to White for Light Mode Papers (cleaner, solves Box-in-Box contrast),
                        // but give them the Colored Shadow.

                        borderRadius: '16px',
                        boxShadow: theme.palette.mode === 'dark'
                            ? '0px 4px 20px 0px rgba(0, 0, 0, 0.4)'
                            : `0px 2px 12px 0px ${alpha(theme.palette.primary.main, 0.2)}`,
                        border: 'none',

                        // Differentiate outlined papers (nested boxes)
                        '&.MuiPaper-outlined': {
                            backgroundColor: 'transparent', // Solve Box-in-Box by making nested outlined boxes transparent
                            border: 'none', // Remove border as requested ("com sombra e nao borda")
                        }
                    }),
                },
            },
            MuiMenu: {
                styleOverrides: {
                    paper: {
                        // Force the popup menu to be SOLID
                        backgroundColor: isDark ? '#2B2930' : '#FFFFFF',
                        backgroundImage: 'none',
                        boxShadow: '0px 4px 20px 0px rgba(0,0,0,0.2)',
                    }
                }
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
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : alpha(primaryMain, 0.06),
                            '&:hover': {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : alpha(primaryMain, 0.09),
                            },
                            '&.Mui-focused': {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : alpha(primaryMain, 0.09),
                            }
                        },
                    },
                },
            },
        },
    });
};

export default getTheme;
