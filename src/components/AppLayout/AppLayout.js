import React, { useMemo } from 'react';
import CookieBanner from 'react-cookie-banner';
import { HashRouter, NavLink, Route, Routes, useParams, useLocation, useMatch } from 'react-router-dom';
import ReactGA from 'react-ga';

import {
    alpha,
    AppBar,
    Toolbar,
    Button,
    Container,
    CssBaseline,
    ThemeProvider,
    Box,
    Typography,
    IconButton,
    useMediaQuery,
    Link,
    List,
    ListItem,
    ListItemText,
    Paper,
    CircularProgress
} from '@mui/material';
import { Brightness4, Brightness7, ColorLens, GitHub } from '@mui/icons-material';
import { Menu, MenuItem, ListItemIcon } from '@mui/material';



import DarkModeContext from './DarkModeContext';
import getTheme from '../../theme';
import { THEME_COLORS } from '../../themeColors';



const Loadout = (props) => {
    let { itemlist } = useParams();
    const items = itemlist ? itemlist.split('&') : [];
    // We need to pass route props manually if Optimizer expects them, 
    // but v6 uses hooks. We'll pass the list as a prop.
    return <Optimizer {...props} loadLoadout={items} className='app_body' />;
}

const NavButton = ({ to, label, buttonRef, isActive }) => {
    return (
        <Button
            ref={buttonRef}
            component={NavLink}
            to={to}
            color={isActive ? "primary" : "inherit"}
            variant="text" // Always text variant, pill handles background
            disableRipple
            sx={{
                mx: 0,
                borderRadius: 24,
                minWidth: 'auto',
                px: 2,
                whiteSpace: 'nowrap',
                zIndex: 1, // Above pill
                transition: 'color 0.2s',
                color: isActive ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                    bgcolor: 'transparent' // Let pill handle hover visuals or keep simple
                }
            }}
        >
            {label}
        </Button>
    );
};

const Optimizer = React.lazy(() => import('../Content/Optimizer'));
const Augment = React.lazy(() => import('../Content/Augment'));
const NGUComponent = React.lazy(() => import('../Content/NGUs'));
const HackComponent = React.lazy(() => import('../Content/Hacks'));
const WishComponent = React.lazy(() => import('../Content/Wishes'));
const AboutComponent = React.lazy(() => import('../About/About')); // Also lazy load About

