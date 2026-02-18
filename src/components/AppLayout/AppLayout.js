import React, { useMemo } from 'react';
import CookieBanner from 'react-cookie-banner';
import { NavLink, useLocation, useMatch, useParams } from 'react-router-dom';

import { alpha, Box, CssBaseline, ThemeProvider, Typography, IconButton, useMediaQuery, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Drawer, Tooltip, Divider, Avatar } from '@mui/material';
import { Brightness4, Brightness7, Palette, GitHub, SettingsSuggest, TrendingUp, FlashOn, Code, Star, History, ChevronLeft, ChevronRight, CardGiftcard, AutoAwesome, Settings as SettingsIcon } from '@mui/icons-material';
import { Menu, MenuItem } from '@mui/material';

import { allowed_zone, get_limits } from '../../util';
import DarkModeContext from './DarkModeContext';
import getTheme from '../../theme';
import { THEME_COLORS } from '../../themeColors';
import Loading from '../Loading/Loading';
import LiveSyncPill from '../LiveSyncPill/LiveSyncPill';

// Static Imports for Instant Navigation
import Optimizer from '../Content/Optimizer';
import Augment from '../Content/Augment';
import NGUComponent from '../Content/NGUs';
import HackComponent from '../Content/Hacks';
import WishComponent from '../Content/Wishes';
import HistoryComponent from '../Content/History/index';
import PerksComponent from '../Perks/Perks';
import SettingsComponent from '../Content/Settings';

import AdvancedTrainingCalculator from '../Content/AdvancedTrainingCalculator';
// import AboutComponent from '../About/About';

// Import images logic (matching Item.js behavior)
const glob = import.meta.glob('../../assets/img/*.{png,jpg,jpeg,svg}', { eager: true });
const images = Object.fromEntries(
    Object.entries(glob).map(([path, module]) => {
        const fileName = path.split('/').pop().replace(/\.[^/.]+$/, '');
        return [fileName, module.default];
    })
);

const DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 80;

// Simple Fade Animation
const fadeAnimation = {
    animation: 'fadeIn 0.3s ease-in-out',
    '@keyframes fadeIn': {
        '0%': { opacity: 0, transform: 'translateY(10px)' },
        '100%': { opacity: 1, transform: 'translateY(0)' },
    }
};

// Memoized NavItem to prevent re-renders unless essential props change
const NavItem = React.memo(({ to, label, icon, isActive, open }) => {
    return (
        <ListItem disablePadding sx={{ mb: 0.5, display: 'block' }}>
            <Tooltip title={!open ? label : ""} placement="right">
                <ListItemButton
                    component={NavLink}
                    to={to}
                    selected={isActive}
                    sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        borderRadius: '12px',
                        mx: 1,
                        px: 2.5,
                        '&.active': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            '& .MuiListItemIcon-root': {
                                color: 'primary.contrastText',
                            }
                        }
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: open ? 2 : 'auto',
                            justifyContent: 'center',
                            color: isActive ? 'inherit' : 'text.secondary'
                        }}
                    >
                        {icon}
                    </ListItemIcon>
                    {open && (
                        <ListItemText
                            primary={label}
                            primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.9rem' }}
                        />
                    )}
                </ListItemButton>
            </Tooltip>
        </ListItem>
    );
});

