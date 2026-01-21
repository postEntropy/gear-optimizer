import React, { useMemo } from 'react';
import CookieBanner from 'react-cookie-banner';
import { NavLink, useLocation, useMatch, useParams } from 'react-router-dom';

import {
    alpha,
    Box,
    CssBaseline,
    ThemeProvider,
    Typography,
    IconButton,
    useMediaQuery,
    Link,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Drawer,
    Tooltip,
    Divider,
    Avatar
} from '@mui/material';
import {
    Brightness4,
    Brightness7,
    Palette,
    GitHub,
    SettingsSuggest, // Gear/Optimizer
    TrendingUp, // Augments (Growth)
    FlashOn, // Energy/Magic (NGUs)
    Code, // Hacks
    Star // Wishes
} from '@mui/icons-material';
import { Menu, MenuItem } from '@mui/material';

import DarkModeContext from './DarkModeContext';
import getTheme from '../../theme';
import { THEME_COLORS } from '../../themeColors';
import Loading from '../Loading/Loading';

// Static Imports for Instant Navigation
import Optimizer from '../Content/Optimizer';
import Augment from '../Content/Augment';
import NGUComponent from '../Content/NGUs';
import HackComponent from '../Content/Hacks';
import WishComponent from '../Content/Wishes';
// import AboutComponent from '../About/About';

const DRAWER_WIDTH = 260;

