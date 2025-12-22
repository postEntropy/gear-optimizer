import React, { Component } from 'react';
import ReactGA from 'react-ga';
import { Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
    Grid, Paper, Box, Button, Checkbox, TextField,
    Table, TableBody, TableCell, TableRow, Dialog, DialogContent
} from '@mui/material';

import { get_max_titan, get_max_zone, get_zone } from '../../util';
import { LOOTIES, PENDANTS } from '../../assets/Items';

import { default as Crement } from '../Crement/Crement';
import { default as ItemTable } from '../ItemTable/ItemTable';
import { default as EquipTable } from '../ItemTable/EquipTable';
import { default as OptimizeButton } from '../OptimizeButton/OptimizeButton';
import { default as FactorForm } from '../FactorForm/FactorForm';
import { default as ItemForm } from '../ItemForm/ItemForm';

import './Optimizer.css';
import ImportSaveForm from '../ImportSaveForm/ImportSaveForm';
import ResetItemsButton from '../ResetItemsButton/ResetItemsButton';
import DarkModeContext from '../AppLayout/DarkModeContext';



class Optimizer extends Component {
    static contextType = DarkModeContext;

    constructor(props) {
        super(props);
        this.fresh = true;
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
        if (val < 0) {
            val = 0;
        }
        let stats = {
            ...this.props[name[0] + 'stats'],
            [name[1]]: val
        };
        if (name[0] === 'cube') {
            stats = this.cubeTier(stats, name[1]);
        }
        this.props.handleSettings(name[0] + 'stats', stats);

    }

    cubeTier(cubestats, name) {
        const power = Number(cubestats.power);
        const toughness = Number(cubestats.toughness);
        let tier = Number(cubestats.tier)
        if (name !== 'tier') {
            tier = Math.floor(Math.log10(power + toughness) - 1);
        }
        tier = Math.max(0, tier);
        return {
            ...cubestats,
            tier: tier
        };
    }

    closeEditModal = () => (this.props.handleToggleModal('edit item', {
        itemId: undefined,
        lockable: false,
        on: false
    }));

