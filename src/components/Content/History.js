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
    Link,
    Switch,
    FormControlLabel
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
    AutoFixHigh,
    Science,

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

const History = ({ handleClearHistory, handleSettings, showR3History, historyChartMode = 'absolute' }) => {
    const history = useSelector(state => state.optimizer.history);

    const theme = useTheme();
    const [timeRange, setTimeRange] = useState(30); // Default to 30 days
    const deferredTimeRange = useDeferredValue(timeRange); // Defer expensive recalculations
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [activeSeries, setActiveSeries] = useState(null);
    const [hiddenSeries, setHiddenSeries] = new Set();

    const toggleSeries = (dataKey) => {
        setHiddenSeries(prev => {
            const next = new Set(prev);
            if (next.has(dataKey)) next.delete(dataKey);
            else next.add(dataKey);
            return next;
        });
    };

    const isolateSeries = (dataKey) => {
        // If it's already isolated, show all. Otherwise, isolate this one.
        setHiddenSeries(prev => {
            if (prev.size > 0) return new Set();

            // Collect all possible keys for the current chart/context if needed, 
            // but for simplicity, we'll just track what to exclude.
            // Actually, let's keep it simple: isolate means hide everything ELSE.
            // This requires knowing all keys. Let's instead use a "focusedSeries" logic
            // Or just clear hidden and set everything else to hidden.
            return prev; // Placeholder, logic handled in components for better context
        });
    };

    const handleLegendMouseEnter = (o) => setActiveSeries(o.dataKey);
    const handleLegendMouseLeave = () => setActiveSeries(null);

    const getClosestSeries = (e) => {
        if (!e || !e.activePayload || e.activePayload.length === 0) return null;
        if (e.activePayload.length === 1) return e.activePayload[0].dataKey;

        const mouseY = e.chartY;
        // Find the series whose Y-coordinate is closest to the mouse
        let closest = e.activePayload[0];
        let minDiff = Math.abs((e.activePayload[0].cy || 0) - mouseY);

        for (let i = 1; i < e.activePayload.length; i++) {
            const p = e.activePayload[i];
            const diff = Math.abs((p.cy || 0) - mouseY);
            if (diff < minDiff) {
                minDiff = diff;
                closest = p;
            }
        }
        return closest.dataKey;
    };

    const activeLineStyle = (key, payload = []) => {
        const isActive = activeSeries === key;
        const isAnySeriesInChartActive = activeSeries && payload.some(p => p.dataKey === activeSeries);

        return {
            strokeWidth: isActive ? 5 : 2,
            strokeOpacity: isAnySeriesInChartActive ? (isActive ? 1 : 0.15) : 1,
            filter: isActive ? 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' : 'none',
            style: { transition: 'stroke-width 0.2s, stroke-opacity 0.2s' }
        };
    };

    const RenderLegend = (props) => {
        const { payload } = props;
        return (
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: 'center',
                mt: 1,
                px: 2,
                maxHeight: 120,
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                    width: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha(theme.palette.text.secondary, 0.2),
                    borderRadius: '4px',
                }
            }}>
                {payload.map((entry, index) => {
                    const isHidden = hiddenSeries.has(entry.dataKey);
                    const isActive = activeSeries === entry.dataKey;
                    return (
                        <Box
                            key={`item-${index}`}
                            onClick={() => toggleSeries(entry.dataKey)}
                            onMouseEnter={() => handleLegendMouseEnter(entry)}
                            onMouseLeave={handleLegendMouseLeave}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                cursor: 'pointer',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: isActive ? entry.color : 'transparent',
                                bgcolor: isActive ? alpha(entry.color, 0.1) : (isHidden ? alpha(theme.palette.action.disabled, 0.05) : 'transparent'),
                                opacity: isHidden ? 0.4 : 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: alpha(entry.color, 0.15),
                                    borderColor: entry.color
                                }
                            }}
                        >
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color }} />
                            <Typography variant="caption" sx={{
                                fontWeight: isActive ? 700 : 500,
                                color: isHidden ? 'text.disabled' : 'text.primary',
                                userSelect: 'none'
                            }}>
                                {entry.value}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        );
    };

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

    const relativeKeys = [
        'energyPowerVal', 'magicPowerVal', 'res3PowerVal',
        'energyCapVal', 'magicCapVal', 'res3CapVal',
        'energyBarsVal', 'magicBarsVal', 'res3BarsVal',
        'exp', 'ap'
    ];

    const relativeChartData = useMemo(() => {
        if (filteredChartData.length < 2) return filteredChartData;
        const first = filteredChartData[0];
        return filteredChartData.map(d => {
            const newData = { ...d };
            Object.keys(d).forEach(key => {
                const isNguHackBeard = key.startsWith('ngu_') || key.startsWith('hack_') || key.startsWith('beard_');
                const isResource = relativeKeys.includes(key);

                if (isNguHackBeard || isResource) {
                    const firstVal = first[key] || 0;
                    // Store absolute value for tooltip
                    newData[`${key}_abs`] = d[key];
                    if (firstVal > 0) {
                        newData[key] = ((d[key] / firstVal) - 1) * 100;
                    } else {
                        newData[key] = d[key] > 0 ? 100 : 0;
                    }
                }
            });
            return newData;
        });
    }, [filteredChartData]);

    const chartDataToUse = historyChartMode === 'relative' ? relativeChartData : filteredChartData;

    const CustomTooltip = ({ active, payload, label, mode }) => {
        if (active && payload && payload.length) {
            // Sort payload by value descending
            const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

            return (
                <Paper
                    elevation={10}
                    sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.95),
                        backdropFilter: 'blur(4px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        minWidth: 180,
                        fontSize: '0.75rem'
                    }}
                >
                    <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block', color: 'text.secondary', borderBottom: 1, borderColor: 'divider', pb: 0.5 }}>
                        {new Date(label).toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        {sortedPayload.map((entry, index) => {
                            const isActive = activeSeries === entry.dataKey;
                            const isTooltipActive = payload.some(e => e.dataKey === activeSeries);
                            const absValue = entry.payload[`${entry.dataKey}_abs`] !== undefined ? entry.payload[`${entry.dataKey}_abs`] : entry.value;

                            return (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 2,
                                        opacity: (activeSeries && isTooltipActive && !isActive) ? 0.2 : 1,
                                        transform: isActive ? 'scale(1.08)' : 'none',
                                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                        bgcolor: isActive ? alpha(entry.color, 0.2) : 'transparent',
                                        px: isActive ? 1 : 0,
                                        py: isActive ? 0.5 : 0,
                                        mx: isActive ? -0.5 : 0,
                                        borderRadius: 1,
                                        boxShadow: isActive ? `0 2px 8px ${alpha(entry.color, 0.2)}` : 'none',
                                        zIndex: isActive ? 2 : 1
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: isActive ? 12 : 8,
                                            height: isActive ? 12 : 8,
                                            borderRadius: '50%',
                                            bgcolor: entry.color,
                                            boxShadow: isActive ? `0 0 8px ${entry.color}` : 'none'
                                        }} />
                                        <Typography variant="caption" sx={{
                                            fontWeight: isActive ? 900 : 500,
                                            color: entry.color,
                                            fontSize: isActive ? '0.85rem' : '0.75rem'
                                        }}>
                                            {entry.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {mode === 'relative' && (
                                            <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.65rem', fontWeight: 500 }}>
                                                ({shorten(absValue)})
                                            </Typography>
                                        )}
                                        <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                                            {mode === 'relative' ? (entry.value > 0 ? '+' : '') + entry.value.toFixed(1) + '%' : shorten(entry.value)}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    const nguNames = ['Augments', 'Wandoos', 'Respawn', 'Gold', 'Adventure α', 'Power α', 'Drop Chance', 'Magic NGU', 'PP'];
    const magicNguNames = ['Yggdrasil', 'Exp', 'Power β', 'Number', 'Time Machine', 'Energy NGU', 'Adventure β'];
    const hackNames = ['Stats', 'Adventure', 'TM', 'Drop', 'Augment', 'ENGU', 'MNGU', 'Blood', 'QP', 'Daycare', 'EXP', 'Number', 'PP', 'Hack', 'Wish'];



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
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    {history && history.length > 0 && (
                        <Tooltip title="Permanently delete all rebirth history entries" arrow>
                            <Button
                                variant="outlined"
                                onClick={handleClearClick}
                                startIcon={<DeleteSweep sx={{ fontSize: '1.1rem' }} />}
                                sx={{
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: 2,
                                    py: 0.5,
                                    minHeight: 36,
                                    borderColor: alpha(theme.palette.error.main, 0.3),
                                    color: theme.palette.error.main,
                                    bgcolor: alpha(theme.palette.error.main, 0.02),
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: theme.palette.error.main,
                                        bgcolor: alpha(theme.palette.error.main, 0.08),
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.1)}`
                                    },
                                    '&:active': {
                                        transform: 'translateY(0)'
                                    }
                                }}
                            >
                                Clear History
                            </Button>
                        </Tooltip>
                    )}
                    <ImportSaveForm hideSwitch />
                </Box>
            </Box>

            {/* Clear History Confirmation Dialog */}
            <Dialog
                open={clearDialogOpen}
                onClose={handleClearCancel}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                        backgroundImage: 'none'
                    }
                }}
                transitionDuration={300}
            >
                <DialogTitle sx={{
                    textAlign: 'center',
                    pt: 4,
                    pb: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                        animation: 'shake 0.5s ease-in-out'
                    }}>
                        <DeleteSweep sx={{ color: 'error.main', fontSize: 32 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Clear History?</Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', px: 4 }}>
                    <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
                        This will permanently delete <Typography component="span" sx={{ fontWeight: 800, color: 'error.main' }}>{history.length} entries</Typography>.
                    </DialogContentText>
                    <DialogContentText variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        This action is destructive and cannot be undone. Are you sure you want to proceed?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 4, gap: 1 }}>
                    <Button
                        onClick={handleClearCancel}
                        fullWidth
                        sx={{
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: 700,
                            textTransform: 'none',
                            color: 'text.secondary',
                            '&:hover': { bgcolor: alpha(theme.palette.action.active, 0.05) }
                        }}
                    >
                        Keep My Data
                    </Button>
                    <Button
                        onClick={handleClearConfirm}
                        variant="contained"
                        fullWidth
                        color="error"
                        sx={{
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: 800,
                            textTransform: 'none',
                            boxShadow: `0 8px 16px ${alpha(theme.palette.error.main, 0.3)}`,
                            '&:hover': {
                                bgcolor: 'error.dark',
                                boxShadow: `0 12px 20px ${alpha(theme.palette.error.main, 0.4)}`,
                            }
                        }}
                    >
                        Yes, Delete Everything
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
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={showR3History}
                                                    onChange={(e) => handleSettings('showR3History', e.target.checked)}
                                                    size="small"
                                                />
                                            }
                                            label={<Typography variant="caption" fontWeight={600}>Show R3</Typography>}
                                            sx={{ mr: 0 }}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ToggleButtonGroup
                                                size="small"
                                                value={historyChartMode}
                                                exclusive
                                                onChange={(e, val) => val && handleSettings('historyChartMode', val)}
                                                sx={{ height: 32, mr: 2 }}
                                            >
                                                <Tooltip title="Absolute Levels">
                                                    <ToggleButton value="absolute"><TrendingUp sx={{ fontSize: '1rem' }} /></ToggleButton>
                                                </Tooltip>
                                                <Tooltip title="Stacked Volume">
                                                    <ToggleButton value="stacked"><Science sx={{ fontSize: '1rem' }} /></ToggleButton>
                                                </Tooltip>
                                                <Tooltip title="Relative Growth (%)">
                                                    <ToggleButton value="relative"><CompareArrows sx={{ fontSize: '1rem' }} /></ToggleButton>
                                                </Tooltip>
                                            </ToggleButtonGroup>
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
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartDataToUse}
                                            onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                            onMouseLeave={() => setActiveSeries(null)}
                                        >
                                            <defs>
                                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} style={{ pointerEvents: 'none' }} />
                                            <XAxis
                                                dataKey="timestamp"
                                                type="number"
                                                domain={['dataMin', 'dataMax']}
                                                tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                                fontSize={11}
                                                style={{ pointerEvents: 'none' }}
                                            />
                                            <YAxis
                                                domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                                tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)}
                                                fontSize={11}
                                                style={{ pointerEvents: 'none' }}
                                            />
                                            <ChartTooltip content={<CustomTooltip mode={historyChartMode} />} />
                                            <Legend content={<RenderLegend />} />
                                            {!hiddenSeries.has('exp') && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="exp"
                                                    name="Experience"
                                                    stroke={theme.palette.primary.main}
                                                    fillOpacity={activeSeries ? (activeSeries === 'exp' ? 1 : 0.2) : 1}
                                                    fill="url(#colorExp)"
                                                    strokeWidth={activeSeries === 'exp' ? 4 : 2}
                                                />
                                            )}
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
                                    <LineChart
                                        data={chartDataToUse}
                                        onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                        onMouseLeave={() => setActiveSeries(null)}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} style={{ pointerEvents: 'none' }} />
                                        <XAxis
                                            dataKey="timestamp"
                                            domain={['dataMin', 'dataMax']}
                                            tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={11}
                                            padding={{ left: 20, right: 20 }}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        <YAxis
                                            yAxisId="energy"
                                            domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                            tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)}
                                            stroke="#4caf50"
                                            fontSize={11}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        <YAxis
                                            yAxisId="magic"
                                            orientation="right"
                                            domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                            tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)}
                                            stroke="#2196f3"
                                            fontSize={11}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        {showR3History && (
                                            <YAxis
                                                yAxisId="res3"
                                                domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                                hide={true}
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        )}
                                        <ChartTooltip content={<CustomTooltip mode={historyChartMode} />} />
                                        <Legend content={<RenderLegend />} />
                                        {!hiddenSeries.has('energyPowerVal') && (
                                            <Line
                                                yAxisId="energy"
                                                type="monotone"
                                                dataKey="energyPowerVal"
                                                name="Energy Power"
                                                stroke="#4caf50"
                                                {...activeLineStyle('energyPowerVal', [{ dataKey: 'energyPowerVal' }, { dataKey: 'magicPowerVal' }, { dataKey: 'res3PowerVal' }])}
                                                dot={activeSeries === 'energyPowerVal' ? { r: 5, fill: '#4caf50' } : { r: 2 }}
                                                activeDot={{ r: 8, strokeWidth: 0 }}
                                                onClick={() => toggleSeries('energyPowerVal')}
                                            />
                                        )}
                                        {!hiddenSeries.has('magicPowerVal') && (
                                            <Line
                                                yAxisId="magic"
                                                type="monotone"
                                                dataKey="magicPowerVal"
                                                name="Magic Power"
                                                stroke="#2196f3"
                                                {...activeLineStyle('magicPowerVal', [{ dataKey: 'energyPowerVal' }, { dataKey: 'magicPowerVal' }, { dataKey: 'res3PowerVal' }])}
                                                dot={activeSeries === 'magicPowerVal' ? { r: 5, fill: '#2196f3' } : { r: 2 }}
                                                activeDot={{ r: 8, strokeWidth: 0 }}
                                                onClick={() => toggleSeries('magicPowerVal')}
                                            />
                                        )}
                                        {showR3History && !hiddenSeries.has('res3PowerVal') && (
                                            <Line
                                                yAxisId="res3"
                                                type="monotone"
                                                dataKey="res3PowerVal"
                                                name="R3 Power"
                                                stroke="#9e9e9e"
                                                {...activeLineStyle('res3PowerVal', [{ dataKey: 'energyPowerVal' }, { dataKey: 'magicPowerVal' }, { dataKey: 'res3PowerVal' }])}
                                                dot={activeSeries === 'res3PowerVal' ? { r: 5, fill: '#9e9e9e' } : { r: 2 }}
                                                activeDot={{ r: 8, strokeWidth: 0 }}
                                                onClick={() => toggleSeries('res3PowerVal')}
                                            />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* Resource Cap Chart */}
                            <Box sx={{ height: 320, mb: 6 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                                    <AutoFixHigh color="primary" sx={{ fontSize: '1.2rem' }} /> Resource Cap History
                                </Typography>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartDataToUse}
                                        onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                        onMouseLeave={() => setActiveSeries(null)}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} style={{ pointerEvents: 'none' }} />
                                        <XAxis
                                            dataKey="timestamp"
                                            domain={['dataMin', 'dataMax']}
                                            tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={11}
                                            padding={{ left: 20, right: 20 }}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        <YAxis
                                            yAxisId="energy"
                                            domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                            tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)}
                                            stroke="#81c784"
                                            fontSize={11}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        <YAxis
                                            yAxisId="magic"
                                            orientation="right"
                                            domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                            tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)}
                                            stroke="#64b5f6"
                                            fontSize={11}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        {showR3History && (
                                            <YAxis
                                                yAxisId="res3"
                                                domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                                hide={true}
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        )}
                                        <ChartTooltip content={<CustomTooltip mode={historyChartMode} />} />
                                        <Legend content={<RenderLegend />} />
                                        {!hiddenSeries.has('energyCapVal') && (
                                            <Line
                                                yAxisId="energy"
                                                type="monotone"
                                                dataKey="energyCapVal"
                                                name="Energy Cap"
                                                stroke="#81c784"
                                                strokeWidth={activeSeries === 'energyCapVal' ? 4 : 2}
                                                strokeOpacity={activeSeries ? (activeSeries === 'energyCapVal' ? 1 : (['energyCapVal', 'magicCapVal', 'res3CapVal'].includes(activeSeries) ? 0.2 : 1)) : 1}
                                                dot={activeSeries === 'energyCapVal' ? { r: 4 } : { r: 2 }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        )}
                                        {!hiddenSeries.has('magicCapVal') && (
                                            <Line
                                                yAxisId="magic"
                                                type="monotone"
                                                dataKey="magicCapVal"
                                                name="Magic Cap"
                                                stroke="#64b5f6"
                                                strokeWidth={activeSeries === 'magicCapVal' ? 4 : 2}
                                                strokeOpacity={activeSeries ? (activeSeries === 'magicCapVal' ? 1 : (['energyCapVal', 'magicCapVal', 'res3CapVal'].includes(activeSeries) ? 0.2 : 1)) : 1}
                                                dot={activeSeries === 'magicCapVal' ? { r: 4 } : { r: 2 }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        )}
                                        {showR3History && !hiddenSeries.has('res3CapVal') && (
                                            <Line
                                                yAxisId="res3"
                                                type="monotone"
                                                dataKey="res3CapVal"
                                                name="R3 Cap"
                                                stroke="#bdbdbd"
                                                strokeWidth={activeSeries === 'res3CapVal' ? 4 : 2}
                                                strokeOpacity={activeSeries ? (activeSeries === 'res3CapVal' ? 1 : (['energyCapVal', 'magicCapVal', 'res3CapVal'].includes(activeSeries) ? 0.2 : 1)) : 1}
                                                dot={activeSeries === 'res3CapVal' ? { r: 4 } : { r: 2 }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* Resource Bars Chart */}
                            <Box sx={{ height: 320, mb: 6 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                                    <Science color="secondary" sx={{ fontSize: '1.2rem' }} /> Resource Bars History
                                </Typography>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={filteredChartData}
                                        onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                        onMouseLeave={() => setActiveSeries(null)}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} style={{ pointerEvents: 'none' }} />
                                        <XAxis
                                            dataKey="timestamp"
                                            domain={['dataMin', 'dataMax']}
                                            tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                            stroke={theme.palette.text.secondary}
                                            fontSize={11}
                                            padding={{ left: 20, right: 20 }}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        <YAxis
                                            yAxisId="energy"
                                            domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                            tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)}
                                            stroke="#a5d6a7"
                                            fontSize={11}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        <YAxis
                                            yAxisId="magic"
                                            orientation="right"
                                            domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                            tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)}
                                            stroke="#90caf9"
                                            fontSize={11}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        {showR3History && (
                                            <YAxis
                                                yAxisId="res3"
                                                domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                                hide={true}
                                                style={{ pointerEvents: 'none' }}
                                            />
                                        )}
                                        <ChartTooltip content={<CustomTooltip mode={historyChartMode} />} />
                                        <Legend content={<RenderLegend />} />
                                        {!hiddenSeries.has('energyBarsVal') && (
                                            <Line
                                                yAxisId="energy"
                                                type="monotone"
                                                dataKey="energyBarsVal"
                                                name="Energy Bars"
                                                stroke="#a5d6a7"
                                                {...activeLineStyle('energyBarsVal', [{ dataKey: 'energyBarsVal' }, { dataKey: 'magicBarsVal' }, { dataKey: 'res3BarsVal' }])}
                                                onClick={() => toggleSeries('energyBarsVal')}
                                            />
                                        )}
                                        {!hiddenSeries.has('magicBarsVal') && (
                                            <Line
                                                yAxisId="magic"
                                                type="monotone"
                                                dataKey="magicBarsVal"
                                                name="Magic Bars"
                                                stroke="#90caf9"
                                                {...activeLineStyle('magicBarsVal', [{ dataKey: 'energyBarsVal' }, { dataKey: 'magicBarsVal' }, { dataKey: 'res3BarsVal' }])}
                                                onClick={() => toggleSeries('magicBarsVal')}
                                            />
                                        )}
                                        {showR3History && !hiddenSeries.has('res3BarsVal') && (
                                            <Line
                                                yAxisId="res3"
                                                type="monotone"
                                                dataKey="res3BarsVal"
                                                name="R3 Bars"
                                                stroke="#e0e0e0"
                                                {...activeLineStyle('res3BarsVal', [{ dataKey: 'energyBarsVal' }, { dataKey: 'magicBarsVal' }, { dataKey: 'res3BarsVal' }])}
                                                onClick={() => toggleSeries('res3BarsVal')}
                                            />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                            <Divider sx={{ my: 4 }} />

                            <Box sx={{ mb: 6 }}>
                                <Typography variant="subtitle1" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>Energy NGU Levels</Typography>
                                <Box sx={{ width: '100%', height: 350 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {historyChartMode === 'stacked' ? (
                                            <AreaChart
                                                data={chartDataToUse}
                                                onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                                onMouseLeave={() => setActiveSeries(null)}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} style={{ pointerEvents: 'none' }} />
                                                <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleDateString()} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <YAxis tickFormatter={(v) => shorten(v)} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <ChartTooltip content={<CustomTooltip />} />
                                                <Legend content={<RenderLegend />} />
                                                {visibleEnergyNgus.map(({ name, i }) => {
                                                    const key = `ngu_e_${i}`;
                                                    if (hiddenSeries.has(key)) return null;
                                                    const isActive = activeSeries === key;
                                                    const chartKeys = visibleEnergyNgus.map(v => `ngu_e_${v.i}`);
                                                    return (
                                                        <Area
                                                            key={key}
                                                            stackId="1"
                                                            type="monotone"
                                                            dataKey={key}
                                                            name={name}
                                                            stroke={`hsl(${(i * 40) % 360}, 70%, 50%)`}
                                                            fill={`hsl(${(i * 40) % 360}, 70%, 50%)`}
                                                            fillOpacity={activeSeries ? (isActive ? 0.9 : 0.1) : 0.6}
                                                            strokeWidth={isActive ? 3 : 0}
                                                            style={{ transition: 'all 0.2s ease' }}
                                                        />
                                                    );
                                                })}
                                            </AreaChart>
                                        ) : (
                                            <LineChart
                                                data={chartDataToUse}
                                                onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                                onMouseLeave={() => setActiveSeries(null)}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} style={{ pointerEvents: 'none' }} />
                                                <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleDateString()} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <YAxis domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']} tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <ChartTooltip content={<CustomTooltip mode={historyChartMode} />} />
                                                <Legend content={<RenderLegend />} />
                                                {visibleEnergyNgus.map(({ name, i }) => {
                                                    const key = `ngu_e_${i}`;
                                                    if (hiddenSeries.has(key)) return null;
                                                    const chartKeys = visibleEnergyNgus.map(v => `ngu_e_${v.i}`);
                                                    return (
                                                        <Line
                                                            key={key}
                                                            type="monotone"
                                                            dataKey={key}
                                                            name={name}
                                                            stroke={`hsl(${(i * 40) % 360}, 70%, 50%)`}
                                                            {...activeLineStyle(key, chartKeys.map(k => ({ dataKey: k })))}
                                                            dot={activeSeries === key ? { r: 4, fill: `hsl(${(i * 40) % 360}, 70%, 50%)` } : { r: 2 }}
                                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                                        />
                                                    );
                                                })}
                                            </LineChart>
                                        )}
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            <Box sx={{ mb: 6 }}>
                                <Typography variant="subtitle1" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>Magic NGU Levels</Typography>
                                <Box sx={{ width: '100%', height: 350 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {historyChartMode === 'stacked' ? (
                                            <AreaChart
                                                data={chartDataToUse}
                                                onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                                onMouseLeave={() => setActiveSeries(null)}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} style={{ pointerEvents: 'none' }} />
                                                <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleDateString()} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <YAxis tickFormatter={(v) => shorten(v)} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <ChartTooltip content={<CustomTooltip />} />
                                                <Legend content={<RenderLegend />} />
                                                {visibleMagicNgus.map(({ name, i }) => {
                                                    const key = `ngu_m_${i}`;
                                                    if (hiddenSeries.has(key)) return null;
                                                    const isActive = activeSeries === key;
                                                    return (
                                                        <Area
                                                            key={key}
                                                            stackId="1"
                                                            type="monotone"
                                                            dataKey={key}
                                                            name={name}
                                                            stroke={`hsl(${(i * 40 + 180) % 360}, 70%, 50%)`}
                                                            fill={`hsl(${(i * 40 + 180) % 360}, 70%, 50%)`}
                                                            fillOpacity={activeSeries ? (isActive ? 0.9 : 0.1) : 0.6}
                                                            strokeWidth={isActive ? 3 : 0}
                                                            style={{ transition: 'all 0.2s ease' }}
                                                        />
                                                    );
                                                })}
                                            </AreaChart>
                                        ) : (
                                            <LineChart
                                                data={chartDataToUse}
                                                onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                                onMouseLeave={() => setActiveSeries(null)}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} style={{ pointerEvents: 'none' }} />
                                                <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleDateString()} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <YAxis domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']} tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <ChartTooltip content={<CustomTooltip mode={historyChartMode} />} />
                                                <Legend content={<RenderLegend />} />
                                                {visibleMagicNgus.map(({ name, i }) => {
                                                    const key = `ngu_m_${i}`;
                                                    if (hiddenSeries.has(key)) return null;
                                                    const chartKeys = visibleMagicNgus.map(v => `ngu_m_${v.i}`);
                                                    return (
                                                        <Line
                                                            key={key}
                                                            type="monotone"
                                                            dataKey={key}
                                                            name={name}
                                                            stroke={`hsl(${(i * 40 + 180) % 360}, 70%, 50%)`}
                                                            {...activeLineStyle(key, chartKeys.map(k => ({ dataKey: k })))}
                                                            dot={activeSeries === key ? { r: 4, fill: `hsl(${(i * 40 + 180) % 360}, 70%, 50%)` } : { r: 2 }}
                                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                                        />
                                                    );
                                                })}
                                            </LineChart>
                                        )}
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" gutterBottom color="info.main" sx={{ fontWeight: 'bold' }}>Hack Levels</Typography>
                                <Box sx={{ width: '100%', height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {historyChartMode === 'stacked' ? (
                                            <AreaChart
                                                data={chartDataToUse}
                                                onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                                onMouseLeave={() => setActiveSeries(null)}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} style={{ pointerEvents: 'none' }} />
                                                <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleDateString()} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <YAxis tickFormatter={(v) => shorten(v)} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <ChartTooltip content={<CustomTooltip />} />
                                                <Legend content={<RenderLegend />} />
                                                {visibleHacks.map(({ name, i }) => {
                                                    const key = `hack_${i}`;
                                                    if (hiddenSeries.has(key)) return null;
                                                    const isActive = activeSeries === key;
                                                    return (
                                                        <Area
                                                            key={key}
                                                            stackId="1"
                                                            type="monotone"
                                                            dataKey={key}
                                                            name={name}
                                                            stroke={`hsl(${(i * 24) % 360}, 60%, 45%)`}
                                                            fill={`hsl(${(i * 24) % 360}, 60%, 45%)`}
                                                            fillOpacity={activeSeries ? (isActive ? 0.9 : 0.1) : 0.6}
                                                            strokeWidth={isActive ? 3 : 0}
                                                            style={{ transition: 'all 0.2s ease' }}
                                                        />
                                                    );
                                                })}
                                            </AreaChart>
                                        ) : (
                                            <LineChart
                                                data={chartDataToUse}
                                                onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                                onMouseLeave={() => setActiveSeries(null)}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} style={{ pointerEvents: 'none' }} />
                                                <XAxis dataKey="timestamp" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleDateString()} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <YAxis domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']} tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)} fontSize={11} style={{ pointerEvents: 'none' }} />
                                                <ChartTooltip content={<CustomTooltip mode={historyChartMode} />} />
                                                <Legend content={<RenderLegend />} />
                                                {visibleHacks.map(({ name, i }) => {
                                                    const key = `hack_${i}`;
                                                    if (hiddenSeries.has(key)) return null;
                                                    const chartKeys = visibleHacks.map(v => `hack_${v.i}`);
                                                    return (
                                                        <Line
                                                            key={key}
                                                            type="monotone"
                                                            dataKey={key}
                                                            name={name}
                                                            stroke={`hsl(${(i * 24) % 360}, 60%, 45%)`}
                                                            {...activeLineStyle(key, chartKeys.map(k => ({ dataKey: k })))}
                                                            dot={activeSeries === key ? { r: 4, fill: `hsl(${(i * 24) % 360}, 60%, 45%)` } : { r: 2 }}
                                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                                            onClick={() => toggleSeries(key)}
                                                        />
                                                    );
                                                })}
                                            </LineChart>
                                        )}
                                    </ResponsiveContainer>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 6 }} />

                            {visibleBeards.length > 0 && (
                                <>
                                    <Box sx={{ mb: 8 }}>
                                        <Typography variant="h6" gutterBottom sx={{ color: '#8B4513', fontWeight: 'bold' }}>Beard Progression (Permanent Levels)</Typography>
                                        <Box sx={{ width: '100%', height: 400 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart
                                                    data={chartDataToUse}
                                                    onMouseMove={(e) => setActiveSeries(getClosestSeries(e))}
                                                    onMouseLeave={() => setActiveSeries(null)}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} style={{ pointerEvents: 'none' }} />
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        type="number"
                                                        domain={['dataMin', 'dataMax']}
                                                        tickFormatter={(t) => new Date(t).toLocaleDateString()}
                                                        style={{ pointerEvents: 'none' }}
                                                    />
                                                    <YAxis
                                                        domain={historyChartMode === 'relative' ? [0, 'auto'] : ['auto', 'auto']}
                                                        tickFormatter={(v) => historyChartMode === 'relative' ? `${v.toFixed(1)}%` : shorten(v)}
                                                        style={{ pointerEvents: 'none' }}
                                                    />
                                                    <ChartTooltip content={<CustomTooltip mode={historyChartMode} />} />
                                                    <Legend content={<RenderLegend />} />
                                                    {visibleBeards.map(({ name, i }) => {
                                                        const key = `beard_${i}`;
                                                        if (hiddenSeries.has(key)) return null;
                                                        const chartKeys = visibleBeards.map(v => `beard_${v.i}`);
                                                        return (
                                                            <Line
                                                                key={key}
                                                                type="monotone"
                                                                dataKey={key}
                                                                name={name}
                                                                stroke={`hsl(${(i * 50 + 30) % 360}, 60%, 50%)`}
                                                                {...activeLineStyle(key, chartKeys.map(k => ({ dataKey: k })))}
                                                                dot={activeSeries === key ? { r: 4, fill: `hsl(${(i * 50 + 30) % 360}, 60%, 50%)` } : { r: 2 }}
                                                                activeDot={{ r: 8, strokeWidth: 0 }}
                                                                onClick={() => toggleSeries(key)}
                                                            />
                                                        );
                                                    })}
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
