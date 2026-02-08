
import React from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Grid, Card, CardContent, LinearProgress, Tooltip,
    InputAdornment, TextField, Paper, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import perkData from '../../assets/perks.json';

const Perks = () => {
    const perkLevels = useSelector(state => state.optimizer.adventure?.itopod?.perkLevel) || [];
    const [searchTerm, setSearchTerm] = React.useState('');
    const [difficultyFilter, setDifficultyFilter] = React.useState('All');

    // Mapping levels to static data
    const perks = perkData.map(p => {
        const level = perkLevels[p.id] || 0;
        const isMaxed = p.cap !== -1 && level >= p.cap;
        return {
            ...p,
            level,
            isMaxed,
            percentage: p.cap === -1 ? 100 : Math.min(100, (level / p.cap) * 100)
        };
    });

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'Evil': return '#f44336';
            case 'Sadistic': return '#9c27b0';
            default: return '#9e9e9e';
        }
    };

    const filteredPerks = perks
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
            return matchesSearch && matchesDifficulty;
        })
        .sort((a, b) => {
            if (a.isMaxed === b.isMaxed) return 0;
            return a.isMaxed ? 1 : -1;
        });

    const handleDifficultyChange = (event, newDifficulty) => {
        if (newDifficulty !== null) {
            setDifficultyFilter(newDifficulty);
        }
    };

    return (
        <Paper sx={{ p: 2, minHeight: '80vh', bgcolor: 'background.paper' }}>
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>ITOPOD Perks</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Perks Found: {filteredPerks.length}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <ToggleButtonGroup
                        size="small"
                        value={difficultyFilter}
                        exclusive
                        onChange={handleDifficultyChange}
                        aria-label="perk difficulty"
                        sx={{ height: 35 }}
                    >
                        <ToggleButton value="All" sx={{ px: 2 }}>All</ToggleButton>
                        <ToggleButton value="Normal" sx={{ px: 2, color: getDifficultyColor('Normal') }}>Normal</ToggleButton>
                        <ToggleButton value="Evil" sx={{ px: 2, color: getDifficultyColor('Evil') }}>Evil</ToggleButton>
                        <ToggleButton value="Sadistic" sx={{ px: 2, color: getDifficultyColor('Sadistic') }}>Sadistic</ToggleButton>
                    </ToggleButtonGroup>

                    <TextField
                        size="small"
                        placeholder="Search perks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: 1,
                                height: 35,
                                width: { xs: '100%', sm: 200 }
                            }
                        }}
                    />
                </Box>
            </Box>

            <Grid container spacing={1}>
                {filteredPerks.map((perk) => (
                    <Grid item key={perk.id} xs={6} sm={4} md={3} lg={2.4}>
                        <Card sx={{
                            bgcolor: 'action.hover',
                            border: perk.isMaxed ? '1px solid #4caf50' : `1px solid ${getDifficultyColor(perk.difficulty)}40`,
                            opacity: perk.level > 0 ? 1 : 0.6,
                            transition: 'all 0.2s',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 3,
                                opacity: 1
                            }
                        }}>
                            <CardContent sx={{ p: 1.5, pb: '8px !important', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                    position: 'relative',
                                    width: 48,
                                    height: 48,
                                    flexShrink: 0
                                }}>
                                    <img
                                        src={perk.src}
                                        alt={perk.name}
                                        referrerPolicy="no-referrer"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            filter: perk.level === 0 ? 'grayscale(100%)' : 'none'
                                        }}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=?'; }}
                                    />
                                </Box>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Tooltip
                                        title={
                                            <Box sx={{ p: 0.5, maxWidth: 300 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>({perk.id}) {perk.name}</Typography>
                                                <Typography variant="caption" sx={{
                                                    fontWeight: 'bold',
                                                    color: getDifficultyColor(perk.difficulty),
                                                    textTransform: 'uppercase',
                                                    display: 'block',
                                                    mb: 0.5
                                                }}>
                                                    {perk.difficulty} Difficulty Perk
                                                </Typography>
                                                <Typography variant="body2">{perk.description}</Typography>
                                            </Box>
                                        }
                                        placement="top"
                                    >
                                        <Typography variant="body2" sx={{
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            color: perk.isMaxed ? 'success.main' : 'text.primary',
                                            fontSize: '0.85rem'
                                        }}>
                                            ({perk.id}) {perk.name}
                                        </Typography>
                                    </Tooltip>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                            Lvl {perk.level}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                            {perk.cap === -1 ? '∞' : `/${perk.cap}`}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={perk.percentage}
                                        sx={{
                                            height: 4,
                                            borderRadius: 2,
                                            bgcolor: 'action.selected',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: perk.isMaxed ? 'success.main' : (perk.level > 0 ? getDifficultyColor(perk.difficulty) : 'transparent')
                                            }
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default Perks;
