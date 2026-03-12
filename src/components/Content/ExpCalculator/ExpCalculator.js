import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Grid,
    TextField,
    Chip,
    Typography,
    Alert,
    Divider,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { shorten } from '../../../util';

// ─── Constants ─────────────────────────────────────────────────────────────────
const STAT_DEFS = [
    { res: 'energy', stat: 'power', label: 'Power', cost: 150,       per: 1     },
    { res: 'energy', stat: 'cap',   label: 'Cap',   cost: 40,        per: 10000 },
    { res: 'energy', stat: 'bars',  label: 'Bars',  cost: 80,        per: 1     },
    { res: 'magic',  stat: 'power', label: 'Power', cost: 450,       per: 1     },
    { res: 'magic',  stat: 'cap',   label: 'Cap',   cost: 120,       per: 10000 },
    { res: 'magic',  stat: 'bars',  label: 'Bars',  cost: 240,       per: 1     },
    { res: 'res3',   stat: 'power', label: 'Power', cost: 15000000,  per: 1     },
    { res: 'res3',   stat: 'cap',   label: 'Cap',   cost: 4000000,   per: 10000 },
    { res: 'res3',   stat: 'bars',  label: 'Bars',  cost: 8000000,   per: 1     },
];

const RES_META = {
    energy: { label: 'Energy', color: '#f9a825' },
    magic:  { label: 'Magic',  color: '#1565c0' },
    res3:   { label: 'Flux',   color: '#c62828' },
};

const calcGain = (exp, cost, per) => Math.floor(exp / (cost / per));