// ISOLATED ThemeSwitcher component
const ThemeSwitcher = React.memo(({ darkMode, toggleDarkMode, selectedColorKey, changeColor, open }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const colorMenuOpen = Boolean(anchorEl);

    const handleColorMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleColorMenuClose = () => setAnchorEl(null);

    return (
        <>
            <Box sx={{
                p: 1,
                borderRadius: 4,
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
                display: 'flex',
                flexDirection: open ? 'row' : 'column',
                justifyContent: 'space-around',
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: 'divider',
                width: '100%',
                gap: 1
            }}>
                <Tooltip title="Change Color" placement="right">
                    <IconButton onClick={handleColorMenuOpen} size="small">
                        <Palette fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Toggle Theme" placement="right">
                    <IconButton onClick={toggleDarkMode} size="small">
                        {darkMode ? <Brightness7 fontSize="small" color="primary" /> : <Brightness4 fontSize="small" color="primary" />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="GitHub" placement="right">
                    <IconButton component={Link} href="https://github.com/postEntropy/gear-optimizer" target="_blank" size="small">
                        <GitHub fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={colorMenuOpen}
                onClose={handleColorMenuClose}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        mt: 1,
                        minWidth: 220,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundImage: 'none'
                    }
                }}
            >
                <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        Theme Colors
                    </Typography>
                </Box>
                <Divider />
                {Object.values(THEME_COLORS).map((color) => {
                    const isSelected = selectedColorKey === color.key;
                    return (
                        <MenuItem
                            key={color.key}
                            onClick={() => {
                                changeColor(color.key);
                                handleColorMenuClose();
                            }}
                            selected={isSelected}
                            sx={{
                                py: 1.2,
                                px: 2,
                                gap: 2,
                                '&.Mui-selected': {
                                    bgcolor: alpha(color.main, 0.12),
                                    '&:hover': { bgcolor: alpha(color.main, 0.2) }
                                }
                            }}
                        >
                            <Box sx={{
                                width: 18,
                                height: 18,
                                borderRadius: 1.5,
                                bgcolor: color.main,
                                border: '1px solid',
                                borderColor: 'divider',
                                flexShrink: 0
                            }} />
                            <ListItemText
                                primary={color.name}
                                primaryTypographyProps={{
                                    fontWeight: isSelected ? 700 : 400,
                                    fontSize: '0.85rem'
                                }}
                            />
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
});

// IMPROVED Page Content: Unmount inactive pages for performance
const PageContent = React.memo(({ isOptimizer, isAugment, isNGUs, isHacks, isWishes, isHistory, isPerks, isSettings, isAdvancedTraining, props, loadoutParams, fadeAnimation }) => {
    return (
        <Box sx={{ maxWidth: 1600, width: '100%', mx: 'auto', ...fadeAnimation }}>
            {isOptimizer && <Optimizer {...props} loadLoadout={loadoutParams} className='app_body' />}
            {isAugment && <Augment {...props} className='app_body' />}
            {isNGUs && <NGUComponent {...props} className='app_body' />}
            {isHacks && <HackComponent {...props} className='app_body' />}
            {isWishes && <WishComponent {...props} className='app_body' />}
            {isHistory && <HistoryComponent {...props} className='app_body' />}
            {isPerks && <PerksComponent {...props} className='app_body' />}
            {isSettings && <SettingsComponent {...props} className='app_body' />}
            {isAdvancedTraining && <AdvancedTrainingCalculator {...props} className='app_body' />}
        </Box>
    );
});

const LOGO_CANDIDATES = [
    "Crappy Helmet", "Forest Helmet", "Blue Cheese Helmet", "Cloth Hat",
    "Magitech Helmet", "Chef's Hat", "Clockwork Hat", "Circle Helmet",
    "Spoopy Helmet", "Office Hat", "Gaudy Hat", "Mega Helmet",
    "Groucho Marx Disguise", "Wanderer's Hat", "taH s'rerednaW",
    "Badly Drawn Smiley Face", "Stealthy Hat", "Slimy Helmet",
    "Looty McLootFace", "Sir Looty McLootington III, Esquire", "King Looty",
    "Emperor Looty", "GALACTIC HERALD LOOTY", "SUPREME INTELLIGENCE LOOTY",
    "Forest Pendant", "Ascended Forest Pendant", "Ascended Ascended Forest Pendant",
    "Ascended Ascended Ascended Pendant", "Ascended x4 Pendant", "Ascended x5 Pendant",
    "My Red Heart 3", "My Blue Heart 3", "My Yellow Heart 3", "My Green Heart 3",
    "My Purple Heart 3", "My Brown Heart 3", "My Pink Heart 3", "My Rainbow Heart",
    "THE MALF SLAMMER", "The D20", "The D8", "The Godmother's Ring", "The Lonely Flubber"
];

const AppLayout = (props) => {
    // Random Icon Logic
    const randomIcon = React.useMemo(() => {
        let keys = Object.keys(images).filter(k => LOGO_CANDIDATES.includes(k));

        if (props.randomLogoFilterOwned) {
            const limits = get_limits(props);
            keys = keys.filter(k => {
                // Fuzzy search to match "My Pink Heart 3" with "My Pink Heart <3"
                const searchKey = k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const item = props.itemdata[k] || Object.values(props.itemdata).find(i =>
                    i.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === searchKey
                );

                if (!item || item.disable || item.id >= 10000) return false;
                return allowed_zone(props.itemdata, limits, item.id);
            });
        }

        if (keys.length === 0) {
            // Strict fallback: only use images we KNOW are candidates and exist
            const fallbackKey = LOGO_CANDIDATES.find(c => images[c]) || Object.keys(images)[0];
            return images[fallbackKey];
        }
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return images[randomKey];
    }, [props.itemdata, props.randomLogoFilterOwned]);

    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [darkMode, setDarkMode] = React.useState(() => {
        const saved = localStorage.getItem('dark-mode');
        return saved !== null ? saved === 'true' : prefersDarkMode;
    });
    const [selectedColorKey, setSelectedColorKey] = React.useState(() => {
        const saved = localStorage.getItem('theme-color-key');
        return saved && THEME_COLORS[saved] ? saved : 'NOVA';
    });

    const [open, setOpen] = React.useState(true);

    const toggleDrawer = () => {
        setOpen(!open);
    };

    const toggleDarkMode = React.useCallback(() => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('dark-mode', next);
            return next;
        });
    }, []);

    const changeColor = React.useCallback((key) => {
        setSelectedColorKey(key);
        localStorage.setItem('theme-color-key', key);
    }, []);

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
    const isHistory = path.startsWith('/history');
    const isPerks = path.startsWith('/perks');
    const isAdvancedTraining = path.startsWith('/advanced-training-calculator');
    const isSettings = path.startsWith('/settings');




    const currentDrawerWidth = open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <DarkModeContext.Provider value={darkMode}>
                <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
                    <Box className="scanline" />
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
                            width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                            boxSizing: 'border-box',
                            '& .MuiDrawer-paper': {
                                width: open ? DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
                                transition: theme.transitions.create('width', {
                                    easing: theme.transitions.easing.sharp,
                                    duration: theme.transitions.duration.shorter,
                                }),
                                overflowX: 'hidden',
                                borderRight: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                backdropFilter: 'blur(12px)',
                                boxShadow: theme.palette.mode === 'dark'
                                    ? '10px 0 30px -10px rgba(0,0,0,0.6)'
                                    : '10px 0 30px -10px rgba(0,0,0,0.08)',
                                background: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.6) : alpha('#fff', 0.85),
                            },
                        }}
                    >
                        {/* HEADER / LOGO */}
                        <Box sx={{
                            minHeight: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: open ? 'space-between' : 'center',
                            px: 2.5,
                            py: 2
                        }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                opacity: open ? 1 : 0,
                                width: open ? 'auto' : 0,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                            }}>
                                <Avatar
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        width: 44,
                                        height: 44,
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}
                                >
                                    <img src={randomIcon} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </Avatar>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 0.75, m: 0 }}>
                                        Gear
                                    </Typography>
                                    <Typography variant="caption" sx={{ letterSpacing: 1.5, opacity: 0.8, fontSize: '0.65rem', fontWeight: 700, mt: -0.4 }}>
                                        OPTIMIZER
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton onClick={toggleDrawer}>
                                    {open ? <ChevronLeft /> : <ChevronRight />}
                                </IconButton>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 2, mx: 3, opacity: 0.1 }} />

                        {/* NAV ITEMS */}
                        <List component="nav">
                            <NavItem open={open} to="/" label="Gear Loadout" icon={<SettingsSuggest />} isActive={location.pathname === '/' || location.pathname.startsWith('/loadout')} />
                            <NavItem open={open} to="/augment" label="Augments" icon={<TrendingUp />} isActive={location.pathname.startsWith('/augment')} />
                            <NavItem open={open} to="/ngus" label="NGUs" icon={<FlashOn />} isActive={location.pathname.startsWith('/ngus')} />
                            <NavItem open={open} to="/hacks" label="Hacks" icon={<Code />} isActive={location.pathname.startsWith('/hacks')} />
                            <NavItem open={open} to="/wishes" label="Wishes" icon={<Star />} isActive={location.pathname.startsWith('/wishes')} />
                            <NavItem open={open} to="/perks" label="Perks" icon={<CardGiftcard />} isActive={location.pathname.startsWith('/perks')} />
                            <NavItem open={open} to="/advanced-training-calculator" label="Adv. Training" icon={<AutoAwesome />} isActive={location.pathname.startsWith('/advanced-training-calculator')} />
                            <NavItem open={open} to="/history" label="History" icon={<History />} isActive={location.pathname.startsWith('/history')} />
                        </List>


                        <Box sx={{ flexGrow: 1 }} />

                        {/* FOOTER ACTIONS */}
                        <Box sx={{ p: 2, pb: 1, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
                            <Box sx={{ width: '100%', px: open ? 1 : 0, display: 'flex', justifyContent: 'center' }}>
                                <LiveSyncPill collapsed={!open} />
                            </Box>
                            <ThemeSwitcher
                                darkMode={darkMode}
                                toggleDarkMode={toggleDarkMode}
                                selectedColorKey={selectedColorKey}
                                changeColor={changeColor}
                                open={open}
                            />
                        </Box>

                        <Divider sx={{ mx: 3, opacity: 0.1 }} />
                        <List component="nav" sx={{ py: 1 }}>
                            <NavItem open={open} to="/settings" label="Settings" icon={<SettingsIcon />} isActive={location.pathname.startsWith('/settings')} />
                        </List>
                    </Drawer>

                    {/* MAIN CONTENT AREA */}
                    <Box component="main" sx={{
                        flexGrow: 1,
                        width: '100%',
                        overflowX: 'hidden',
                        height: '100vh',
                        overflowY: 'auto',
                        p: 3,
                        pb: 10,
                    }}>
                        <PageContent
                            isOptimizer={isOptimizer}
                            isAugment={isAugment}
                            isNGUs={isNGUs}
                            isHacks={isHacks}
                            isWishes={isWishes}
                            isHistory={isHistory}
                            isPerks={isPerks}
                            isAdvancedTraining={isAdvancedTraining}
                            isSettings={isSettings}
                            props={props}
                            loadoutParams={loadoutParams}
                            fadeAnimation={fadeAnimation}
                        />
                    </Box>


                </Box>
            </DarkModeContext.Provider>
        </ThemeProvider >
    );
};

export default AppLayout;
