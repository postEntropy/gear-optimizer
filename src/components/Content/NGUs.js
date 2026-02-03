import React, { Component } from 'react';
import ReactGA from 'react-ga';
import {
    TextField, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, Checkbox,
    FormControlLabel, Paper, Box, Grid, Typography, Select, MenuItem, Switch
} from '@mui/material';
import { NGU } from '../../NGU'
import { NGUs } from '../../assets/ItemAux';
import { shorten } from '../../util';
import ModifierForm from '../ModifierForm/ModifierForm';


import Loading from '../Loading/Loading';
import NGUTimeline from '../NGUGraph/NGUTimeline';
import NGUGraph from '../NGUGraph/NGUGraph';
import NGUComparisonGraph from '../NGUGraph/NGUComparisonGraph';
import IconButton from '@mui/material/IconButton';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Collapse from '@mui/material/Collapse';

const formatValue = (val, isPercent = true) => {
    if (val === '' || val === undefined || val === null || isNaN(val)) return '';
    let num = Number(val);
    if (isPercent) num *= 100;

    if (num <= 0) return num.toLocaleString(undefined, { maximumFractionDigits: 0 }) + (isPercent ? '%' : '');
    if (num < 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 0 }) + (isPercent ? '%' : '');

    const units = [
        "Million", "Billion", "Trillion", "Quadrillion", "Quintillion",
        "Sextillion", "Septillion", "Octillion", "Nonillion", "Decillion"
    ];

    let order = Math.floor(Math.log10(num) / 3);
    let unitIndex = order - 2;

    if (unitIndex < 0) return num.toLocaleString(undefined, { maximumFractionDigits: 0 }) + (isPercent ? '%' : '');

    if (unitIndex >= units.length) return num.toExponential(3) + (isPercent ? '%' : '');

    let suffix = units[unitIndex];
    let scaled = num / Math.pow(10, order * 3);

    return `${scaled.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${suffix}${isPercent ? '%' : ''}`;
};

class NGUComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sortConfig: { key: 'reachable_level', direction: 'descending' },
            timeUnit: 'minutes',
            isReady: false,
            expandedRows: {} // Store expanded state like { 'energy-0': true }
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.requestSort = this.requestSort.bind(this);
        this.toggleRow = this.toggleRow.bind(this);
    }

    componentDidMount() {
        setTimeout(() => this.setState({ isReady: true }), 300);
    }

    requestSort(key) {
        let direction = 'descending';
        if (this.state.sortConfig.key === key && this.state.sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        this.setState({ sortConfig: { key, direction } });
    }

    handleFocus(event) {
        event.target.select();
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    toggleRow(rowId) {
        this.setState(prevState => ({
            expandedRows: {
                ...prevState.expandedRows,
                [rowId]: !prevState.expandedRows[rowId]
            }
        }));
    }

    handleChange(event, name, idx = -1, isMagic = -1) {
        let val = event.target.value;
        let ngustats = {
            ...this.props.ngustats
        };
        if (idx < 0 && isMagic < 0) {
            if (name === 'e2n' || name === 's2e') {
                ngustats = {
                    ...ngustats,
                    quirk: {
                        ...ngustats.quirk,
                        [name]: !this.props.ngustats.quirk[name]
                    }
                };
                this.props.handleSettings('ngustats', ngustats);
                return;
            }
            ngustats = {
                ...ngustats,
                [name]: val
            };
            if (ngustats.ngutime > 365 * 1440) {
                ngustats.ngutime = 365 * 1440
            }
            this.props.handleSettings('ngustats', ngustats);
            return;
        }
        const resource = isMagic === 1
            ? 'magic'
            : 'energy';
        if (idx < 0) {
            ngustats = {
                ...ngustats,
                [resource]: {
                    ...ngustats[resource],
                    [name]: val
                }
            };
            this.props.handleSettings('ngustats', ngustats);
            return;
        }
        let ngus = {
            ...ngustats[resource].ngus
        };
        let ngu = {
            ...ngus[idx],
            [name]: val
        };
        ngus[idx] = ngu;
        ngustats = {
            ...ngustats,
            [resource]: {
                ...ngustats[resource],
                ngus: ngus
            }
        };
        this.props.handleSettings('ngustats', ngustats);

    }

    sortHandler(key) {
        return () => this.requestSort(key);
    }

    render() {
        if (!this.state.isReady) return <Loading />;
        ReactGA.pageview('/ngus/');
        let nguOptimizer = new NGU(this.props);
        const energy = this.props.ngustats.energy;
        const magic = this.props.ngustats.magic;
        const ngutime = this.props.ngustats.ngutime;
        const { key, direction } = this.state.sortConfig;

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <form onSubmit={this.handleSubmit}>
                    <Grid container spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2 }} elevation={3}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={3}>
                                        <TextField label="Energy cap" value={energy.cap}
                                            onChange={(e) => this.handleChange(e, 'cap', -1, 0)} onFocus={this.handleFocus}
                                            type="number" fullWidth inputProps={{ step: "any" }}
                                            helperText={formatValue(energy.cap, false)} />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <TextField label="Energy NGU speed" value={energy.nguspeed}
                                            onChange={(e) => this.handleChange(e, 'nguspeed', -1, 0)} onFocus={this.handleFocus}
                                            type="number" fullWidth inputProps={{ step: "any" }}
                                            helperText={formatValue(energy.nguspeed, true)} />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <TextField label="Magic cap" value={magic.cap}
                                            onChange={(e) => this.handleChange(e, 'cap', -1, 1)} onFocus={this.handleFocus}
                                            type="number" fullWidth inputProps={{ step: "any" }}
                                            helperText={formatValue(magic.cap, false)} />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <TextField label="Magic NGU speed" value={magic.nguspeed}
                                            onChange={(e) => this.handleChange(e, 'nguspeed', -1, 1)} onFocus={this.handleFocus}
                                            type="number" fullWidth inputProps={{ step: "any" }}
                                            helperText={formatValue(magic.nguspeed, true)} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Select
                                                value={this.state.timeUnit}
                                                onChange={(e) => this.setState({ timeUnit: e.target.value })}
                                                size="small"
                                                sx={{ width: 120 }}
                                            >
                                                <MenuItem value="minutes">Minutes</MenuItem>
                                                <MenuItem value="hours">Hours</MenuItem>
                                            </Select>
                                            <TextField
                                                label="NGU Time"
                                                value={this.state.timeUnit === 'hours' ? Math.round((ngutime / 60) * 100) / 100 : ngutime}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    const minutes = this.state.timeUnit === 'hours' ? val * 60 : val;
                                                    this.handleChange({ target: { value: minutes } }, 'ngutime');
                                                }}
                                                onFocus={this.handleFocus}
                                                type="number"
                                                fullWidth
                                                inputProps={{ step: "any" }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={4}>
                                        <FormControlLabel control={<Checkbox checked={this.props.ngustats.quirk.e2n} onChange={(e) => this.handleChange(e, 'e2n')} />} label="Evil -> Normal Quirk" />
                                    </Grid>
                                    <Grid item xs={6} sm={4}>
                                        <FormControlLabel control={<Checkbox checked={this.props.ngustats.quirk.s2e} onChange={(e) => this.handleChange(e, 's2e')} />} label="Sadistic -> Evil Quirk" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={this.props.highlightBest}
                                                    onChange={() => this.props.handleSettings('highlightBest', !this.props.highlightBest)}
                                                    color="primary"
                                                />
                                            }
                                            label="Highlight Best Gain"
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                            <ModifierForm {...this.props} name={'ngustats'} e={true} m={true} r={false} />
                        </Grid>
                    </Grid>

                    <Paper sx={{ width: '100%', overflowX: 'auto' }} elevation={3}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" />
                                    <TableCell>
                                        <TableSortLabel active={key === 'name'} direction={key === 'name' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('name')}>
                                            Name
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'normal'} direction={key === 'normal' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('normal')}>
                                            Normal Level
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'evil'} direction={key === 'evil' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('evil')}>
                                            Evil Level
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'sadistic'} direction={key === 'sadistic' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('sadistic')}>
                                            Sadistic Level
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'bonus'} direction={key === 'bonus' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('bonus')}>
                                            Current Bonus
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'reachable_normal_change'} direction={key === 'reachable_normal_change' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('reachable_normal_change')}>
                                            Reachable Normal Level<br />(Bonus Change)
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'reachable_evil_change'} direction={key === 'reachable_evil_change' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('reachable_evil_change')}>
                                            Reachable Evil Level<br />(Bonus Change)
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'reachable_sadistic_change'} direction={key === 'reachable_sadistic_change' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('reachable_sadistic_change')}>
                                            Reachable Sadistic Level<br />(Bonus Change)
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    ['energy', 'magic'].map((resource) => {
                                        const isMagic = resource === 'magic' ? 1 : 0;
                                        let stats = this.props.ngustats[resource].ngus;

                                        // Pre-calculate data for sorting
                                        let data = NGUs[resource].map((ngu, pos) => {
                                            const bonus = nguOptimizer.bonus(ngu, stats[pos]);
                                            const reachable = nguOptimizer.reachableBonus(stats[pos], ngutime, pos, isMagic, this.props.ngustats.quirk);

                                            return {
                                                pos,
                                                ngu,
                                                name: ngu.name,
                                                normal: stats[pos].normal,
                                                evil: stats[pos].evil,
                                                sadistic: stats[pos].sadistic,
                                                bonus: bonus,
                                                reachable: reachable,
                                                // Flattening somewhat for sorting
                                                reachable_level: reachable.level.normal,
                                                reachable_evil: reachable.level.evil,
                                                reachable_sadistic: reachable.level.sadistic,
                                                // Calculate change factors for sorting
                                                reachable_normal_change: reachable.bonus.normal / bonus,
                                                reachable_evil_change: reachable.bonus.evil / bonus,
                                                reachable_sadistic_change: reachable.bonus.sadistic / bonus
                                            };
                                        });

                                        // Sort
                                        if (this.state.sortConfig.key) {
                                            data.sort((a, b) => {
                                                if (a[this.state.sortConfig.key] < b[this.state.sortConfig.key]) {
                                                    return this.state.sortConfig.direction === 'ascending' ? -1 : 1;
                                                }
                                                if (a[this.state.sortConfig.key] > b[this.state.sortConfig.key]) {
                                                    return this.state.sortConfig.direction === 'ascending' ? 1 : -1;
                                                }
                                                return 0;
                                            });
                                        }

                                        // Find max changes for highlighting
                                        const maxNormal = Math.max(1.00000001, ...data.map(d => d.reachable_normal_change));
                                        const maxEvil = Math.max(1.00000001, ...data.map(d => d.reachable_evil_change));
                                        const maxSadistic = Math.max(1.00000001, ...data.map(d => d.reachable_sadistic_change));

                                        const rows = data.map((item) => {
                                            const { pos, ngu, bonus, reachable } = item;
                                            const rowId = `${resource}-${pos}`;
                                            const isExpanded = !!this.state.expandedRows[rowId];

                                            const isBestNormal = this.props.highlightBest && item.reachable_normal_change === maxNormal;
                                            const isBestEvil = this.props.highlightBest && item.reachable_evil_change === maxEvil;
                                            const isBestSadistic = this.props.highlightBest && item.reachable_sadistic_change === maxSadistic;
                                            const isBestAny = isBestNormal || isBestEvil || isBestSadistic;

                                            return [
                                                <TableRow key={rowId} sx={isBestAny ? { backgroundColor: 'rgba(76, 175, 80, 0.12) !important' } : {}}>
                                                    <TableCell padding="checkbox">
                                                        <IconButton size="small" onClick={() => this.toggleRow(rowId)}>
                                                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <AccessTimeIcon fontSize="small" />}
                                                        </IconButton>
                                                    </TableCell>
                                                    <TableCell component="th" scope="row" sx={isBestAny ? { fontWeight: 'bold' } : {}}>{ngu.name}</TableCell>
                                                    <TableCell>
                                                        <TextField type="number" value={stats[pos].normal}
                                                            onFocus={this.handleFocus} onChange={(e) => this.handleChange(e, 'normal', pos, isMagic)}
                                                            inputProps={{ step: "any" }} sx={{ width: 140 }} hiddenLabel size="small" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField type="number" value={stats[pos].evil}
                                                            onFocus={this.handleFocus} onChange={(e) => this.handleChange(e, 'evil', pos, isMagic)}
                                                            inputProps={{ step: "any" }} sx={{ width: 140 }} hiddenLabel size="small" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField type="number" value={stats[pos].sadistic}
                                                            onFocus={this.handleFocus} onChange={(e) => this.handleChange(e, 'sadistic', pos, isMagic)}
                                                            inputProps={{ step: "any" }} sx={{ width: 140 }} hiddenLabel size="small" />
                                                    </TableCell>
                                                    <TableCell sx={isBestAny ? { fontWeight: 'bold' } : {}}>{'×' + shorten(bonus * 100) + '%'}</TableCell>
                                                    <TableCell sx={isBestNormal ? { fontWeight: 'bold' } : {}}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            {isBestNormal && <StarIcon sx={{ color: '#FFD700', fontSize: '1rem' }} />}
                                                            {shorten(reachable.level.normal)} (×{shorten(reachable.bonus.normal / bonus, 4)}) {Math.round((reachable.bonus.normal / bonus - 1) * 100) !== 0 && <span style={{ color: 'green', fontWeight: 'bold' }}>({Math.abs((reachable.bonus.normal / bonus - 1) * 100 % 1) > 0.01 ? '~' : ''}{Math.round((reachable.bonus.normal / bonus - 1) * 100)}%)</span>}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={isBestEvil ? { fontWeight: 'bold' } : {}}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            {isBestEvil && <StarIcon sx={{ color: '#FFD700', fontSize: '1rem' }} />}
                                                            {shorten(reachable.level.evil)} (×{shorten(reachable.bonus.evil / bonus, 4)}) {Math.round((reachable.bonus.evil / bonus - 1) * 100) !== 0 && <span style={{ color: 'green', fontWeight: 'bold' }}>({Math.abs((reachable.bonus.evil / bonus - 1) * 100 % 1) > 0.01 ? '~' : ''}{Math.round((reachable.bonus.evil / bonus - 1) * 100)}%)</span>}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={isBestSadistic ? { fontWeight: 'bold' } : {}}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            {isBestSadistic && <StarIcon sx={{ color: '#FFD700', fontSize: '1rem' }} />}
                                                            {shorten(reachable.level.sadistic)} (×{shorten(reachable.bonus.sadistic / bonus, 4)}) {Math.round((reachable.bonus.sadistic / bonus - 1) * 100) !== 0 && <span style={{ color: 'green', fontWeight: 'bold' }}>({Math.abs((reachable.bonus.sadistic / bonus - 1) * 100 % 1) > 0.01 ? '~' : ''}{Math.round((reachable.bonus.sadistic / bonus - 1) * 100)}%)</span>}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>,
                                                <TableRow key={rowId + '-chart'}>
                                                    <TableCell colSpan={9} sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                            <Box sx={{ p: 2 }}>
                                                                <NGUTimeline
                                                                    {...this.props}
                                                                    ngu={{ ...ngu, levels: stats[pos], pos }}
                                                                    isMagic={isMagic}
                                                                />
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            ];
                                        });

                                        return [
                                            <TableRow key={resource + '_header'}
                                                sx={{ backgroundColor: 'action.hover' }}>
                                                <TableCell colSpan={9}
                                                    sx={{ backgroundColor: 'action.hover', typography: 'subtitle1', fontWeight: 700 }}>
                                                    {resource.charAt(0).toUpperCase() + resource.slice(1) + ' NGUs'}
                                                </TableCell>
                                            </TableRow>,
                                            ...rows.flat(),
                                            <TableRow key={resource + '_summary_chart'}>
                                                <TableCell colSpan={9} sx={{ p: 0 }}>
                                                    <Box sx={{ p: 3 }}>
                                                        <NGUComparisonGraph
                                                            {...this.props}
                                                            ngusData={data}
                                                            isMagic={isMagic}
                                                            title={`${resource.charAt(0).toUpperCase() + resource.slice(1)} NGUs Comparison`}
                                                        />
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ];
                                    })
                                }
                            </TableBody>
                        </Table>
                    </Paper>
                </form>
            </Box>
        );
    };
}

export default NGUComponent;