export default function ExpCalculator() {
    const resourceStats = useSelector(state => state.optimizer.resourceStats);

    // ── Persisted state ─────────────────────────────────────────────────────────
    const [expSpend, setExpSpend] = useState(() =>
        localStorage.getItem('expCalc_expSpend') || '1000000'
    );

    const [totals, setTotals] = useState(() => {
        try {
            const saved = localStorage.getItem('expCalc_totals');
            if (saved) return JSON.parse(saved);
        } catch {}
        return {
            energy_power: '', energy_cap: '', energy_bars: '',
            magic_power:  '', magic_cap:  '', magic_bars:  '',
            res3_power:   '', res3_cap:   '', res3_bars:   '',
        };
    });

    const [ratios, setRatios] = useState(() => {
        try {
            const saved = localStorage.getItem('expCalc_ratios');
            if (saved) return JSON.parse(saved);
        } catch {}
        return {
            energy: { power: '1', cap: '37500', bars: '1' },
            magic:  { power: '1', cap: '37500', bars: '1' },
            res3:   { power: '1', cap: '37500', bars: '1' },
        };
    });

    const handleExpChange = val => {
        setExpSpend(val);
        localStorage.setItem('expCalc_expSpend', val);
    };

    const setTotal = (key, val) => setTotals(t => {
        const next = { ...t, [key]: val };
        localStorage.setItem('expCalc_totals', JSON.stringify(next));
        return next;
    });

    const setRatio = (res, stat, val) => setRatios(r => {
        const next = { ...r, [res]: { ...r[res], [stat]: val } };
        localStorage.setItem('expCalc_ratios', JSON.stringify(next));
        return next;
    });

    // ── Derived values ──────────────────────────────────────────────────────────
    const expAmount = parseFloat(expSpend) || 0;
    const hasSync   = !!resourceStats;

    const base = {
        energy_power: parseFloat(resourceStats?.energyPower) || 0,
        energy_cap:   parseFloat(resourceStats?.energyCap)   || 0,
        energy_bars:  parseFloat(resourceStats?.energyBars)  || 0,
        magic_power:  parseFloat(resourceStats?.magicPower)  || 0,
        magic_cap:    parseFloat(resourceStats?.magicCap)    || 0,
        magic_bars:   parseFloat(resourceStats?.magicBars)   || 0,
        res3_power:   parseFloat(resourceStats?.res3Power)   || 0,
        res3_cap:     parseFloat(resourceStats?.res3Cap)     || 0,
        res3_bars:    parseFloat(resourceStats?.res3Bars)    || 0,
    };

    // Individual stat rows (for the comparison table)
    const rows = useMemo(() => STAT_DEFS.map(def => {
        const key      = `${def.res}_${def.stat}`;
        const baseVal  = base[key] || 1;
        const totalVal = parseFloat(totals[key]) || 0;
        const mult     = totalVal > 0 && baseVal > 0 ? totalVal / baseVal : null;
        const gainBase = calcGain(expAmount, def.cost, def.per);
        const gainTotal = mult !== null ? gainBase * mult : null;
        const pct = baseVal > 1 ? (gainBase / baseVal) * 100 : 0;
        return { ...def, key, baseVal, totalVal, mult, gainBase, gainTotal, pct };
    }), [expAmount, base, totals]);

    const bestRow = useMemo(() =>
        rows.reduce((best, r) => r.pct > best.pct ? r : best, rows[0]),
    [rows]);

    // Ratio-based purchase calculation per resource
    const ratioResults = useMemo(() => Object.keys(RES_META).map(resId => {
        const defs  = STAT_DEFS.filter(d => d.res === resId);
        const rP = parseFloat(ratios[resId]?.power) || 0;
        const rC = parseFloat(ratios[resId]?.cap)   || 0;
        const rB = parseFloat(ratios[resId]?.bars)  || 0;
        const defPow  = defs.find(d => d.stat === 'power');
        const defCap  = defs.find(d => d.stat === 'cap');
        const defBars = defs.find(d => d.stat === 'bars');

        // Cost per "round" = cost of rP power + rC cap units + rB bars
        const expPerRound = rP * defPow.cost + rC * (defCap.cost / defCap.per) + rB * defBars.cost;
        const rounds  = expPerRound > 0 ? Math.floor(expAmount / expPerRound) : 0;
        const gainPow = rounds * rP;
        const gainCap = rounds * rC;
        const gainBar = rounds * rB;

        const basePow  = base[`${resId}_power`] || 0;
        const baseCap  = base[`${resId}_cap`]   || 0;
        const baseBars = base[`${resId}_bars`]  || 0;
        const totPow   = parseFloat(totals[`${resId}_power`]) || 0;
        const totCap   = parseFloat(totals[`${resId}_cap`])   || 0;
        const totBars  = parseFloat(totals[`${resId}_bars`])  || 0;
        const mP = totPow  > 0 && basePow  > 0 ? totPow  / basePow  : null;
        const mC = totCap  > 0 && baseCap  > 0 ? totCap  / baseCap  : null;
        const mB = totBars > 0 && baseBars > 0 ? totBars / baseBars : null;

        return {
            resId, rP, rC, rB, expPerRound, rounds,
            gainPow, gainCap, gainBar,
            basePow, baseCap, baseBars,
            totPow,  totCap,  totBars,
            gainTotPow:  mP !== null ? gainPow * mP : null,
            gainTotCap:  mC !== null ? gainCap * mC : null,
            gainTotBar:  mB !== null ? gainBar * mB : null,
        };
    }), [expAmount, ratios, base, totals]);

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>

            {/* ── EXP input + best recommendation ── */}
            <Grid container spacing={2} justifyContent="center" sx={{ mb: 2, width: '100%' }}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }} elevation={3}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    label="EXP to Spend"
                                    value={expSpend}
                                    onChange={e => handleExpChange(e.target.value)}
                                    type="number"
                                    fullWidth
                                    inputProps={{ step: 'any' }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                {!hasSync ? (
                                    <Alert severity="info" sx={{ py: 0 }}>
                                        Importe seu save na página inicial para carregar os stats base automaticamente.
                                    </Alert>
                                ) : bestRow && bestRow.pct > 0 ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StarIcon sx={{ color: '#FFB300', fontSize: 20 }} />
                                        <Typography variant="body2">
                                            Melhor stat individual:{' '}
                                            <strong style={{ color: RES_META[bestRow.res].color }}>
                                                {RES_META[bestRow.res].label} {bestRow.label}
                                            </strong>
                                            {' '}— +{bestRow.pct.toFixed(4)}%{bestRow.mult ? ' do total' : ' da base'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Digite um valor de EXP.
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {/* ── Multiplier calculator ── */}
            <Grid container spacing={2} justifyContent="center" sx={{ mb: 2, width: '100%' }}>
                {Object.entries(RES_META).map(([resId, meta]) => (
                    <Grid item xs={12} sm={4} key={resId}>
                        <Paper sx={{ p: 2 }} elevation={3}>
                            <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700, color: meta.color, borderBottom: `2px solid ${meta.color}`, pb: 0.5, mb: 1.5 }}
                            >
                                {meta.label} — Multiplicador
                            </Typography>
                            {STAT_DEFS.filter(d => d.res === resId).map(def => {
                                const key = `${resId}_${def.stat}`;
                                const b   = base[key];
                                const t   = parseFloat(totals[key]) || 0;
                                const m   = t > 0 && b > 0 ? (t / b) : null;
                                return (
                                    <Box key={key} sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                            {def.label}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <TextField
                                                label="Base"
                                                value={hasSync ? shorten(b) : ''}
                                                size="small"
                                                InputProps={{ readOnly: true }}
                                                placeholder="—"
                                                sx={{ flex: 1 }}
                                            />
                                            <TextField
                                                label="Total (jogo)"
                                                value={totals[key]}
                                                onChange={e => setTotal(key, e.target.value)}
                                                size="small"
                                                type="number"
                                                inputProps={{ step: 'any' }}
                                                sx={{ flex: 1 }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{ minWidth: 52, fontFamily: 'monospace', fontWeight: 700, color: m ? meta.color : 'text.disabled', textAlign: 'right' }}
                                            >
                                                {m ? `×${shorten(m, 2)}` : '×?'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* ── Ratio calculator ── */}
            <Grid container spacing={2} justifyContent="center" sx={{ mb: 2, width: '100%' }}>
                {ratioResults.map(r => {
                    const meta = RES_META[r.resId];
                    return (
                        <Grid item xs={12} sm={4} key={r.resId}>
                            <Paper sx={{ p: 2 }} elevation={3}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700, color: meta.color, borderBottom: `2px solid ${meta.color}`, pb: 0.5, mb: 1.5 }}
                                >
                                    {meta.label} — Compra por Ratio
                                </Typography>

                                {/* Ratio inputs */}
                                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                    {['power', 'cap', 'bars'].map(stat => (
                                        <TextField
                                            key={stat}
                                            label={stat.charAt(0).toUpperCase() + stat.slice(1)}
                                            value={ratios[r.resId][stat]}
                                            onChange={e => setRatio(r.resId, stat, e.target.value)}
                                            size="small"
                                            type="number"
                                            inputProps={{ step: 'any', min: 0 }}
                                            sx={{ flex: 1 }}
                                        />
                                    ))}
                                </Box>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                    Custo por round:{' '}
                                    <strong>{shorten(r.expPerRound)} EXP</strong>
                                    {' '}→{' '}
                                    <strong style={{ color: meta.color }}>{shorten(r.rounds)} rounds</strong>
                                </Typography>

                                <Divider sx={{ mb: 1 }} />

                                {/* Result rows */}
                                {[
                                    { label: 'Power', gain: r.gainPow, base: r.basePow, gainTot: r.gainTotPow, tot: r.totPow },
                                    { label: 'Cap',   gain: r.gainCap, base: r.baseCap, gainTot: r.gainTotCap, tot: r.totCap },
                                    { label: 'Bars',  gain: r.gainBar, base: r.baseBars,gainTot: r.gainTotBar, tot: r.totBars },
                                ].map(s => (
                                    <Box key={s.label} sx={{ mb: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{s.label}</Typography>
                                        {/* Base row */}
                                        {hasSync && s.base > 0 ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                                <Typography variant="inherit" color="text.secondary">{shorten(s.base)}</Typography>
                                                <Typography variant="inherit" color="text.disabled">→</Typography>
                                                <Typography variant="inherit" fontWeight={700}>{shorten(s.base + s.gain)}</Typography>
                                                <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>(+{shorten(s.gain)} base)</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="caption" color="text.disabled" display="block">base: —</Typography>
                                        )}
                                        {/* Total row */}
                                        {s.gainTot !== null ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                                <Typography variant="inherit" color="text.secondary">{shorten(s.tot)}</Typography>
                                                <Typography variant="inherit" color="text.disabled">→</Typography>
                                                <Typography variant="inherit" fontWeight={700}>{shorten(s.tot + s.gainTot)}</Typography>
                                                <Typography variant="caption" color="success.main" sx={{ ml: 0.5, color: meta.color }}>(+{shorten(s.gainTot)} total)</Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="caption" color="text.disabled" display="block">total: preencha multiplicador ↑</Typography>
                                        )}
                                    </Box>
                                ))}
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* ── Individual stat results table ── */}
            <Paper sx={{ width: '100%', overflowX: 'auto' }} elevation={3}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Recurso</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Stat</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">Multiplicador</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Base (atual → após compra)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">Total (atual → após compra)</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">% Ganho</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.keys(RES_META).map(resId => {
                            const meta = RES_META[resId];
                            return rows.filter(r => r.res === resId).map((row, i) => {
                                const isBest     = bestRow && row.key === bestRow.key && row.pct === bestRow.pct && row.pct > 0;
                                const baseAfter  = row.baseVal + row.gainBase;
                                const totalAfter = row.gainTotal !== null ? row.totalVal + row.gainTotal : null;
                                return (
                                    <TableRow key={row.key} sx={isBest ? { backgroundColor: 'rgba(76,175,80,0.12)' } : {}}>
                                        {i === 0 && (
                                            <TableCell rowSpan={3} sx={{ fontWeight: 700, color: meta.color, verticalAlign: 'middle', borderRight: '1px solid rgba(224,224,224,1)' }}>
                                                {meta.label}
                                            </TableCell>
                                        )}
                                        <TableCell>{row.label}</TableCell>
                                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: row.mult ? meta.color : 'text.disabled' }}>
                                            {row.mult ? `×${shorten(row.mult, 2)}` : '×?'}
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontFamily: 'monospace' }}>
                                            {hasSync && row.baseVal > 0 ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <Typography variant="inherit" color="text.secondary">{shorten(row.baseVal)}</Typography>
                                                    <Typography variant="inherit" color="text.disabled">→</Typography>
                                                    <Typography variant="inherit" fontWeight={700}>{shorten(baseAfter)}</Typography>
                                                    <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>(+{shorten(row.gainBase)})</Typography>
                                                </Box>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontFamily: 'monospace' }}>
                                            {totalAfter !== null ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                    <Typography variant="inherit" color="text.secondary">{shorten(row.totalVal)}</Typography>
                                                    <Typography variant="inherit" color="text.disabled">→</Typography>
                                                    <Typography variant="inherit" fontWeight={700}>{shorten(totalAfter)}</Typography>
                                                    <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>(+{shorten(row.gainTotal)})</Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">Preencha o Total ↑</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={`+${row.pct.toFixed(3)}%`}
                                                size="small"
                                                icon={isBest ? <StarIcon sx={{ fontSize: '14px !important' }} /> : undefined}
                                                sx={{
                                                    fontWeight: 700,
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.72rem',
                                                    bgcolor: isBest ? 'rgba(76,175,80,0.18)' : 'transparent',
                                                    color: isBest ? 'success.dark' : 'text.secondary',
                                                    border: isBest ? '1px solid rgba(76,175,80,0.4)' : '1px solid transparent',
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            });
                        })}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
