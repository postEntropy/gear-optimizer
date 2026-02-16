import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Switch,
    FormControlLabel,
    TextField,
    Divider,
    alpha,
    useTheme,
    Grid,
    Tooltip,
    Link
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Person as PersonIcon,
    Wallpaper as WallpaperIcon,
    Info as InfoIcon,
    Storage as StorageIcon,
    AutoAwesome as GeminiIcon
} from '@mui/icons-material';

const Settings = (props) => {
    const theme = useTheme();
    const {
        playerName,
        randomLogoFilterOwned,
        handleSettings,
        highlightBest
    } = props;

    const handleChange = (name) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        handleSettings(name, value);
    };

    const sectionHeaderStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        mb: 3,
        mt: 2,
        color: theme.palette.primary.main
    };

    const cardStyle = {
        p: 3,
        borderRadius: 4,
        background: alpha(theme.palette.background.paper, 0.4),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        height: '100%'
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 5, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                }}>
                    User Settings
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Customize your experience and preferences
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Profile & AI Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={cardStyle}>
                        <Box sx={sectionHeaderStyle}>
                            <PersonIcon />
                            <Typography variant="h6" fontWeight={700}>Profile & AI</Typography>
                        </Box>
                        <TextField
                            fullWidth
                            label="Player Name"
                            variant="outlined"
                            value={playerName || ''}
                            onChange={handleChange('playerName')}
                            placeholder="Enter your name"
                            sx={{ mt: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1, mt: 0.5, mb: 3 }}>
                            Your name will appear on shared Build Cards and loadouts.
                        </Typography>

                    </Paper>
                </Grid>

                {/* Appearance/Logo Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={cardStyle}>
                        <Box sx={sectionHeaderStyle}>
                            <WallpaperIcon />
                            <Typography variant="h6" fontWeight={700}>Visuals</Typography>
                        </Box>
                        <Box sx={{ mt: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={props.showGraphs ?? true}
                                        onChange={handleChange('showGraphs')}
                                        color="primary"
                                    />
                                }
                                label="Show NGU / Hack Charts"
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mt: -0.5 }}>
                                Enable or disable the charts and projection graphs shown in NGU and Hack pages.
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 1.5 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={randomLogoFilterOwned}
                                        onChange={handleChange('randomLogoFilterOwned')}
                                        color="primary"
                                    />
                                }
                                label="Owned Items Only"
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mt: -0.5 }}>
                                Sidebar and Build Card logos will only show items you have collected.
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 1.5 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={props.highlightEquipped ?? true}
                                        onChange={handleChange('highlightEquipped')}
                                        color="primary"
                                    />
                                }
                                label="Highlight Equipped Items"
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mt: -0.5 }}>
                                Shows a green glow around gear that is currently equipped.
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 1.5 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={props.highlightBest || false}
                                        onChange={handleChange('highlightBest')}
                                        color="primary"
                                    />
                                }
                                label="Highlight Best Gain"
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mt: -0.5 }}>
                                Highlights the NGU or Hack that gives the most efficient bonus increase.
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                {/* Data Persistence Info */}
                <Grid item xs={12}>
                    <Paper sx={{
                        ...cardStyle,
                        background: alpha(theme.palette.info.main, 0.05),
                        borderColor: alpha(theme.palette.info.main, 0.2)
                    }}>
                        <Box sx={sectionHeaderStyle}>
                            <StorageIcon color="info" />
                            <Typography variant="h6" fontWeight={700} color="info.main">Storage & Persistence</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            All your settings, item levels, and loadouts are stored locally in your browser using <strong>LocalStorage</strong>.
                            This is more efficient than cookies and keeps your data private on this device.
                        </Typography>
                        <Divider sx={{ my: 2, opacity: 0.1 }} />
                        <Typography variant="caption" color="text.disabled">
                            Tip: Clear your browser cache or site data if you want to reset everything to defaults.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Settings;
