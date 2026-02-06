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
    Star, // Wishes
    History, // Rebirth History
    ChevronLeft,

    ChevronRight
} from '@mui/icons-material';
import { Menu, MenuItem } from '@mui/material';

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
import HistoryComponent from '../Content/History';
// import AboutComponent from '../About/About';


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
                PaperProps={{ sx: { borderRadius: 3, mt: 1 } }}
            >
                {Object.values(THEME_COLORS).map((color) => (
                    <MenuItem
                        key={color.key}
                        onClick={() => {
                            changeColor(color.key);
                            handleColorMenuClose();
                        }}
                        selected={selectedColorKey === color.key}
                    >
                        <ListItemIcon>
                            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: color.main, border: '1px solid', borderColor: 'divider' }} />
                        </ListItemIcon>
                        <ListItemText>{color.name}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
});

// ISOLATED Page Content to prevent re-renders when sidebar toggles
const PageContent = React.memo(({ isOptimizer, isAugment, isNGUs, isHacks, isWishes, isHistory, props, loadoutParams, visited, fadeAnimation }) => {
    return (
        <Box sx={{ maxWidth: 1600, width: '100%', mx: 'auto' }}>
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
            <Box sx={{ display: isHistory ? 'block' : 'none', ...fadeAnimation }}>
                {(visited.history || isHistory) && <HistoryComponent {...props} className='app_body' />}
            </Box>
        </Box>
    );
});

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

    const [visited, setVisited] = React.useState({
        optimizer: true,
        augment: false,
        ngus: false,
        hacks: false,
        wishes: false,
        history: false
    });

    React.useEffect(() => {
        if (isAugment && !visited.augment) setVisited(v => ({ ...v, augment: true }));
        if (isNGUs && !visited.ngus) setVisited(v => ({ ...v, ngus: true }));
        if (isHacks && !visited.hacks) setVisited(v => ({ ...v, hacks: true }));
        if (isWishes && !visited.wishes) setVisited(v => ({ ...v, wishes: true }));
        if (isHistory && !visited.history) setVisited(v => ({ ...v, history: true }));
    }, [isAugment, isNGUs, isHacks, isWishes, isHistory, visited]);


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
                                borderRight: 'none',
                                backdropFilter: 'blur(10px)',
                                background: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : alpha('#fff', 0.8),
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
                            <NavItem open={open} to="/history" label="History" icon={<History />} isActive={location.pathname.startsWith('/history')} />
                        </List>


                        <Box sx={{ flexGrow: 1 }} />

                        {/* FOOTER ACTIONS */}
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
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
                            props={props}
                            loadoutParams={loadoutParams}
                            visited={visited}
                            fadeAnimation={fadeAnimation}
                        />
                    </Box>


                </Box>
            </DarkModeContext.Provider>
        </ThemeProvider >
    );
};

export default AppLayout;
