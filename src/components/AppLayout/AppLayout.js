import React, { useMemo } from 'react';
import CookieBanner from 'react-cookie-banner';
import { HashRouter, NavLink, Route, Routes, useParams, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga';

import {
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
    Paper
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

import Optimizer from '../Content/Optimizer';
import Augment from '../Content/Augment';
import NGUComponent from '../Content/NGUs';
import HackComponent from '../Content/Hacks';
import WishComponent from '../Content/Wishes';
import AboutComponent from '../About/About';

import DarkModeContext from './DarkModeContext';
import getTheme from '../../theme';

function HowTo() {
    ReactGA.pageview('/howto');
    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>How to use the gear optimizer:</Typography>
                <List dense>
                    <ListItem>
                        <ListItemText primary="1. Perform the global item setup based on game progress."
                            secondary="Select highest zone, titan version, looty, pendant, accessory slots." />
                    </ListItem>
                    <ListItem>
                        <ListItemText primary="2. Perform additional custom item configuration in the item list."
                            secondary="Right click to edit, click to equip. Shift-click/Ctrl-click shortcuts available." />
                    </ListItem>
                    <ListItem>
                        <ListItemText primary="3. Configure base Power / Toughness and priorities." />
                    </ListItem>
                    <ListItem>
                        <ListItemText primary="4. Click 'Optimize Gear' to compute optimal loadout." />
                    </ListItem>
                </List>

                <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>Other Calculators</Typography>
                <Typography variant="body1">
                    Use the tabs to navigate to Augments, NGUs, Hacks, and Wishes calculators. Each has its own specific inputs.
                </Typography>
            </Paper>
        </Container>
    );
}

const Loadout = (props) => {
    let { itemlist } = useParams();
    const items = itemlist ? itemlist.split('&') : [];
    // We need to pass route props manually if Optimizer expects them, 
    // but v6 uses hooks. We'll pass the list as a prop.
    return <Optimizer {...props} loadLoadout={items} className='app_body' />;
}

const NavButton = ({ to, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

    return (
        <Button
            component={NavLink}
            to={to}
            color={isActive ? "primary" : "inherit"}
            variant={isActive ? "contained" : "text"}
            disableElevation
            sx={{ mx: 0.2, borderRadius: 50, minWidth: 'auto', px: 2, whiteSpace: 'nowrap' }}
        >
            {label}
        </Button>
    );
};

const AppLayout = (props) => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [darkMode, setDarkMode] = React.useState(() => {
        const saved = localStorage.getItem('dark-mode');
        return saved !== null ? saved === 'true' : prefersDarkMode;
    });

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('dark-mode', next);
            return next;
        });
    };

    const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <DarkModeContext.Provider value={darkMode}>
                <HashRouter>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                        <CookieBanner
                            styles={{
                                banner: { height: 'auto', zIndex: 9999 },
                                message: { fontWeight: 400 }
                            }}
                            message='This page wants to use local storage and a cookie to respectively keep track of your configuration and consent.'
                        />

                        <Box component="main" sx={{ flexGrow: 1, p: 1, pb: 10 }}>
                            <Routes>
                                <Route path="/" element={<Optimizer {...props} className='app_body' />} />
                                <Route path="/loadout" element={<Optimizer {...props} className='app_body' />} />
                                <Route path="/loadout/:itemlist" element={<Loadout {...props} />} />
                                <Route path="/howto" element={<HowTo />} />
                                <Route path="/augment" element={<Augment {...props} className='app_body' />} />
                                <Route path="/ngus" element={<NGUComponent {...props} className='app_body' />} />
                                <Route path="/hacks" element={<HackComponent {...props} className='app_body' />} />
                                <Route path="/wishes" element={<WishComponent {...props} className='app_body' />} />

                            </Routes>
                        </Box>

                        <Paper
                            elevation={12}
                            sx={{
                                position: 'fixed',
                                bottom: 24,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                borderRadius: 50,
                                px: 1,
                                py: 0.5,
                                zIndex: 1200,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                width: 'fit-content',
                                maxWidth: '95vw',
                                overflowX: 'auto',
                                backgroundColor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <NavButton to="/" label="Gear" />
                            <NavButton to="/augment" label="Augments" />
                            <NavButton to="/ngus" label="NGUs" />
                            <NavButton to="/hacks" label="Hacks" />
                            <NavButton to="/wishes" label="Wishes" />
                            <NavButton to="/howto" label="How to" />

                            <IconButton onClick={toggleDarkMode} color="primary" sx={{ ml: 0.5 }}>
                                {darkMode ? <Brightness7 /> : <Brightness4 />}
                            </IconButton>
                        </Paper>
                    </Box>
                </HashRouter>
            </DarkModeContext.Provider>
        </ThemeProvider>
    );
};

export default AppLayout;