    render() {
        //HACK: no idea how to do this properly
        if (!this.props.loaded) {
            return <div />;
        }
        if (this.props.loadLoadout === undefined) {
            ReactGA.pageview('/gear-optimizer/');
        } else {
            if (this.fresh) {
                const loadout = this.props.loadLoadout;
                this.props.handleEquipItems(loadout);
                this.fresh = false;
            } else {
                return <Navigate to='/' />
            }
        }
        // render the actual optimizer tab
        const zone = get_zone(this.props.zone);
        const maxzone = get_max_zone(this.props.zone);
        const maxtitan = get_max_titan(this.props.zone);
        const accslots = this.props.equip.accessory.length;
        const looty = this.props.looty >= 0
            ? LOOTIES[this.props.looty]
            : 'None';
        const pendant = this.props.pendant >= 0
            ? PENDANTS[this.props.pendant]
            : 'None';
        return (
            <DndProvider backend={HTML5Backend}>
                <Box className={this.props.className} sx={{ flexGrow: 1, p: 2 }}>
                    <Grid container spacing={2} justifyContent="center">
                        {/* Top Section: Settings & Controls */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                                <ImportSaveForm />
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1 }}>
                                    <Button variant="outlined" size="small" onClick={() => this.props.handleGo2Titan(8, 3, 5, 12)}>
                                        Titan 8 Preset
                                    </Button>
                                    <Button variant="outlined" size="small" onClick={() => this.props.handleGo2Titan(11, 6, 8, 15)}>
                                        Titan 11 Preset
                                    </Button>
                                    <ResetItemsButton />
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Crement header='Highest zone' value={zone[0]} name='zone'
                                        handleClick={this.props.handleCrement} min={2} max={maxzone} />
                                    {this.props.zone > 20 && (
                                        <Crement header={maxtitan[0] + ' version'} value={this.props.titanversion}
                                            name='titanversion' handleClick={this.props.handleCrement} min={1} max={4} />
                                    )}
                                    <Crement header='Highest looty' value={looty} name='looty'
                                        handleClick={this.props.handleCrement} min={-1} max={LOOTIES.length - 1} />
                                    <Crement header='Highest pendant' value={pendant} name='pendant'
                                        handleClick={this.props.handleCrement} min={-1} max={PENDANTS.length - 1} />
                                    <Crement header='Accessory slots' value={accslots} name='accslots'
                                        handleClick={this.props.handleCrement} min={0} max={100} />
                                    {this.props.zone > 27 && (
                                        <Crement header='Offhand power' value={this.props.offhand * 5 + '%'}
                                            name='offhand' handleClick={this.props.handleCrement} min={0} max={20} />
                                    )}
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Middle Section: Optimization Controls */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <OptimizeButton text={'Gear'} running={this.props.running}
                                        abort={this.props.handleTerminate}
                                        optimize={this.props.handleOptimizeGear} />
                                    <Button variant="outlined" onClick={this.props.handleUndo}>
                                        Load previous
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {[...this.props.factors.keys()].map((idx) => (
                                        <div key={'factorform' + idx}>
                                            <FactorForm {...this.props} idx={idx} />
                                        </div>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Right Section: Stats Input */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Allow disabled items</TableCell>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={this.props.ignoreDisabled}
                                                    onChange={() => this.props.handleSettings('ignoreDisabled', !this.props.ignoreDisabled)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>P/T input</TableCell>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={this.props.basestats.modifiers}
                                                    onChange={(e) => this.props.handleSettings('basestats', {
                                                        ...this.props.basestats,
                                                        modifiers: !this.props.basestats.modifiers
                                                    })}
                                                />
                                            </TableCell>
                                        </TableRow>
                                        {((this.props.basestats.modifiers) ? ['power', 'toughness'] : []).map((statname) => (
                                            <TableRow key={statname}>
                                                <TableCell>{'Base ' + statname.charAt(0).toUpperCase() + statname.slice(1)}</TableCell>
                                                <TableCell>
                                                    <TextField
                                                        hiddenLabel size="small"
                                                        type="number"
                                                        value={this.props.basestats[statname]}
                                                        onFocus={this.handleFocus}
                                                        onChange={(e) => this.handleChange(e, ['base', statname])}
                                                        inputProps={{ step: "any" }}
                                                        sx={{ width: '10ch' }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {((this.props.basestats.modifiers) ? ['power', 'toughness', 'tier'] : ['tier']).map((statname) => (
                                            <TableRow key={statname}>
                                                <TableCell>{'Cube ' + statname.charAt(0).toUpperCase() + statname.slice(1)}</TableCell>
                                                <TableCell>
                                                    <TextField
                                                        hiddenLabel size="small"
                                                        type="number"
                                                        value={this.props.cubestats[statname]}
                                                        onFocus={this.handleFocus}
                                                        onChange={(e) => this.handleChange(e, ['cube', statname])}
                                                        inputProps={{ step: "any" }}
                                                        sx={{ width: '10ch' }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell>Hardcap input</TableCell>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={this.props.capstats.modifiers}
                                                    onChange={(e) => this.props.handleSettings('capstats', {
                                                        ...this.props.capstats,
                                                        modifiers: !this.props.capstats.modifiers
                                                    })}
                                                />
                                            </TableCell>
                                        </TableRow>
                                        {this.props.capstats.modifiers && Object.getOwnPropertyNames(this.props.capstats).map((statname) => {
                                            if (statname.slice(0, 4) !== 'Nude') return null;
                                            return (
                                                <TableRow key={statname}>
                                                    <TableCell>{statname}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            hiddenLabel size="small"
                                                            type="number"
                                                            value={this.props.capstats[statname]}
                                                            onFocus={this.handleFocus}
                                                            onChange={(e) => this.handleChange(e, ['cap', statname])}
                                                            inputProps={{ step: "any" }}
                                                            sx={{ width: '10ch' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <EquipTable {...this.props} group={'slot'} type='equip'
                                    handleClickItem={this.props.handleUnequipItem}
                                    handleDropItem={this.props.handleDropEquipItem}
                                    handleCtrlClickItem={this.props.handleDisableItem}
                                    handleRightClickItem={(itemId, lockable) => this.props.handleToggleModal('edit item', {
                                        itemId: itemId,
                                        lockable: lockable,
                                        on: true
                                    })} />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <ItemTable {...this.props} maxtitan={maxtitan} group={'zone'} type='items'
                                    handleClickItem={this.props.handleEquipItem}
                                    handleCtrlClickItem={this.props.handleDisableItem}
                                    handleRightClickItem={(itemId) => this.props.handleToggleModal('edit item', {
                                        itemId: itemId,
                                        lockable: false,
                                        on: true
                                    })} />
                            </Paper>
                        </Grid>
                    </Grid>

                    <Dialog
                        open={this.props.editItem[0]}
                        onClose={this.closeEditModal}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogContent>
                            <ItemForm {...this.props} closeEditModal={this.closeEditModal} />
                        </DialogContent>
                    </Dialog>

                </Box>
            </DndProvider>);
    };
}

export default Optimizer;
