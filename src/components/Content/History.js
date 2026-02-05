import React, { useMemo, useState, useDeferredValue } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    Card,
    CardContent,
    useTheme,
    alpha,
    Divider,
    IconButton,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    Avatar,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Link
} from '@mui/material';
import {
    History as HistoryIcon,
    CompareArrows,
    TrendingUp,
    InfoOutlined,
    CalendarMonth,
    FilterAlt,
    ExpandMore as ExpandMoreIcon,
    DeleteSweep,
    AccessTime,
    Star,
    FlashOn,
    AutoFixHigh,
    Science
} from '@mui/icons-material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { shorten, toTime } from '../../util';
import ImportSaveForm from '../ImportSaveForm/ImportSaveForm';


const HistoryEntry = ({ entry, previous, index }) => {
    const theme = useTheme();

    const calculateGain = (current, prev) => {
        if (prev === undefined || prev === 0) return null;
        const gain = current - prev;
        const pct = (gain / prev) * 100;
        return { gain, pct };
    };

    const expGain = calculateGain(entry.exp, previous?.exp);

    const formatGain = (gainObj) => {
        if (!gainObj) return "-";
        const color = gainObj.gain >= 0 ? 'success.main' : 'error.main';
        const sign = gainObj.gain >= 0 ? '+' : '';
        return (
            <Typography variant="caption" sx={{ color, fontWeight: 'bold' }}>
                {sign}{shorten(gainObj.gain)} ({sign}{gainObj.pct.toFixed(1)}%)
            </Typography>
        );
    };

    return (
        <TableRow sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
            <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
            <TableCell align="right">{entry.rebirths}</TableCell>
            <TableCell align="right">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Typography variant="body2">{shorten(entry.exp)}</Typography>
                    {formatGain(expGain)}
                </Box>
            </TableCell>
            <TableCell align="right">
                {entry.highestSadisticBoss > 1 ? `S${entry.highestSadisticBoss}` :
                    entry.highestHardBoss > 1 ? `E${entry.highestHardBoss}` :
                        `N${entry.highestBoss}`}
            </TableCell>
        </TableRow>
    );
};

