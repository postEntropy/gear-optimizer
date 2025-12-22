import React, { Component } from 'react';
import ReactGA from 'react-ga';
import {
    TextField, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, Checkbox,
    FormControlLabel, Paper, Box, Grid, Button, IconButton, MenuItem, Typography, InputAdornment, Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Hack } from '../../Hack';
import { Hacks } from '../../assets/ItemAux';
import { shorten, toTime } from '../../util';
import ModifierForm from '../ModifierForm/ModifierForm';

import Loading from '../Loading/Loading';

class HackComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hackoption: this.props.hackstats.hackoption,
            sortConfig: { key: 'change', direction: 'descending' },
            isReady: false
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.requestSort = this.requestSort.bind(this);
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

    handleChange(event, name, idx = -1) {
        let val = event.target ? event.target.value : event.value;
        if (event.target && event.target.type === 'checkbox') {
            val = event.target.checked;
        }

        let hackstats = {
            ...this.props.hackstats
        };
        if (idx < 0) {
            hackstats = {
                ...hackstats,
                [name]: val
            };
            this.props.handleSettings('hackstats', hackstats);
            return;
        }

        if (name === 'msdown') {
            let hacks = [...hackstats.hacks];
            let hack = {
                ...hacks[idx],
                goal: this.milestone(
                    {
                        level: hacks[idx].goal,
                        hackidx: idx
                    }
                )
            };
            hacks[idx] = hack;
            hackstats = {
                ...hackstats,
                hacks: hacks
            };
            this.props.handleSettings('hackstats', hackstats);
            return;
        }

        if (name === 'msup') {
            let hacks = [...hackstats.hacks];
            let hack = {
                ...hacks[idx],
                goal: this.milestone(
                    {
                        level: hacks[idx].goal,
                        hackidx: idx,
                        next: true
                    }
                )
            };
            hacks[idx] = hack;
            hackstats = {
                ...hackstats,
                hacks: hacks
            };
            this.props.handleSettings('hackstats', hackstats);
            return;

        }

        let hacks = [...hackstats.hacks];
        // Special case for 'hacks' full update
        if (name === 'hacks') {
            hacks = val;
            // In original code: event.target.value was hacks array passed via object structure
            // We'll adapt.
        } else {
            let hack = {
                ...hacks[idx],
                [name]: val
            };
            hacks[idx] = hack;
        }

        hackstats = {
            ...hackstats,
            hacks: hacks
        };
        this.props.handleSettings('hackstats', hackstats);

    }

    // Helper to handle the complex object passed in original code for buttons
    handleButtonChange(val, name, idx) {
        if (name === 'hacks') {
            // val is { target: { value: hacks } }
            this.props.handleSettings('hackstats', {
                ...this.props.hackstats,
                hacks: val.target.value
            });
            return;
        }
        // val is { target: { value: ... } }
        this.handleChange({ target: { value: val.target.value } }, name, idx);
    }

    milestone(data) {
        if (data.next) {
            let n = 0;
            let level = 10;
            while (level <= data.level) {
                n++;
                level = Math.floor((n * 10 + 10) * Math.pow(1.1, n));
            }
            let levelCap = Hacks[data.hackidx][5];
            if (level > levelCap) {
                return levelCap;
            }
            return level;
        }
        let n = 0;
        let level = 10;
        let prev = 0;
        while (level < data.level) {
            n++;
            prev = level;
            level = Math.floor((n * 10 + 10) * Math.pow(1.1, n));
        }
        return prev;
    }

    level(data) {
        data.level = Number(data.level);
        if (data.level < 0) {
            return 0;
        }
        let levelCap = Hacks[data.hackidx][5];
        if (data.level > levelCap) {
            return levelCap;
        }
        return data.level;
    }

    startlevel(data) {
        data.level = Number(data.level)
        if (data.level <= 0) {
            return 0;
        }
        let levelCap = Hacks[data.hackidx][5];
        if (data.level > levelCap) {
            return levelCap;
        }
        return data.level;
    }

    reducer(data) {
        data.reducer = Number(data.reducer)
        if (data.reducer < 1) {
            return 0;
        }
        let milestone = Hacks[data.hackidx][4];
        if (data.reducer > milestone - 2) {
            return milestone - 2;
        }
        return data.reducer;
    }

    sortHandler(key) {
        return () => this.requestSort(key);
    }

    render() {
        if (!this.state.isReady) return <Loading />;
        ReactGA.pageview('/hacks/');
        let hackOptimizer = new Hack(this.props);
        const hacktime = this.props.hackstats.hacktime;
        const options = [0, 1, 2];
        const option = this.props.hackstats.hackoption;
        const stateOption = this.state.hackoption; // For Select value logic

        let sumtime = 0;
        let hackhacktime = 0;
        let hackhackchange = 1;

        // Sync state if props changed
        if (this.state.hackoption !== this.props.hackstats.hackoption) {
            // We should use componentDidUpdate or getDerivedStateFromProps usually, 
            // but following existing pattern for now (though anti-pattern in render)
            // We'll rely on props for value mostly.
        }

        const { key, direction } = this.state.sortConfig;

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <form onSubmit={this.handleSubmit}>
                    <Grid container spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2 }} elevation={3}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={4}>
                                        <TextField label="R power" value={this.props.hackstats['rpow']}
                                            onChange={(e) => this.handleChange(e, 'rpow')} onFocus={this.handleFocus}
                                            type="number" fullWidth inputProps={{ step: "any" }} />
                                    </Grid>
                                    <Grid item xs={6} sm={4}>
                                        <TextField label="R cap" value={this.props.hackstats['rcap']}
                                            onChange={(e) => this.handleChange(e, 'rcap')} onFocus={this.handleFocus}
                                            type="number" fullWidth inputProps={{ step: "any" }} />
                                    </Grid>
                                    <Grid item xs={6} sm={4}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                            <TextField label="Hack speed" value={this.props.hackstats.hackspeed}
                                                onChange={(e) => this.handleChange(e, 'hackspeed')} onFocus={this.handleFocus}
                                                type="number" fullWidth inputProps={{ step: "any" }} />
                                            <FormControlLabel
                                                control={<Checkbox checked={this.props.hackstats.lockSpeed}
                                                    onChange={(e) => this.props.handleSettings('hackstats', {
                                                        ...this.props.hackstats,
                                                        lockSpeed: !this.props.hackstats.lockSpeed
                                                    })} size="small" />}
                                                label="Lock"
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={6}>
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
                                                label="Hack Time"
                                                value={this.state.timeUnit === 'hours' ? Math.round((hacktime / 60) * 100) / 100 : hacktime}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    const minutes = this.state.timeUnit === 'hours' ? val * 60 : val;
                                                    this.handleChange({ target: { value: minutes } }, 'hacktime');
                                                }}
                                                onFocus={this.handleFocus}
                                                type="number"
                                                fullWidth
                                                inputProps={{ step: "any" }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={6}>
                                        <TextField
                                            select
                                            label="Hack Optimizer Mode"
                                            value={stateOption}
                                            onChange={(e) => {
                                                this.setState({ hackoption: e.target.value });
                                                this.handleChange(e, 'hackoption');
                                            }}

                                            fullWidth
                                        >
                                            {options.map((opt, idx) => (
                                                <MenuItem value={idx} key={idx}>
                                                    {[
                                                        'level target.', 'max level in ' + toTime(hacktime * 60 * 50),
                                                        'max MS in ' + toTime(hacktime * 60 * 50)
                                                    ][idx]}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                </Grid>
                            </Paper>
                            <ModifierForm {...this.props} name={'hackstats'} e={false} m={false} r={true} />
                        </Grid>
                    </Grid>

                    <Paper sx={{ width: '100%', overflowX: 'auto' }} elevation={3}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel active={key === 'name'} direction={key === 'name' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('name')}>
                                            Hack
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'reducer'} direction={key === 'reducer' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('reducer')}>
                                            Milestone<br />Reducers
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'level'} direction={key === 'level' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('level')}>
                                            Level
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'bonus'} direction={key === 'bonus' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('bonus')}>
                                            Bonus
                                        </TableSortLabel>
                                    </TableCell>
                                    {option === '0' && <TableCell>
                                        <TableSortLabel active={key === 'target'} direction={key === 'target' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('target')}>
                                            Target
                                        </TableSortLabel>
                                    </TableCell>}
                                    {option === '1' && <TableCell>Max Level<br />in {hacktime}min</TableCell>}
                                    {option === '2' && <TableCell>Max MS<br />in {hacktime}min</TableCell>}

                                    <TableCell />

                                    <TableCell>
                                        <TableSortLabel active={key === 'mschange'} direction={key === 'mschange' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('mschange')}>
                                            MS
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'time'} direction={key === 'time' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('time')}>
                                            Time
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'projected_bonus'} direction={key === 'projected_bonus' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('projected_bonus')}>
                                            Bonus
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel active={key === 'change'} direction={key === 'change' ? (direction === 'ascending' ? 'asc' : 'desc') : 'asc'} onClick={this.sortHandler('change')}>
                                            Change
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Next Level</TableCell>
                                    {option === '0' && <TableCell>Next Level<br />After Target</TableCell>}
                                    {option === '1' && <TableCell>Next Level<br />After Max Level</TableCell>}
                                    {option === '2' && <TableCell>Next Level<br />After Max MS</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    (() => {
                                        // Pre-calculate everything
                                        let data = Hacks.map((hack, pos) => {
                                            const reducer = this.props.hackstats.hacks[pos].reducer;
                                            const level = this.props.hackstats.hacks[pos].level;
                                            const currBonus = hackOptimizer.bonus(level, pos);
                                            let target = 0;
                                            if (option === '0') {
                                                target = this.props.hackstats.hacks[pos].goal;
                                            } else {
                                                target = hackOptimizer.reachable(level, hacktime, pos);
                                                if (option === '2') {
                                                    target = hackOptimizer.milestoneLevel(target, pos);
                                                }
                                            }
                                            let bonus = target > level
                                                ? hackOptimizer.bonus(target, pos)
                                                : currBonus;
                                            let time = hackOptimizer.time(level, target, pos);
                                            let timePastLevel = hackOptimizer.time(level, level + 1, pos);
                                            let timePastTarget = hackOptimizer.time(level, target + 1, pos) - hackOptimizer.time(level, target, pos);
                                            let mschange = target > level
                                                ? hackOptimizer.milestones(target, pos) - hackOptimizer.milestones(level, pos)
                                                : 0;
                                            let mschange_str = '+' + mschange;
                                            const change = bonus / currBonus;

                                            return {
                                                pos,
                                                name: hack[0],
                                                reducer,
                                                level,
                                                currBonus,
                                                target,
                                                bonus,
                                                time,
                                                timePastLevel,
                                                timePastTarget,
                                                mschange,
                                                mschange_str,
                                                change,
                                                projected_bonus: bonus
                                            };
                                        });

                                        // Calculate totals
                                        sumtime = 0;
                                        hackhacktime = 0;
                                        hackhackchange = 1;
                                        data.forEach(d => {
                                            sumtime += d.time;
                                            if (d.pos === 13) {
                                                hackhacktime = d.time;
                                                hackhackchange = d.change < 1 ? 1 : d.change;
                                            }
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

                                        const rows = data.map((d) => {
                                            const { pos, name, reducer, level, currBonus, target, bonus, time, timePastLevel, timePastTarget, mschange_str, change } = d;
                                            return <TableRow key={pos}>
                                                <TableCell component="th" scope="row">{name}</TableCell>
                                                <TableCell>
                                                    <TextField type="number" value={reducer}
                                                        onChange={(e) => this.handleChange(e, 'reducer', pos)} onFocus={this.handleFocus}
                                                        inputProps={{ step: "any" }} sx={{ width: 60 }} hiddenLabel size="small" />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField type="number" value={level}
                                                        onChange={(e) => this.handleChange(e, 'level', pos)} onFocus={this.handleFocus}
                                                        inputProps={{ step: "any" }} sx={{ width: 80 }} hiddenLabel size="small" />
                                                </TableCell>
                                                <TableCell>{shorten(currBonus, 2)}%</TableCell>

                                                {option === '0' && <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <TextField type="number" value={target}
                                                            onChange={(e) => this.handleChange(e, 'goal', pos)} onFocus={this.handleFocus}
                                                            inputProps={{ step: "any" }} sx={{ width: 80, mr: 1 }} hiddenLabel size="small" />
                                                        <IconButton size="small" onClick={(e) => this.handleChange(e, 'msdown', pos)}><RemoveIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" onClick={(e) => this.handleChange(e, 'msup', pos)}><AddIcon fontSize="small" /></IconButton>
                                                    </Box>
                                                </TableCell>}
                                                {option !== '0' && <TableCell>{target}</TableCell>}

                                                <TableCell>
                                                    {target !== this.props.hackstats.hacks[pos].goal ? (
                                                        option === '0' ? (
                                                            target === level ? null :
                                                                <Button size="small" onClick={(e) => this.handleButtonChange({ target: { value: target > level ? target : level } }, target > level ? 'level' : 'goal', pos)}>Complete</Button>
                                                        ) : (
                                                            <Button size="small" onClick={(e) => this.handleButtonChange({ target: { value: target } }, 'goal', pos)}>Set Target</Button>
                                                        )
                                                    ) : null}
                                                </TableCell>

                                                <TableCell>{mschange_str}</TableCell>
                                                <TableCell>{toTime(time)}</TableCell>
                                                <TableCell>{shorten(bonus, 2)}%</TableCell>
                                                <TableCell>×{shorten(change, 3)} {Math.round((change - 1) * 100) !== 0 && <span style={{ color: 'green', fontWeight: 'bold' }}>({Math.abs((change - 1) * 100 % 1) > 0.01 ? '~' : ''}{Math.round((change - 1) * 100)}%)</span>}</TableCell>
                                                <TableCell>{toTime(timePastLevel)}</TableCell>
                                                <TableCell>{toTime(timePastTarget)}</TableCell>
                                            </TableRow>;
                                        });

                                        // Summary rows
                                        rows.push(
                                            <TableRow key="summary-min">
                                                <TableCell colSpan={9} />
                                                <TableCell><b>Min total:</b><br />{toTime((sumtime - hackhacktime) / hackhackchange + hackhacktime)}</TableCell>
                                                <TableCell colSpan={4} />
                                            </TableRow>
                                        );
                                        rows.push(
                                            <TableRow key="summary-max">
                                                <TableCell colSpan={9} />
                                                <TableCell><b>Max total:</b><br />{toTime(sumtime)}</TableCell>
                                                <TableCell colSpan={4}>
                                                    <Button variant="contained" onClick={(e) => {
                                                        const hacks = Hacks.map((_, pos) => {
                                                            const hack = this.props.hackstats.hacks[pos]
                                                            const tmp = Math.max(hack.level, hack.goal);
                                                            return {
                                                                ...hack,
                                                                level: tmp,
                                                                goal: tmp
                                                            }
                                                        });
                                                        this.handleButtonChange({ target: { value: hacks } }, 'hacks');
                                                    }}>Complete All</Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                        return rows;
                                    })()
                                }
                            </TableBody>
                        </Table>
                    </Paper>
                </form>
            </Box>
        );
    };
}

export default HackComponent;