import Loading from '../Loading/Loading';

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

    // KeepAlive & Animation Logic
    const location = useLocation();
    const path = location.pathname;

    // Tab Visibility Flags
    const isOptimizer = path === '/' || path === '/loadout' || path.startsWith('/loadout/');
    const loadoutMatch = useMatch('/loadout/:itemlist');
    const loadoutParams = loadoutMatch ? loadoutMatch.params.itemlist?.split('&') : undefined;

    const isAugment = path.startsWith('/augment');
    const isNGUs = path.startsWith('/ngus');
    const isHacks = path.startsWith('/hacks');
    const isWishes = path.startsWith('/wishes');

    // Track visited tabs for Lazy KeepAlive
    const [visited, setVisited] = React.useState({
        optimizer: true, // Always load home
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

    // Animation Logic for Nav Pill
    const [pillStyle, setPillStyle] = React.useState({ left: 0, width: 0, opacity: 0 });
    const navRefs = React.useRef({});

    React.useLayoutEffect(() => {
        const activePath = ['/augment', '/ngus', '/hacks', '/wishes'].find(path => location.pathname.startsWith(path)) || '/';
        const activeEl = navRefs.current[activePath];

        if (activeEl) {
            setPillStyle({
                left: activeEl.offsetLeft,
                width: activeEl.clientWidth,
                opacity: 1
            });
        }
    }, [location.pathname]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <DarkModeContext.Provider value={darkMode}>
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <CookieBanner
                        styles={{
                            banner: { height: 'auto', zIndex: 9999 },
                            message: { fontWeight: 400 }
                        }}
                        message='This page wants to use local storage and a cookie to respectively keep track of your configuration and consent.'
                    />

                    <Box component="main" sx={{ flexGrow: 1, p: 1, pb: 10, display: 'flex', flexDirection: 'column' }}>
                        {React.useMemo(() => (
                            <React.Suspense fallback={<Loading />}>
                                {/* Optimizer / Loadout Tab - Persistent */}
                                <Box sx={{ display: isOptimizer ? 'block' : 'none', height: '100%' }}>
                                    <Optimizer {...props} loadLoadout={loadoutParams} className='app_body' />
                                </Box>

                                {/* Augment Tab - Persistent */}
                                <Box sx={{ display: isAugment ? 'block' : 'none', height: '100%' }}>
                                    {(visited.augment || isAugment) && <Augment {...props} className='app_body' />}
                                </Box>

                                {/* NGUs Tab - Persistent */}
                                <Box sx={{ display: isNGUs ? 'block' : 'none', height: '100%' }}>
                                    {(visited.ngus || isNGUs) && <NGUComponent {...props} className='app_body' />}
                                </Box>

                                {/* Hacks Tab - Persistent */}
                                <Box sx={{ display: isHacks ? 'block' : 'none', height: '100%' }}>
                                    {(visited.hacks || isHacks) && <HackComponent {...props} className='app_body' />}
                                </Box>

                                {/* Wishes Tab - Persistent */}
                                <Box sx={{ display: isWishes ? 'block' : 'none', height: '100%' }}>
                                    {(visited.wishes || isWishes) && <WishComponent {...props} className='app_body' />}
                                </Box>
                            </React.Suspense>
                        ), [props, isOptimizer, isAugment, isNGUs, isHacks, isWishes, loadoutParams, visited])}
                    </Box>

                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1200,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            width: 'fit-content',
                            maxWidth: '95vw',
                        }}
                    >
                        {/* Navigation Pill */}
                        <Paper
                            elevation={12}
                            sx={{
                                borderRadius: 50,
                                px: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                overflowX: 'auto',
                                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.7), // Semi-transparent for glass effect
                                backdropFilter: 'blur(16px)', // The "Glassmorphism"
                                border: '1px solid',
                                borderColor: 'divider',
                                height: 48,
                                position: 'relative' // Needed for absolute positioning of the ghost pill
                            }}
                        >
                            {/* Ghost Pill Indicator */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    height: 36,
                                    borderRadius: 24,
                                    bgcolor: 'primary.main',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    zIndex: 0,
                                    ...pillStyle
                                }}
                            />

                            <NavButton to="/" label="Gear" buttonRef={el => navRefs.current['/'] = el} isActive={location.pathname === '/'} />
                            <NavButton to="/augment" label="Augments" buttonRef={el => navRefs.current['/augment'] = el} isActive={location.pathname.startsWith('/augment')} />
                            <NavButton to="/ngus" label="NGUs" buttonRef={el => navRefs.current['/ngus'] = el} isActive={location.pathname.startsWith('/ngus')} />
                            <NavButton to="/hacks" label="Hacks" buttonRef={el => navRefs.current['/hacks'] = el} isActive={location.pathname.startsWith('/hacks')} />
                            <NavButton to="/wishes" label="Wishes" buttonRef={el => navRefs.current['/wishes'] = el} isActive={location.pathname.startsWith('/wishes')} />
                        </Paper>

                        {/* Theme/Settings Pill */}
                        <Paper
                            elevation={12}
                            sx={{
                                borderRadius: 50,
                                px: 2, // Slightly more padding for the smaller separate pill
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.7),
                                backdropFilter: 'blur(16px)',
                                border: '1px solid',
                                borderColor: 'divider',
                                height: 48 // Match nav pill height
                            }}
                        >
                            <IconButton onClick={handleColorMenuOpen} color="inherit" size="small">
                                <ColorLens fontSize="medium" sx={{ color: theme.palette.primary.main }} />
                            </IconButton>

                            <IconButton
                                component={Link}
                                href="https://github.com/postEntropy/gear-optimizer"
                                target="_blank"
                                rel="noopener noreferrer"
                                color="inherit"
                                size="small"
                                sx={{ ml: 0.5 }}
                            >
                                <GitHub fontSize="small" sx={{ color: theme.palette.primary.main }} />
                            </IconButton>

                            <IconButton onClick={toggleDarkMode} color="inherit" size="small" sx={{ ml: 0.5 }}>
                                {darkMode ?
                                    <Brightness7 fontSize="small" sx={{ color: theme.palette.primary.main }} /> :
                                    <Brightness4 fontSize="small" sx={{ color: theme.palette.primary.main }} />
                                }
                            </IconButton>

                            <Menu
                                anchorEl={anchorEl}
                                open={colorMenuOpen}
                                onClose={handleColorMenuClose}
                                PaperProps={{
                                    sx: { borderRadius: 3, mb: 1 }
                                }}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'center',
                                }}
                                transformOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'center',
                                }}
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
                        </Paper>
                    </Box>
                </Box>
            </DarkModeContext.Provider>
        </ThemeProvider >
    );
};

export default AppLayout;