// Simple Fade Animation
const fadeAnimation = {
    animation: 'fadeIn 0.3s ease-in-out',
    '@keyframes fadeIn': {
        '0%': { opacity: 0, transform: 'translateY(10px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
    }
};

const NavItem = ({ to, label, icon, isActive }) => {
    return (
        <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
                component={NavLink}
                to={to}
                selected={isActive}
                sx={{
                    borderRadius: '0 24px 24px 0', // Rounded right side
                    mr: 2,
                    pl: 3,
                    height: 48,
                    transition: 'all 0.2s',
                    '&.active': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        boxShadow: (theme) => `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                        '& .MuiListItemIcon-root': {
                            color: 'primary.contrastText',
                        }
                    },
                    '&:hover:not(.active)': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    }
                }}
            >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : 'text.secondary' }}>
                    {icon}
                </ListItemIcon>
                <ListItemText
                    primary={label}
                    primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '1rem' }}
                />
            </ListItemButton>
        </ListItem>
    );
};

const AppLayout = (props) => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [darkMode, setDarkMode] = React.useState(() => {
        const saved = localStorage.getItem('dark-mode');
        return saved !== null ? saved === 'true' : prefersDarkMode;
    });
    const [selectedColorKey, setSelectedColorKey] = React.useState(() => {
        const saved = localStorage.getItem('theme-color-key');
        return saved && THEME_COLORS[saved] ? saved : 'GREEN';
    });

    const [anchorEl, setAnchorEl] = React.useState(null);
    const colorMenuOpen = Boolean(anchorEl);

    const handleColorMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleColorMenuClose = () => {
        setAnchorEl(null);
    };

    const changeColor = (key) => {
        setSelectedColorKey(key);
        localStorage.setItem('theme-color-key', key);
        handleColorMenuClose();
    };

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('dark-mode', next);
            return next;
        });
    };

    const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light', THEME_COLORS[selectedColorKey]), [darkMode, selectedColorKey]);

    const location = useLocation();
    const path = location.pathname;

    // Route Matching Logic
    const isOptimizer = path === '/' || path === '/loadout' || path.startsWith('/loadout/');
    const loadoutMatch = useMatch('/loadout/:itemlist');
    const loadoutParams = loadoutMatch ? loadoutMatch.params.itemlist?.split('&') : undefined;

    const isAugment = path.startsWith('/augment');
    const isNGUs = path.startsWith('/ngus');
    const isHacks = path.startsWith('/hacks');
    const isWishes = path.startsWith('/wishes');

    const [visited, setVisited] = React.useState({
        optimizer: true,
        augment: false,
        ngus: false,
        hacks: false,
        wishes: false
    });

    React.useEffect(() => {
        if (isAugment && !visited.augment) setVisited(v => ({ ...v, augment: true }));
        if (isNGUs && !visited.ngus) setVisited(v => ({ ...v, ngus: true }));
        if (isHacks && !visited.hacks) setVisited(v => ({ ...v, hacks: true }));
        if (isWishes && !visited.wishes) setVisited(v => ({ ...v, wishes: true }));
    }, [isAugment, isNGUs, isHacks, isWishes, visited]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <DarkModeContext.Provider value={darkMode}>
                <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                    <CookieBanner
                        styles={{
                            banner: { height: 'auto', zIndex: 9999 },
                            message: { fontWeight: 400 }
                        }}
                        message='This page wants to use local storage and a cookie to respectively keep track of your configuration and consent.'
                    />

                    {/* SIDEBAR */}
                    <Drawer
                        variant="permanent"
                        sx={{
                            width: DRAWER_WIDTH,
                            flexShrink: 0,
                            '& .MuiDrawer-paper': {
                                width: DRAWER_WIDTH,
                                boxSizing: 'border-box',
                                borderRight: 'none',
                                background: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : alpha('#fff', 0.8), // Custom glass for sidebar
                            },
                        }}
                    >
                        {/* HEADER / LOGO */}
                        <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar variant="rounded" sx={{ bgcolor: 'primary.main', boxShadow: 3 }}>
                                <SettingsSuggest />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight={700} lineHeight={1}>
                                    Gear
                                </Typography>
                                <Typography variant="caption" sx={{ letterSpacing: 1, opacity: 0.7 }}>
                                    OPTIMIZER
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 2, mx: 3, opacity: 0.1 }} />

                        {/* NAV ITEMS */}
                        <List component="nav">
                            <NavItem to="/" label="Gear Loadout" icon={<SettingsSuggest />} isActive={location.pathname === '/' || location.pathname.startsWith('/loadout')} />
                            <NavItem to="/augment" label="Augments" icon={<TrendingUp />} isActive={location.pathname.startsWith('/augment')} />
                            <NavItem to="/ngus" label="NGUs" icon={<FlashOn />} isActive={location.pathname.startsWith('/ngus')} />
                            <NavItem to="/hacks" label="Hacks" icon={<Code />} isActive={location.pathname.startsWith('/hacks')} />
                            <NavItem to="/wishes" label="Wishes" icon={<Star />} isActive={location.pathname.startsWith('/wishes')} />
                        </List>

                        <Box sx={{ flexGrow: 1 }} />

                        {/* FOOTER ACTIONS */}
                        <Box sx={{ p: 2 }}>
                            <Box sx={{
                                p: 2,
                                borderRadius: 4,
                                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5), // Safely use paper color
                                display: 'flex',
                                justifyContent: 'space-around',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Tooltip title="Change Color">
                                    <IconButton onClick={handleColorMenuOpen} size="small">
                                        <Palette fontSize="small" color="primary" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Toggle Theme">
                                    <IconButton onClick={toggleDarkMode} size="small">
                                        {darkMode ? <Brightness7 fontSize="small" color="primary" /> : <Brightness4 fontSize="small" color="primary" />}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="GitHub">
                                    <IconButton component={Link} href="https://github.com/postEntropy/gear-optimizer" target="_blank" size="small">
                                        <GitHub fontSize="small" color="primary" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Drawer>

                    {/* MAIN CONTENT */}
                    <Box component="main" sx={{
                        flexGrow: 1,
                        p: 3,
                        pb: 10,
                        width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                        display: 'flex',
                        flexDirection: 'column',
                        // Optional: Separate scroll for content if fixed sidebar
                        height: '100vh',
                        overflowY: 'auto'
                    }}>
                        <Box sx={{ maxWidth: 1600, width: '100%', mx: 'auto' }}>
                            {React.useMemo(() => (
                                <>
                                    <Box sx={{ display: isOptimizer ? 'block' : 'none', ...fadeAnimation }}>
                                        <Optimizer {...props} loadLoadout={loadoutParams} className='app_body' />
                                    </Box>
                                    <Box sx={{ display: isAugment ? 'block' : 'none', ...fadeAnimation }}>
                                        {(visited.augment || isAugment) && <Augment {...props} className='app_body' />}
                                    </Box>
                                    <Box sx={{ display: isNGUs ? 'block' : 'none', ...fadeAnimation }}>
                                        {(visited.ngus || isNGUs) && <NGUComponent {...props} className='app_body' />}
                                    </Box>
                                    <Box sx={{ display: isHacks ? 'block' : 'none', ...fadeAnimation }}>
                                        {(visited.hacks || isHacks) && <HackComponent {...props} className='app_body' />}
                                    </Box>
                                    <Box sx={{ display: isWishes ? 'block' : 'none', ...fadeAnimation }}>
                                        {(visited.wishes || isWishes) && <WishComponent {...props} className='app_body' />}
                                    </Box>
                                </>
                            ), [props, isOptimizer, isAugment, isNGUs, isHacks, isWishes, loadoutParams, visited])}
                        </Box>
                    </Box>

                    {/* Color Menu (Kept same logic) */}
                    <Menu
                        anchorEl={anchorEl}
                        open={colorMenuOpen}
                        onClose={handleColorMenuClose}
                        PaperProps={{ sx: { borderRadius: 3, mt: 1 } }}
                    >
                        {Object.values(THEME_COLORS).map((color) => (
                            <MenuItem key={color.key} onClick={() => changeColor(color.key)} selected={selectedColorKey === color.key}>
                                <ListItemIcon>
                                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: color.main, border: '1px solid', borderColor: 'divider' }} />
                                </ListItemIcon>
                                <ListItemText>{color.name}</ListItemText>
                            </MenuItem>
                        ))}
                    </Menu>

                </Box>
            </DarkModeContext.Provider>
        </ThemeProvider >
    );
};

export default AppLayout;
