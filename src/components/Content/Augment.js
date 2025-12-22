import React, { Component } from 'react';
import ReactGA from 'react-ga';
import {
    TextField, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, Box, Grid, Select, MenuItem, Typography
} from '@mui/material';
import { Augment } from '../../Augment';
import { shortenExponential } from '../../util';
import VersionForm from '../VersionForm/VersionForm'

const AUGS = [
    {
        name: 'scissors',
        boost: Math.pow(25, 0)
    }, {
        name: 'milk',
        boost: Math.pow(25, 1)
    }, {
        name: 'cannon',
        boost: Math.pow(25, 2)
    }, {
        name: 'mounted',
        boost: Math.pow(25, 3)
    }, {
        name: 'buster',
        boost: Math.pow(25, 4)
    }, {
        name: 'exo',
        boost: Math.pow(25, 5) * 1e2
    }, {
        name: 'laser sword',
        boost: Math.pow(25, 6) * 1e4
    }
]

class AugmentComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            timeUnit: 'minutes'
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleFocus(event) {
        event.target.select();
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    handleChange(event, name, idx = -1) {
        let val = event.target.value;
        let augstats = {
            ...this.props.augstats
        };
        if (idx < 0) {
            augstats = {
                ...augstats,
                [name]: val
            };
            this.props.handleSettings('augstats', augstats);
            return;
        }
        let augs = [...augstats.augs];
        let aug = {
            ...augs[idx],
            [name]: val
        };
        augs[idx] = aug;
        augstats = {
            ...augstats,
            augs: augs
        };
        this.props.handleSettings('augstats', augstats);


    }

    configureRatios(key) {
        const augstats = this.props.augstats;
        let augs;
        let augmentOptimizer = new Augment(augstats, AUGS);
        const version = augstats.version;
        if (key === 'exponent') {
            augs = augstats.augs.map((aug, idx) => {
                const ratio = augmentOptimizer.exponent(idx) / 2;
                return {
                    ...aug,
                    ratio: ratio
                };
            });
        }
        if (key === 'cost') {
            augs = augstats.augs.map((aug, idx) => {
                const ratio = augmentOptimizer.cost(idx, version, false, false) / augmentOptimizer.cost(idx, version, true, false);
                return {
                    ...aug,
                    ratio: ratio
                };
            });
        }
        if (key === 'equal') {
            augs = augstats.augs.map((aug, idx) => {
                return {
                    ...aug,
                    ratio: 1
                };
            });
        }
        this.props.handleSettings('augstats', {
            ...augstats,
            augs: augs
        });

    }

    input(val, args, width = 100) {
        return (
            <TextField
                type="number"
                value={val}
                onFocus={this.handleFocus}
                onChange={(e) => this.handleChange(e, ...args)}
                sx={{ width: width, m: 0.5 }}
                inputProps={{ step: "any" }}
                hiddenLabel
                size="small"
            />
        );
    }

    namedInput(name, val, args, width = 250) {
        return (
            <TableRow>
                <TableCell>{name}</TableCell>
                <TableCell>
                    {this.input(val, args, width)}
                </TableCell>
            </TableRow>
        );
    }

    augment(augstats, aug, pos) {
        let augmentOptimizer = new Augment(augstats, AUGS);
        const augresult = augmentOptimizer.reachable(pos, false);
        const auglevel = augresult[0];
        const goldlimited = augresult[1];
        const upglevel = goldlimited
            ? 0
            : augmentOptimizer.reachable(pos, true)[0];
        const boost = augmentOptimizer.boost(pos, auglevel, upglevel);
        const energy = augmentOptimizer.energy(pos);
        return <TableRow key={pos}>
            <TableCell>{aug.name}</TableCell>
            <TableCell>{
                this.input(augstats.augs[pos].ratio, [
                    'ratio', pos
                ], 80)
            }</TableCell>
            <TableCell>{shortenExponential(energy[0])}</TableCell>
            <TableCell>{shortenExponential(energy[1])}</TableCell>
            <TableCell>{shortenExponential(auglevel)}</TableCell>
            <TableCell>{shortenExponential(upglevel)}</TableCell>
            <TableCell>{shortenExponential(boost)}</TableCell>
        </TableRow>
    }

    render() {
        ReactGA.pageview('/augment/');
        const augstats = this.props.augstats;
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <form onSubmit={this.handleSubmit}>
                    <Grid container spacing={2} justifyContent="center">
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Table size="small">
                                    <TableBody>
                                        {this.namedInput('Energy cap', augstats.ecap, ['ecap'])}
                                        {this.namedInput('Augment speed', augstats.augspeed, ['augspeed'])}
                                        {this.namedInput('Gold', augstats.gold, ['gold'])}
                                        {this.namedInput('Net GPS', augstats.gps, ['gps'])}
                                        {this.namedInput('Normal NAC:', augstats.nac, ['nac'])}
                                        {this.namedInput('Normal LSC:', augstats.lsc, ['lsc'])}
                                        <TableRow>
                                            <TableCell>Augment Time</TableCell>
                                            <TableCell>
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
                                                        value={this.state.timeUnit === 'hours' ? Math.round((augstats.time / 60) * 100) / 100 : augstats.time}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            const minutes = this.state.timeUnit === 'hours' ? val * 60 : val;
                                                            this.handleChange({ target: { value: minutes } }, 'time');
                                                        }}
                                                        onFocus={this.handleFocus}
                                                        type="number"
                                                        sx={{ width: 150 }}
                                                        inputProps={{ step: "any" }}
                                                        hiddenLabel
                                                        size="small"
                                                    />
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                {'Game mode:'}
                                            </TableCell>
                                            <TableCell>
                                                {<VersionForm {...this.props} handleChange={this.handleChange} />}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>{'Ratio:'}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button variant="outlined" size="small" onClick={() => this.configureRatios('exponent')}>
                                                        {'Exponent'}
                                                    </Button>
                                                    <Button variant="outlined" size="small" onClick={() => this.configureRatios('cost')}>
                                                        {'Cost'}
                                                    </Button>
                                                    <Button variant="outlined" size="small" onClick={() => this.configureRatios('equal')}>
                                                        {'Equal'}
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Augment</TableCell>
                                            <TableCell>Ratio</TableCell>
                                            <TableCell>Augment<br />Energy</TableCell>
                                            <TableCell>Upgrade<br />Energy</TableCell>
                                            <TableCell>Augment<br />Level</TableCell>
                                            <TableCell>Upgrade<br />Level</TableCell>
                                            <TableCell>Boost</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {
                                            AUGS.map((aug, pos) => {
                                                return this.augment(augstats, aug, pos);
                                            })
                                        }
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        );

    };
}

export default AugmentComponent;
