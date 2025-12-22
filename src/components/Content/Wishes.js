import React, { Component } from 'react';
import ReactGA from 'react-ga';
import {
    TextField, Table, TableBody, TableCell, TableHead, TableRow, Checkbox,
    FormControlLabel, Paper, Box, Grid, Typography, Divider, Button, InputAdornment, Select, MenuItem
} from '@mui/material';
import { Wish } from '../../Wish';
import { Wishes } from '../../assets/ItemAux';
import ResourcePriorityForm from '../ResourcePriorityForm/ResourcePriorityForm';
import WishForm from '../WishForm/WishForm';
import { default as Crement } from '../Crement/Crement';
import { shortenExponential, toTime } from '../../util';
import ModifierForm from '../ModifierForm/ModifierForm';

import Loading from '../Loading/Loading';

class WishComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            timeUnit: 'minutes',
            isReady: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        setTimeout(() => this.setState({ isReady: true }), 300);
    }

    handleFocus(event) {
        event.target.select();
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    handleChange(event, name, idx = -1) {
        let val = event.target.value;
        if (event.target.type === 'checkbox') {
            val = event.target.checked;
        }
        let wishstats = {
            ...this.props.wishstats
        };
        if (idx < 0) {
            wishstats = {
                ...wishstats,
                [name]: val
            };
            this.props.handleSettings('wishstats', wishstats);
            return;
        }
        let wishes = [...wishstats.wishes];
        const increasedStart = name === 'start' && Number(val) > wishes[idx].start;
        let wish = {
            ...wishes[idx],
            [name]: val
        };
        wish.goal = this.goallevel(wish, increasedStart);
        wish.start = this.startlevel(wish);
        wishes[idx] = wish;
        wishstats = {
            ...wishstats,
            wishes: wishes
        };
        this.props.handleSettings('wishstats', wishstats);
    }

    goallevel(data, increasedStart) {
        data.goal = Number(data.goal)
        if (increasedStart) {
            data.start = Number(data.start)
            if (data.start >= data.goal) {
                data.goal = data.start + 1;
            }
        }
        if (data.goal < 1) {
            return 0;
        }
        if (data.goal > Wishes[data.wishidx][2]) {
            return Wishes[data.wishidx][2];
        }
        return data.goal;
    }

    startlevel(data) {
        data.start = Number(data.start)
        if (data.start < 0 || data.goal === 0) {
            return 0;
        }
        if (data.start >= data.goal) {
            return data.goal - 1;
        }
        return data.start;
    }

    wishtime(data) {
        if (data.wishtime < (data.goal - data.start) * data.wishcap) {
            return (data.goal - data.start) * data.wishcap;
        }
        return data.wishtime;
    }

    copyToClipboard(e) {
        e.target.select();
        document.execCommand('copy');
    };

    render() {
        if (!this.state.isReady) return <Loading />;
        ReactGA.pageview('/wishes/');
        let wishOptimizer = new Wish(this.props);
        const results = wishOptimizer.optimize();
        const score = toTime(Math.max(...results[0]));
        const scores = results[0];
        const assignments = results[1];
        const remaining = results[2];
        const trueScores = results[3];

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <form onSubmit={this.handleSubmit}>
                    <Grid container spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                        {['eE', 'mM', 'rR'].map(x => (
                            <Grid item xs={12} md={4} key={x}>
                                <Paper sx={{ p: 2 }}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle1" align="center">{x[1] + ' power'}</Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Power"
                                                type="number"

                                                fullWidth
                                                value={this.props.wishstats[x[0] + 'pow']}
                                                onChange={(e) => this.handleChange(e, x[0] + 'pow')}
                                                onFocus={this.handleFocus}
                                                inputProps={{ step: "any" }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Cap"
                                                type="number"

                                                fullWidth
                                                value={this.props.wishstats[x[0] + 'cap']}
                                                onChange={(e) => this.handleChange(e, x[0] + 'cap')}
                                                onFocus={this.handleFocus}
                                                inputProps={{ step: "any" }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Use (%)"
                                                type="number"

                                                fullWidth
                                                value={this.props.wishstats[x[0] + 'pct']}
                                                onChange={(e) => this.handleChange(e, x[0] + 'pct')}
                                                onFocus={this.handleFocus}
                                                inputProps={{ step: "any" }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={6} sm={4}>
                                <TextField
                                    label="Wish speed modifier"
                                    type="number"

                                    fullWidth
                                    value={this.props.wishstats.wishspeed}
                                    onChange={(e) => this.handleChange(e, 'wishspeed')}
                                    onFocus={this.handleFocus}
                                    inputProps={{ step: "any" }}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4}>
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
                                        label="Wish Time"
                                        type="number"
                                        fullWidth
                                        value={this.state.timeUnit === 'hours' ? Math.round((this.props.wishstats.wishcap / 60) * 100) / 100 : this.props.wishstats.wishcap}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            const minutes = this.state.timeUnit === 'hours' ? val * 60 : val;
                                            this.handleChange({ target: { value: minutes } }, 'wishcap');
                                        }}
                                        onFocus={this.handleFocus}
                                        inputProps={{ step: "any" }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={this.props.wishstats.equalResources}
                                            onChange={(e) => this.props.handleSettings('wishstats', {
                                                ...this.props.wishstats,
                                                equalResources: !this.props.wishstats.equalResources
                                            })}
                                        />
                                    }
                                    label="Equal resources"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <ModifierForm {...this.props} name={'wishstats'} e={true} m={true} r={true} />
                            </Grid>
                            <Grid item xs={12}>
                                <ResourcePriorityForm {...this.props} handleChange={this.handleChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <Crement header='Wish slots' value={this.props.wishstats.wishes.length} name='wishslots'
                                    handleClick={this.props.handleCrement} min={1} max={100} />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Box sx={{ mb: 2 }}>
                        {this.props.wishstats.wishes.map((wish, pos) => (
                            <Paper key={pos} sx={{ p: 2, mb: 2 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12}>
                                        {[Wishes.keys()].map(idx => (
                                            <div style={{ display: 'inline' }} key={'wishform' + pos}>
                                                <WishForm {...this.props} handleChange={this.handleChange} wishidx={wish.wishidx} idx={pos} />
                                            </div>
                                        ))}
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Start level"
                                            type="number"

                                            fullWidth
                                            value={this.props.wishstats.wishes[pos].start}
                                            onChange={(e) => this.handleChange(e, 'start', pos)}
                                            onFocus={this.handleFocus}
                                            inputProps={{ step: "any" }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label="Target level"
                                            type="number"

                                            fullWidth
                                            value={this.props.wishstats.wishes[pos].goal}
                                            onChange={(e) => this.handleChange(e, 'goal', pos)}
                                            onFocus={this.handleFocus}
                                            inputProps={{ step: "any" }}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}
                    </Box>

                    <Paper sx={{ mb: 2, overflowX: 'auto' }}>
                        <Table size="small">
                            <TableBody>
                                {assignments.map((a, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>Wish {this.props.wishstats.wishes[idx].wishidx} requires:</TableCell>
                                        {a.map((val, jdx) => (
                                            <TableCell key={jdx}>
                                                <TextField
                                                    hiddenLabel size="small"
                                                    value={shortenExponential(val)}
                                                    InputProps={{
                                                        readOnly: true,
                                                        endAdornment: <InputAdornment position="end">{['E', 'M', 'R'][jdx]}</InputAdornment>
                                                    }}
                                                    onClick={this.copyToClipboard}
                                                    sx={{ width: '12ch' }}
                                                />
                                            </TableCell>
                                        ))}
                                        <TableCell>{toTime(scores[idx])}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>

                    <Typography variant="body1" align="center" gutterBottom>
                        After {score} all targets will be reached.
                    </Typography>

                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2} alignItems="center" justifyContent="center">
                            <Grid item>
                                <Typography>Spare resources:</Typography>
                            </Grid>
                            {remaining.map((val, jdx) => (
                                <Grid item key={jdx}>
                                    <TextField
                                        hiddenLabel size="small"
                                        value={shortenExponential(val)}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: <InputAdornment position="end">{['E', 'M', 'R'][jdx]}</InputAdornment>
                                        }}
                                        onClick={this.copyToClipboard}
                                        sx={{ width: '12ch' }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={this.props.wishstats.trueTime}
                                    onChange={(e) => this.props.handleSettings('wishstats', {
                                        ...this.props.wishstats,
                                        trueTime: !this.props.wishstats.trueTime
                                    })}
                                />
                            }
                            label="Wish time estimation"
                        />
                        {this.props.wishstats.trueTime && (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Wish</TableCell>
                                        <TableCell>in theory</TableCell>
                                        <TableCell>in practice</TableCell>
                                        <TableCell>stops at</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {this.props.wishstats.wishes.map((wish, pos) => (
                                        <TableRow key={pos}>
                                            <TableCell>{wish.wishidx + ' (' + wish.start + ' → ' + wish.goal + ')'}</TableCell>
                                            <TableCell>{toTime(scores[pos])}</TableCell>
                                            <TableCell>{toTime(trueScores[pos][1])}</TableCell>
                                            <TableCell>{"level " + trueScores[pos][2]}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Paper>
                </form>
            </Box>
        );
    };
}

export default WishComponent;
