import React, { useState, useMemo } from 'react';
import { Box, Container, Grid, Typography, useTheme, alpha, Paper, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip } from '@mui/material';
import { HistoryProvider, useHistoryContext } from './HistoryContext';
import { useHistoryData } from './hooks/useHistoryData';
import SummaryCards from './SummaryCards';
import LazyChart from './Components/LazyChart';
import MainProgressChart from './Charts/MainProgressChart';
import BossProgressChart from './Charts/BossProgressChart';
import ResourceChart from './Charts/ResourceChart';
import StackedAreaChart from './Charts/StackedAreaChart';
import DeltaBarChart from './Charts/DeltaBarChart';
import HistoryTable from './HistoryTable';
import CustomRangePicker from './Components/CustomRangePicker';
import { History as HistoryIcon, Analytics, FlashOn, AutoFixHigh, Code, DeleteSweep } from '@mui/icons-material';
import ImportSaveForm from '../../ImportSaveForm/ImportSaveForm';
import { useDispatch } from 'react-redux';
import { ClearHistory } from '../../../actions/History';

// Inner layout component to access Context
const DashboardLayout = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { timeRange, setTimeRange, customRange, setCustomRange } = useHistoryContext();
    const { sortedHistory, filteredData } = useHistoryData(timeRange, customRange);
    const [clearDialogOpen, setClearDialogOpen] = useState(false);

    // Memoize arrays before any early returns (hooks must be called unconditionally)
    const nguNames = useMemo(() => ['Augments', 'Wandoos', 'Respawn', 'Gold', 'Adventure α', 'Power α', 'Drop Chance', 'Magic NGU', 'PP'], []);
    const magicNguNames = useMemo(() => ['Yggdrasil', 'Exp', 'Power β', 'Number', 'Time Machine', 'Energy NGU', 'Adventure β'], []);
    const hackNames = useMemo(() => ['Stats', 'Adventure', 'TM', 'Drop', 'Augment', 'ENGU', 'MNGU', 'Blood', 'QP', 'Daycare', 'EXP', 'Number', 'PP', 'Hack', 'Wish'], []);

    const handleClearClick = () => {
        setClearDialogOpen(true);
    };

    const handleClearConfirm = () => {
        dispatch(ClearHistory());
        setClearDialogOpen(false);
    };

    const handleClearCancel = () => {
        setClearDialogOpen(false);
    };

    if (!sortedHistory || sortedHistory.length === 0) {
        return (
            <Container maxWidth="md" sx={{ py: 12 }}>
                <Paper sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 6,
                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                    backdropFilter: 'blur(10px)',
                    border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`
                }}>
                    <Box sx={{
                        width: 80, height: 80, borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 3
                    }}>
                        <HistoryIcon sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                        No History Data Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                        To see your progression charts, you need to import your <strong>Rebirth</strong> save files manually or use the <strong>Live Sync</strong>.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <ImportSaveForm minimal={true} label="Import Rebirth saves" />
                    </Box>

                    <Typography variant="caption" display="block" sx={{ mt: 4, opacity: 0.6 }}>
                        Tip: Make sure your save files have "rebirth" in their name to be recorded in history.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4, animation: 'fadeIn 0.5s ease-out' }}>

            {/* Header / Title Area */}
            <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                        color: 'white'
                    }}>
                        <Analytics fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                            Progression Analytics
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Comprehensive overview of your journey and growth
                        </Typography>
                    </Box>
                </Box>

                {/* Actions & Time Range */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <ImportSaveForm minimal={true} label="Import Rebirths" />
                    
                    {sortedHistory && sortedHistory.length > 0 && (
                        <Tooltip title="Permanently delete all rebirth history entries" arrow>
                            <Button
                                variant="outlined"
                                onClick={handleClearClick}
                                startIcon={<DeleteSweep />}
                                sx={{
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: 2,
                                    borderColor: alpha(theme.palette.error.main, 0.3),
                                    color: theme.palette.error.main,
                                    bgcolor: alpha(theme.palette.error.main, 0.02),
                                    '&:hover': {
                                        borderColor: theme.palette.error.main,
                                        bgcolor: alpha(theme.palette.error.main, 0.08),
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.1)}`
                                    }
                                }}
                            >
                                Clear History
                            </Button>
                        </Tooltip>
                    )}

                    <Box sx={{
                        display: 'flex',
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        p: 0.5,
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        backdropFilter: 'blur(10px)'
                    }}>
                        {[
                            { label: '7D', value: 7 },
                            { label: '30D', value: 30 },
                            { label: '90D', value: 90 },
                            { label: 'ALL', value: 0 }
                        ].map((range) => (
                            <Button
                                key={range.label}
                                size="small"
                                onClick={() => setTimeRange(range.value)}
                                sx={{
                                    minWidth: 60,
                                    borderRadius: 2.5,
                                    fontWeight: 700,
                                    color: timeRange === range.value ? 'primary.contrastText' : 'text.secondary',
                                    bgcolor: timeRange === range.value ? 'primary.main' : 'transparent',
                                    '&:hover': {
                                        bgcolor: timeRange === range.value ? 'primary.dark' : alpha(theme.palette.primary.main, 0.1),
                                    }
                                }}
                            >
                                {range.label}
                            </Button>
                        ))}
                        <CustomRangePicker
                            range={customRange}
                            onSelect={(r) => {
                                setCustomRange(r);
                                setTimeRange('custom');
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Top Level Metrics */}
            <SummaryCards history={filteredData} />

            {/* Resource Charts Row */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid item xs={12} md={4}>
                    <LazyChart height={400}>
                        <ResourceChart type="energy" />
                    </LazyChart>
                </Grid>
                <Grid item xs={12} md={4}>
                    <LazyChart height={400}>
                        <ResourceChart type="magic" />
                    </LazyChart>
                </Grid>
                <Grid item xs={12} md={4}>
                    <LazyChart height={400}>
                        <ResourceChart type="res3" />
                    </LazyChart>
                </Grid>
            </Grid>

            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, px: 1, borderLeft: '4px solid', borderColor: 'secondary.main' }}>
                Progression Breakdown
            </Typography>

            <Grid container spacing={3}>
                {/* ---------- HACKS ROW ---------- */}
                <Grid item xs={12} lg={6}>
                    <LazyChart height={450}>
                        <StackedAreaChart
                            title="Hack Levels Timeline"
                            icon={Code}
                            color="success"
                            prefix="hack"
                            names={hackNames}
                            baseColorHue={120}
                        />
                    </LazyChart>
                </Grid>
                <Grid item xs={12} lg={6}>
                    <LazyChart height={450}>
                        <DeltaBarChart
                            title="Gains Per Rebirth"
                            icon={Code}
                            color="success"
                            prefix="hack"
                            names={hackNames}
                        />
                    </LazyChart>
                </Grid>

                {/* ---------- ENERGY NGU ROW ---------- */}
                <Grid item xs={12} lg={6}>
                    <LazyChart height={450}>
                        <StackedAreaChart
                            title="Energy NGU Progression"
                            icon={FlashOn}
                            color="secondary"
                            prefix="ngu_e"
                            names={nguNames}
                            baseColorHue={0}
                        />
                    </LazyChart>
                </Grid>

                {/* ---------- MAGIC NGU ROW ---------- */}
                <Grid item xs={12} lg={6}>
                    <LazyChart height={450}>
                        <StackedAreaChart
                            title="Magic NGU Progression"
                            icon={AutoFixHigh}
                            color="info"
                            prefix="ngu_m"
                            names={magicNguNames}
                            baseColorHue={180}
                        />
                    </LazyChart>
                </Grid>

                {/* Less important charts moved here */}
                <Grid item xs={12} lg={8} sx={{ mt: 4 }}>
                    <LazyChart height={400}>
                        <MainProgressChart />
                    </LazyChart>
                </Grid>
                <Grid item xs={12} lg={4} sx={{ mt: 4 }}>
                    <LazyChart height={400}>
                        <BossProgressChart />
                    </LazyChart>
                </Grid>
            </Grid>

            <Box sx={{ mt: 8 }}>
                <HistoryTable history={filteredData} />
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
                        mb: 1
                    }}>
                        <DeleteSweep sx={{ color: 'error.main', fontSize: 32 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Clear History?</Typography>
                </DialogTitle>
                <DialogContent sx={{ textAlign: 'center', px: 4 }}>
                    <DialogContentText sx={{ color: 'text.primary', fontWeight: 500 }}>
                        This will permanently delete <Typography component="span" sx={{ fontWeight: 800, color: 'error.main' }}>{sortedHistory.length} entries</Typography>.
                    </DialogContentText>
                    <DialogContentText variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
                    <Button
                        onClick={handleClearCancel}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleClearConfirm}
                        variant="contained"
                        color="error"
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 700,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`
                        }}
                    >
                        Clear All
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

// Main Entry Point
const HistoryIndex = () => {
    return (
        <HistoryProvider>
            <DashboardLayout />
        </HistoryProvider>
    );
};

export default HistoryIndex;