const History = ({ handleClearHistory }) => {
    const history = useSelector(state => state.optimizer.history);
    const theme = useTheme();
    const [timeRange, setTimeRange] = useState(30); // Default to 30 days
    const deferredTimeRange = useDeferredValue(timeRange); // Defer expensive recalculations
    const [clearDialogOpen, setClearDialogOpen] = useState(false);

    const handleClearClick = () => {
        setClearDialogOpen(true);
    };

    const handleClearConfirm = () => {
        handleClearHistory();
        setClearDialogOpen(false);
    };

    const handleClearCancel = () => {
        setClearDialogOpen(false);
    };

    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => {
            if (b.rebirths !== a.rebirths) return b.rebirths - a.rebirths;
            return b.timestamp - a.timestamp;
        });
    }, [history]);

    const chartData = useMemo(() => {
        return [...history].sort((a, b) => a.timestamp - b.timestamp).map(entry => {
            const data = {
                ...entry,
                date: new Date(entry.timestamp).toLocaleDateString(),
                expLabel: shorten(entry.exp || 0),
                // Formatted labels for charts
                energyPowerVal: entry.energyPower || 0,
                energyCapVal: entry.energyCap || 0,
                energyBarsVal: entry.energyBars || 0,
                magicPowerVal: entry.magicPower || 0,
                magicCapVal: entry.magicCap || 0,
                magicBarsVal: entry.magicBars || 0,
                res3PowerVal: entry.res3Power || 0,
                res3CapVal: entry.res3Cap || 0,
                res3BarsVal: entry.res3Bars || 0,
                playtimeLabel: toTime((entry.playtime || 0) * 50),
                apLabel: shorten(entry.ap || 0)
            };


            // Flatten NGU levels for charts - use highest difficulty level
            if (entry.nguLevels) {
                entry.nguLevels.forEach((level, i) => {
                    // Store highest level achieved for this NGU
                    data[`ngu_e_${i}`] = level.sadistic > 0 ? level.sadistic : (level.evil > 0 ? level.evil : level.normal);
                    data[`ngu_e_${i}_difficulty`] = level.sadistic > 0 ? 'S' : (level.evil > 0 ? 'E' : 'N');
                });
            }
            if (entry.magicNguLevels) {
                entry.magicNguLevels.forEach((level, i) => {
                    // Store highest level achieved for this NGU
                    data[`ngu_m_${i}`] = level.sadistic > 0 ? level.sadistic : (level.evil > 0 ? level.evil : level.normal);
                    data[`ngu_m_${i}_difficulty`] = level.sadistic > 0 ? 'S' : (level.evil > 0 ? 'E' : 'N');
                });
            }
            if (entry.hackLevels) {
                entry.hackLevels.forEach((level, i) => {
                    data[`hack_${i}`] = level;
                });
            }
            if (entry.beardLevels) {
                entry.beardLevels.forEach((level, i) => {
                    data[`beard_${i}`] = level;
                });
            }
            return data;
        });
    }, [history]);

    const filteredChartData = useMemo(() => {
        if (deferredTimeRange === 0) return chartData;
        const cutoff = Date.now() - (deferredTimeRange * 24 * 60 * 60 * 1000);
        return chartData.filter(d => d.timestamp >= cutoff);
    }, [chartData, deferredTimeRange]);

    const dayActivity = useMemo(() => {
        const days = {};
        history.forEach(e => {
            const d = new Date(e.timestamp).toDateString();
            days[d] = (days[d] || 0) + 1;
        });
        return days;
    }, [history]);

    const nguNames = ['Augments', 'Wandoos', 'Respawn', 'Gold', 'Adventure', 'Power', 'Toughness', 'Yggdrasil', 'Experience'];
    const magicNguNames = ['Yggdrasil', 'Experience', 'Statistics', 'Hack', 'Wishes', 'QP', 'Time Machine', 'PP', 'Cards'];
    const hackNames = ['Stats', 'Adventure', 'TM', 'Drop', 'Augment', 'ENGU', 'MNGU', 'Blood', 'Res3', 'PP', 'Cards', 'GP', 'Wishes', 'Speed', 'Quality'];


    const visibleEnergyNgus = useMemo(() => {
        return nguNames.map((name, i) => ({ name, i }))
            .filter(({ i }) => history.some(e => e.nguLevels?.[i] && (e.nguLevels[i].normal > 0 || e.nguLevels[i].evil > 0 || e.nguLevels[i].sadistic > 0)));
    }, [history, nguNames]);

    const visibleMagicNgus = useMemo(() => {
        return magicNguNames.map((name, i) => ({ name, i }))
            .filter(({ i }) => history.some(e => e.magicNguLevels?.[i] && (e.magicNguLevels[i].normal > 0 || e.magicNguLevels[i].evil > 0 || e.magicNguLevels[i].sadistic > 0)));
    }, [history, magicNguNames]);

    const visibleHacks = useMemo(() => {
        return hackNames.map((name, i) => ({ name, i }))
            .filter(({ i }) => history.some(e => (e.hackLevels?.[i] || 0) > 0));
    }, [history, hackNames]);

    const beardNames = ["Nekkid", "Curly", "Glorious", "Long", "Lady", "Mega", "Golden"];
    const visibleBeards = useMemo(() => {
        return beardNames.map((name, i) => ({ name, i }))
            .filter(({ i }) => history.some(e => (e.beardLevels?.[i] || 0) > 0));
    }, [history, beardNames]);


    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <HistoryIcon color="primary" fontSize="large" />
                    Rebirth History
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {history && history.length > 0 && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteSweep />}
                            onClick={handleClearClick}
                            sx={{ borderRadius: 3 }}
                        >
                            Clear History
                        </Button>
                    )}
                    <ImportSaveForm hideSwitch />
                </Box>
            </Box>

            {/* Clear History Confirmation Dialog */}
            <Dialog
                open={clearDialogOpen}
                onClose={handleClearCancel}
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle>Clear All History?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will permanently delete all {history.length} saved entries from your history. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClearCancel} sx={{ borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button onClick={handleClearConfirm} variant="contained" color="error" sx={{ borderRadius: 2 }}>
                        Clear All
                    </Button>
                </DialogActions>
            </Dialog>

            {!history || history.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: 8, border: '2px dashed', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                    <HistoryIcon sx={{ fontSize: 80, mb: 2, opacity: 0.2, color: 'primary.main' }} />
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>No History Yet</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Use the button above to import your Rebirth saves and start tracking your journey!<br />
                        <Link href="https://github.com/postEntropy/gear-optimizer?tab=readme-ov-file#-history-tracking" target="_blank" rel="noopener" sx={{ fontWeight: 'bold', mt: 1, display: 'inline-block' }}>
                            View the History Tracking Guide
                        </Link>
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>

                    {/* Summary Cards - Modern Design */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            height: '100%',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            color: 'white',
                            borderRadius: 3,
                            boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '100px',
                                height: '100px',
                                background: alpha('#fff', 0.1),
                                borderRadius: '50%',
                                transform: 'translate(50%, -50%)'
                            }
                        }}>
                            <CardContent sx={{ position: 'relative', zIndex: 1, py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <HistoryIcon sx={{ opacity: 0.9, fontSize: '1.2rem' }} />
                                    <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 600, letterSpacing: 1, fontSize: '0.65rem' }}>
                                        Total Rebirths
                                    </Typography>
                                </Box>
                                <Typography variant="h3" fontWeight={900} sx={{ mb: 0.5 }}>
                                    {sortedHistory[0].rebirths.toLocaleString()}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.8 }}>
                                    <TrendingUp sx={{ fontSize: '0.9rem' }} />
                                    <Typography variant="caption">
                                        Since {new Date(history[0].timestamp).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            height: '100%',
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.05)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`
                            }
                        }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1, fontSize: '0.65rem' }}>
                                    Total Experience
                                </Typography>
                                <Typography variant="h3" fontWeight={900} color="primary" sx={{ my: 0.5 }}>
                                    {shorten(sortedHistory[0].exp || 0)}
                                </Typography>
                                <Box sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1.5,
                                    bgcolor: alpha(theme.palette.success.main, 0.1)
                                }}>
                                    <TrendingUp sx={{ color: 'success.main', fontSize: '0.9rem' }} />
                                    <Typography variant="caption" color="success.main" fontWeight={700}>
                                        {history.length > 1 ? (((sortedHistory[0].exp || 0) / (sortedHistory[1].exp || 1) - 1) * 100).toFixed(1) : 0}% vs last
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            height: '100%',
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                            boxShadow: `0 2px 12px ${alpha(theme.palette.secondary.main, 0.05)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.15)}`
                            }
                        }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1, fontSize: '0.65rem' }}>
                                    Max Boss Reached
                                </Typography>
                                <Typography variant="h3" fontWeight={900} color="secondary" sx={{ my: 0.5 }}>
                                    {sortedHistory[0].highestSadisticBoss > 1 ? `S${sortedHistory[0].highestSadisticBoss}` :
                                        sortedHistory[0].highestHardBoss > 1 ? `E${sortedHistory[0].highestHardBoss}` :
                                            `N${sortedHistory[0].highestBoss}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    {sortedHistory[0].highestSadisticBoss > 1 ? 'Sadistic Difficulty' :
                                        sortedHistory[0].highestHardBoss > 1 ? 'Evil Difficulty' : 'Normal Difficulty'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Secondary Metrics - Compact Row */}
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            {sortedHistory[0].pp > 0 && (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ height: '100%', borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.06), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                                        <CardContent sx={{ py: 1.5, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:last-child': { pb: 1.5 } }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>ITOPOD PP</Typography>
                                                <Typography variant="subtitle1" fontWeight={800} color="info.main" sx={{ lineHeight: 1.2 }}>{shorten(sortedHistory[0].pp)}</Typography>
                                            </Box>
                                            <TrendingUp color="info" sx={{ fontSize: '1.2rem' }} />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                            {sortedHistory[0].challenges > 0 && (
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ height: '100%', borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.06), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                                        <CardContent sx={{ py: 1.5, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:last-child': { pb: 1.5 } }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>Challenges</Typography>
                                                <Typography variant="subtitle1" fontWeight={800} color="success.main" sx={{ lineHeight: 1.2 }}>{sortedHistory[0].challenges}</Typography>
                                            </Box>
                                            <CompareArrows color="success" sx={{ fontSize: '1.2rem' }} />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ height: '100%', borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.06), border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}` }}>
                                    <CardContent sx={{ py: 1.5, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:last-child': { pb: 1.5 } }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>Arbitrary Points</Typography>
                                            <Typography variant="subtitle1" fontWeight={800} color="warning.main" sx={{ lineHeight: 1.2 }}>{shorten(sortedHistory[0].ap || 0)}</Typography>
                                        </Box>
                                        <Star color="warning" sx={{ fontSize: '1.2rem' }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ height: '100%', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.06), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                                    <CardContent sx={{ py: 1.5, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:last-child': { pb: 1.5 } }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>Playtime</Typography>
                                            <Typography variant="subtitle1" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.2 }}>{toTime((sortedHistory[0].playtime || 0) * 50)}</Typography>
                                        </Box>
                                        <AccessTime color="primary" sx={{ fontSize: '1.2rem' }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Main Content Areas */}
                    <Grid item xs={12}>
                        <Paper sx={{ borderRadius: 3, overflow: 'hidden', p: 3 }}>
                            <Box sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Growth Analytics</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <FilterAlt fontSize="small" color="action" />
                                        <ToggleButtonGroup
                                            size="small"
                                            value={timeRange}
                                            exclusive
                                            onChange={(e, v) => v !== null && setTimeRange(v)}
                                            sx={{ height: 32 }}
                                        >
                                            <ToggleButton value={7} sx={{ px: 1.5 }}>7d</ToggleButton>
                                            <ToggleButton value={10} sx={{ px: 1.5 }}>10d</ToggleButton>
                                            <ToggleButton value={30} sx={{ px: 1.5 }}>1m</ToggleButton>
                                            <ToggleButton value={60} sx={{ px: 1.5 }}>2m</ToggleButton>
                                            <ToggleButton value={0} sx={{ px: 1.5 }}>All</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
                                </Box>

                                <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarMonth sx={{ fontSize: '1rem' }} /> Activity Calendar (30 Days)
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3, p: 1.5, bgcolor: alpha(theme.palette.divider, 0.03), borderRadius: 2 }}>
                                    {Array.from({ length: 30 }).map((_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (29 - i));
                                        const dateStr = d.toDateString();
                                        const count = dayActivity[dateStr] || 0;
                                        return (
                                            <Tooltip key={i} title={`${dateStr}: ${count} saves`}>
                                                <Box
                                                    sx={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: 0.25,
                                                        bgcolor: count > 0 ? 'primary.main' : 'divider',
                                                        opacity: count > 0 ? Math.min(0.3 + count * 0.2, 1) : 0.3,
                                                        transition: 'all 0.2s',
                                                        '&:hover': { transform: 'scale(1.2)', opacity: 1 }
                                                    }}
                                                />
                                            </Tooltip>
                                        );
                                    })}
                                </Box>
                            </Box>

                            <Box sx={{ mb: 6 }}>
                                <Typography variant="subtitle1" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>XP Growth</Typography>
                                <Box sx={{ width: '100%', height: 280, mb: 2 }}>
                                    <ResponsiveContainer width="100%" height="100%" debounce={1}>
                                        <AreaChart data={filteredChartData}>
                                            <defs>
                                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis
                                                dataKey="timestamp"
                                                type="number"
                                                domain={['dataMin', 'dataMax']}
                                                tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                                fontSize={11}
                                            />
                                            <YAxis domain={['auto', 'auto']} tickFormatter={(v) => shorten(v)} fontSize={11} />
                                            <ChartTooltip
                                                labelFormatter={(t) => new Date(t).toLocaleString()}
                                                formatter={(v) => [shorten(v), "XP"]}
                                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[8], fontSize: '0.8rem' }}
                                            />
                                            <Area type="monotone" dataKey="exp" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorExp)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            {/* Resource Power Chart */}
                            <Box sx={{ height: 320, mb: 6 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                                    <FlashOn color="error" sx={{ fontSize: '1.2rem' }} /> Resource Power History
                                </Typography>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={11}
                                        />
                                        <YAxis
                                            tickFormatter={(v) => shorten(v)}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={11}
                                        />
                                        <ChartTooltip
                                            labelFormatter={(t) => new Date(t).toLocaleString()}
                                            formatter={(v, name) => [shorten(v), name]}
                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[8], fontSize: '0.8rem' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                        <Line type="monotone" dataKey="energyPowerVal" name="Energy Power" stroke="#4caf50" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="magicPowerVal" name="Magic Power" stroke="#2196f3" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="res3PowerVal" name="R3 Power" stroke="#9e9e9e" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* Resource Cap Chart */}
                            <Box sx={{ height: 320, mb: 6 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                                    <AutoFixHigh color="primary" sx={{ fontSize: '1.2rem' }} /> Resource Cap History
                                </Typography>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={11}
                                        />
                                        <YAxis
                                            tickFormatter={(v) => shorten(v)}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={11}
                                        />
                                        <ChartTooltip
                                            labelFormatter={(t) => new Date(t).toLocaleString()}
                                            formatter={(v, name) => [shorten(v), name]}
                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[8], fontSize: '0.8rem' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                        <Line type="monotone" dataKey="energyCapVal" name="Energy Cap" stroke="#81c784" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="magicCapVal" name="Magic Cap" stroke="#64b5f6" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="res3CapVal" name="R3 Cap" stroke="#bdbdbd" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* Resource Bars Chart */}
                            <Box sx={{ height: 320, mb: 6 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                                    <Science color="secondary" sx={{ fontSize: '1.2rem' }} /> Resource Bars History
                                </Typography>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={filteredChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={11}
                                        />
                                        <YAxis
                                            tickFormatter={(v) => shorten(v)}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={11}
                                        />
                                        <ChartTooltip
                                            labelFormatter={(t) => new Date(t).toLocaleString()}
                                            formatter={(v, name) => [shorten(v), name]}
                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[8], fontSize: '0.8rem' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                        <Line type="monotone" dataKey="energyBarsVal" name="Energy Bars" stroke="#a5d6a7" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="magicBarsVal" name="Magic Bars" stroke="#90caf9" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="res3BarsVal" name="R3 Bars" stroke="#e0e0e0" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                            <Divider sx={{ my: 4 }} />

                            <Box sx={{ mb: 6 }}>
                                <Typography variant="subtitle1" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>Energy NGU Levels</Typography>
                                <Box sx={{ width: '100%', height: 350 }}>
                                    <ResponsiveContainer width="100%" height="100%" debounce={1}>
                                        <LineChart data={filteredChartData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis
                                                dataKey="timestamp"
                                                type="number"
                                                domain={['dataMin', 'dataMax']}
                                                tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                                fontSize={11}
                                            />
                                            <YAxis domain={['auto', 'auto']} tickFormatter={(v) => shorten(v)} fontSize={11} />
                                            <ChartTooltip
                                                labelFormatter={(t) => new Date(t).toLocaleString()}
                                                formatter={(v, name) => [shorten(v), name]}
                                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[8], fontSize: '0.8rem' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                            {visibleEnergyNgus.map(({ name, i }) => (
                                                <Line key={`e_${i}`} type="monotone" dataKey={`ngu_e_${i}`} name={name} stroke={`hsl(${(i * 40) % 360}, 70%, 50%)`} strokeWidth={1.5} dot={{ r: 2 }} />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 6 }}>
                                <Typography variant="subtitle1" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>Magic NGU Levels</Typography>
                                <Box sx={{ width: '100%', height: 350 }}>
                                    <ResponsiveContainer width="100%" height="100%" debounce={1}>
                                        <LineChart data={filteredChartData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis
                                                dataKey="timestamp"
                                                type="number"
                                                domain={['dataMin', 'dataMax']}
                                                tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                                fontSize={11}
                                            />
                                            <YAxis domain={['auto', 'auto']} tickFormatter={(v) => shorten(v)} fontSize={11} />
                                            <ChartTooltip
                                                labelFormatter={(t) => new Date(t).toLocaleString()}
                                                formatter={(v, name) => [shorten(v), name]}
                                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[8], fontSize: '0.8rem' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                            {visibleMagicNgus.map(({ name, i }) => (
                                                <Line key={`m_${i}`} type="monotone" dataKey={`ngu_m_${i}`} name={name} stroke={`hsl(${(i * 40 + 180) % 360}, 70%, 50%)`} strokeWidth={1.5} dot={{ r: 2 }} />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" gutterBottom color="info.main" sx={{ fontWeight: 'bold' }}>Hack Levels</Typography>
                                <Box sx={{ width: '100%', height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%" debounce={1}>
                                        <LineChart data={filteredChartData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                            <XAxis
                                                dataKey="timestamp"
                                                type="number"
                                                domain={['dataMin', 'dataMax']}
                                                tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                                fontSize={11}
                                            />
                                            <YAxis domain={['auto', 'auto']} tickFormatter={(v) => shorten(v)} fontSize={11} />
                                            <ChartTooltip
                                                labelFormatter={(t) => new Date(t).toLocaleString()}
                                                formatter={(v, name) => [shorten(v), name]}
                                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[8], fontSize: '0.8rem' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                            {visibleHacks.map(({ name, i }) => (
                                                <Line key={`h_${i}`} type="monotone" dataKey={`hack_${i}`} name={name} stroke={`hsl(${(i * 24) % 360}, 60%, 45%)`} strokeWidth={1.5} dot={{ r: 2 }} />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 6 }} />

                            {visibleBeards.length > 0 && (
                                <>
                                    <Box sx={{ mb: 8 }}>
                                        <Typography variant="h6" gutterBottom sx={{ color: '#8B4513', fontWeight: 'bold' }}>Beard Progression (Permanent Levels)</Typography>
                                        <Box sx={{ width: '100%', height: 400 }}>
                                            <ResponsiveContainer width="100%" height="100%" debounce={1}>
                                                <LineChart data={filteredChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        type="number"
                                                        domain={['dataMin', 'dataMax']}
                                                        tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                                    />
                                                    <YAxis domain={['auto', 'auto']} tickFormatter={(v) => shorten(v)} />
                                                    <ChartTooltip
                                                        labelFormatter={(t) => new Date(t).toLocaleString()}
                                                        formatter={(v, name) => [shorten(v), name]}
                                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: theme.shadows[10] }}
                                                    />
                                                    <Legend />
                                                    {visibleBeards.map(({ name, i }) => (
                                                        <Line key={`b_${i}`} type="monotone" dataKey={`beard_${i}`} name={name} stroke={`hsl(${(i * 50 + 30) % 360}, 60%, 50%)`} strokeWidth={2} dot={{ r: 3 }} />
                                                    ))}
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    </Box>
                                    <Divider sx={{ my: 6 }} />
                                </>
                            )}

                            <Accordion elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 4, '&:before': { display: 'none' } }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{ bgcolor: alpha(theme.palette.divider, 0.03), borderRadius: 4 }}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <HistoryIcon /> Detailed Import History ({history.length})
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0 }}>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Import Date</TableCell>
                                                    <TableCell align="right">Rebirths</TableCell>
                                                    <TableCell align="right">Total XP (Gains)</TableCell>
                                                    <TableCell align="right">Max Boss</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sortedHistory.map((entry, idx) => (
                                                    <HistoryEntry
                                                        key={entry.timestamp}
                                                        entry={entry}
                                                        previous={sortedHistory[idx + 1]}
                                                        index={idx}
                                                    />
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};


export default History;
