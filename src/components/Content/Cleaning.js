import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Paper, Typography, Button, CircularProgress, LinearProgress, Alert, alpha, useTheme } from '@mui/material';
import { CleaningServices, Stop, AutoAwesome, CheckCircleOutline, Inventory2 } from '@mui/icons-material';

import ImportSaveForm from '../ImportSaveForm/ImportSaveForm';
import CleaningSummary from '../Cleaning/CleaningSummary';
import CleaningTable from '../Cleaning/CleaningTable';
import { CleaningReportAsync } from '../../actions/Cleaning';
import { Terminate } from '../../actions/Terminate';

const Cleaning = () => {
    const theme = useTheme();
    const dispatch = useDispatch();

    const report = useSelector((state) => state.optimizer.cleaningReport);
    const running = useSelector((state) => state.optimizer.running);
    const itemdata = useSelector((state) => state.optimizer.itemdata);
    const ownedItemIds = useSelector((state) => state.optimizer.ownedItemIds);
    const zone = useSelector((state) => state.optimizer.zone);
    const progress = useSelector((state) => state.optimizer.cleaningProgress);

    const owned = ownedItemIds || [];
    const hasOwned = owned.length > 0;
    const hasReport = Boolean(report && !report.needsSave);

    const stale = hasReport && (report.zone !== zone || report.ownedCount !== owned.length);
    const nothingToClean = hasReport && report.unusedCount === 0 && report.replaceableCount === 0;

    const [, setTick] = useState(0);
    const startedRef = useRef(null);

    useEffect(() => {
        if (!running) {
            startedRef.current = null;
            return undefined;
        }
        startedRef.current = startedRef.current || Date.now();
        const id = setInterval(() => setTick((value) => value + 1), 1000);
        return () => clearInterval(id);
    }, [running]);

    const hasProgress = Boolean(progress && progress.total > 0);
    const percent = hasProgress ? Math.min(100, Math.round((progress.completed / progress.total) * 100)) : 0;
    const phaseLabel = progress && progress.label ? progress.label : null;

    let timing = null;
    if (hasProgress && startedRef.current) {
        const elapsedSeconds = Math.max(0, (Date.now() - startedRef.current) / 1000);
        const elapsedText = `${Math.floor(elapsedSeconds)}s elapsed`;
        if (progress.completed > 0 && progress.completed < progress.total) {
            const estimated = elapsedSeconds * (progress.total / progress.completed);
            const remaining = Math.max(0, estimated - elapsedSeconds);
            timing = remaining < 1 ? `${elapsedText} · almost done` : `${elapsedText} · ~${Math.ceil(remaining)}s left`;
        } else {
            timing = elapsedText;
        }
    }

    const analyze = () => dispatch(CleaningReportAsync());
    const abort = () => dispatch(Terminate());

    const cardStyle = {
        p: 3,
        borderRadius: 4,
        background: alpha(theme.palette.background.paper, 0.4),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        color: theme.palette.primary.contrastText,
                        display: 'flex'
                    }}>
                        <CleaningServices fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                            Cleaning
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Items you own that no priority ever picks, so you know what is safe to sell
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {running && <CircularProgress size={22} />}
                    {running ? (
                        <Button variant="contained" color="error" startIcon={<Stop />} onClick={abort} sx={{ borderRadius: 2, fontWeight: 700 }}>
                            Abort
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            startIcon={<AutoAwesome />}
                            onClick={analyze}
                            disabled={!hasOwned}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Analyze inventory
                        </Button>
                    )}
                </Box>
            </Box>

            {!hasOwned && (
                <Paper sx={{ ...cardStyle, textAlign: 'center', py: 8 }}>
                    <Box sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3
                    }}>
                        <Inventory2 sx={{ fontSize: 36 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                        No inventory yet
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 460, mx: 'auto' }}>
                        Import your save so the app knows which items you own. Then this page can tell you which of them are never used.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ImportSaveForm minimal label="Import save" />
                    </Box>
                </Paper>
            )}

            {hasOwned && running && (
                <Paper sx={cardStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                Analyzing your inventory
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Checking {owned.length.toLocaleString()} owned {owned.length === 1 ? 'item' : 'items'} against every priority to find what is never used.
                            </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                            {hasProgress ? `${percent}%` : '—'}
                        </Typography>
                    </Box>

                    <LinearProgress
                        variant={hasProgress ? 'determinate' : 'indeterminate'}
                        value={percent}
                        sx={{ height: 8, borderRadius: 1 }}
                    />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {hasProgress
                                ? `${progress.completed} / ${progress.total} priorities`
                                : 'Preparing item list…'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {phaseLabel ? `Analyzing ${phaseLabel}` : 'Starting'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {timing || ''}
                        </Typography>
                    </Box>
                </Paper>
            )}

            {hasOwned && !running && !hasReport && (
                <Paper sx={cardStyle}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        What this does
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        It takes every item you own and checks it against all priorities (NGUs, Wishes, Time Machine, and everything else).
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Anything that never appears in an optimal loadout is listed as unused, so you can decide what to sell in game. Nothing is changed automatically.
                    </Typography>
                    <Button variant="contained" startIcon={<AutoAwesome />} onClick={analyze} sx={{ borderRadius: 2, fontWeight: 700 }}>
                        Analyze inventory
                    </Button>
                </Paper>
            )}

            {hasOwned && !running && hasReport && (
                <>
                    {stale && (
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            Your inventory changed since this report was generated. Run the analysis again for fresh results.
                        </Alert>
                    )}

                    <CleaningSummary report={report} />

                    {nothingToClean ? (
                        <Paper sx={{ ...cardStyle, textAlign: 'center', py: 6 }}>
                            <CheckCircleOutline sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Nothing to clean
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Every item you own is either in use or still optimal for some priority.
                            </Typography>
                        </Paper>
                    ) : (
                        <CleaningTable report={report} itemdata={itemdata} />
                    )}

                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
                        Generated {new Date(report.generatedAt).toLocaleString()} · zone {report.zone} · report only, nothing is disabled
                    </Typography>
                </>
            )}
        </Box>
    );
};

export default Cleaning;
