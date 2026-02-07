import React, { Component } from 'react';
import ReactGA from 'react-ga';
import { Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
    Grid, Paper, Box, Button, Checkbox, TextField, Typography,
    Table, TableBody, TableCell, TableRow, Dialog, DialogContent
} from '@mui/material';

import { cubeBaseItemData, get_max_titan, get_max_zone, get_zone } from '../../util';
import { LOOTIES, PENDANTS } from '../../assets/Items';

import { default as Crement } from '../Crement/Crement';
import { default as ItemTable } from '../ItemTable/ItemTable';
import EquipTable, { ConditionalSection } from '../ItemTable/EquipTable';
import { default as OptimizeButton } from '../OptimizeButton/OptimizeButton';
import { default as FactorForm } from '../FactorForm/FactorForm';
import { default as ItemForm } from '../ItemForm/ItemForm';

import './Optimizer.css';
import ImportSaveForm from '../ImportSaveForm/ImportSaveForm';
import ResetItemsButton from '../ResetItemsButton/ResetItemsButton';
import DarkModeContext from '../AppLayout/DarkModeContext';
import Paperdoll from '../Paperdoll/Paperdoll';



import Loading from '../Loading/Loading';

class Optimizer extends Component {
    static contextType = DarkModeContext;

    constructor(props) {
        super(props);
        this.state = {
            isReady: false,
            isReady: false,
            syncStatus: 'disconnected',
            inventoryCollapsed: true
        };
        this.fresh = true;
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        // Defer rendering to allow browser paint (Loading state)
        setTimeout(() => {
            this.setState({ isReady: true });
        }, 300);
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
        if (!this.state.isReady) {
            return <Loading />;
        }
        //HACK: no idea how to do this properly
        if (!this.props.loaded) {
            return <div />;
        }
        this.itemdata = cubeBaseItemData(this.props.itemdata, this.props.cubestats, this.props.basestats);

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
                    <Grid container spacing={2}>
                        {/* Main HUD & Control Bar */}
                        <Grid item xs={12} md={8}>
                            <Paperdoll
                                equip={this.props.equip}
                                itemdata={this.itemdata}
                                handleClickItem={this.props.handleUnequipItem}
                                handleCtrlClickItem={this.props.handleDisableItem}
                                handleShiftClickItem={(itemId) => this.props.handleEditItem(itemId, -1)}
                                handleRightClickItem={(itemId, lockable) => this.props.handleToggleModal('edit item', {
                                    itemId: itemId,
                                    lockable: lockable,
                                    on: true
                                })}
                                handleDropItem={this.props.handleDropEquipItem}
                                locked={this.props.locked}
                                offhand={this.props.offhand}
                                syncStatus={this.state.syncStatus}
                                optimizedEquip={this.props.optimizedEquip}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="overline" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'primary.main', letterSpacing: 1.5 }}>
                                        DATA INTEGRATION
                                    </Typography>
                                    <ImportSaveForm onSyncStatusChange={(status) => this.setState({ syncStatus: status })}>
                                        <Button variant="outlined" size="small" onClick={() => this.props.handleGo2Titan(8, 3, 5, 12)} sx={{ py: 0.5 }}>
                                            T8 Preset
                                        </Button>
                                        <Button variant="outlined" size="small" onClick={() => this.props.handleGo2Titan(11, 6, 8, 15)} sx={{ py: 0.5 }}>
                                            T11 Preset
                                        </Button>
                                        <ResetItemsButton />
                                    </ImportSaveForm>
                                </Box>

                                <Box>
                                    <Typography variant="overline" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'primary.main', letterSpacing: 1.5 }}>
                                        ZONE CONFIGURATION
                                    </Typography>
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
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Crement header='Acc slots' value={accslots} name='accslots'
                                                    handleClick={this.props.handleCrement} min={0} max={100} />
                                            </Box>
                                            {this.props.zone > 27 && (
                                                <Box sx={{ flex: 1 }}>
                                                    <Crement header='Offhand' value={this.props.offhand * 5 + '%'}
                                                        name='offhand' handleClick={this.props.handleCrement} min={0} max={20} />
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Settings Section */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                                <Typography variant="overline" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'primary.main', letterSpacing: 1.5 }}>
                                    TACTICAL PROCESSOR
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <OptimizeButton text={'Gear'} running={this.props.running}
                                        abort={this.props.handleTerminate}
                                        optimize={this.props.handleOptimizeGear} />
                                </Box>
                                <Grid container spacing={1}>
                                    {[...this.props.factors.keys()].map((idx) => (
                                        <Grid item xs={12} sm={6} key={'factorform' + idx}>
                                            <FactorForm {...this.props} idx={idx} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                                <Typography variant="overline" sx={{ fontWeight: 'bold', mb: 2, display: 'block' }}>Stats Modifiers</Typography>
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

                        {/* Equipment List Row */}
                        {/* Equipment List Row - REFACTORED */}
                        {/* Left Column: Current Equipment + Inventory + Other Sections */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <EquipTable
                                    {...this.props}
                                    group={'slot'}
                                    type='equip'
                                    viewMode='left'
                                    sx={{ height: 'auto', p: 0 }}
                                    handleClickItem={this.props.handleUnequipItem}
                                    handleDropItem={this.props.handleDropEquipItem}
                                    handleCtrlClickItem={this.props.handleDisableItem}
                                    handleRightClickItem={(itemId, lockable) => this.props.handleToggleModal('edit item', {
                                        itemId: itemId,
                                        lockable: lockable,
                                        on: true
                                    })}
                                />

                                {/* Inventory - Collapsible - Styled to match ConditionalSection */}
                                <Paper sx={{ p: 1, border: '1px solid', borderColor: 'divider' }}>
                                    <Box
                                        onClick={() => this.setState(prev => ({ inventoryCollapsed: !prev.inventoryCollapsed }))}
                                        sx={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 0.5
                                        }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            Inventory / Available
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {this.state.inventoryCollapsed ? '▼' : '▲'}
                                        </Typography>
                                    </Box>

                                    {!this.state.inventoryCollapsed && (
                                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                                            <ItemTable
                                                {...this.props}
                                                maxtitan={maxtitan}
                                                group={'zone'}
                                                type='items'
                                                handleClickItem={this.props.handleEquipItem}
                                                handleCtrlClickItem={this.props.handleDisableItem}
                                                handleRightClickItem={(itemId) => this.props.handleToggleModal('edit item', {
                                                    itemId: itemId,
                                                    lockable: false,
                                                    on: true
                                                })}
                                            />
                                        </Box>
                                    )}
                                </Paper>

                                {/* Conditional Sections - Filtered Items */}
                                <ConditionalSection
                                    condition={id => this.itemdata[id].level !== 100}
                                    title="Not maxed"
                                    items={this.props.items}
                                    itemdata={this.itemdata}
                                    handleEquipItem={this.props.handleEquipItem}
                                    handleCtrlClickItem={this.props.handleDisableItem}
                                    handleShiftClickItem={(itemId) => this.props.handleEditItem(itemId, -1)}
                                    handleRightClickItem={(itemId) => this.props.handleToggleModal('edit item', {
                                        itemId: itemId,
                                        lockable: false,
                                        on: true
                                    })}
                                    handleDropItem={this.props.handleDropEquipItem}
                                />

                                <ConditionalSection
                                    condition={id => this.itemdata[id].disable}
                                    title="Disabled Items"
                                    items={this.props.items}
                                    itemdata={this.itemdata}
                                    handleEquipItem={this.props.handleEquipItem}
                                    handleCtrlClickItem={this.props.handleDisableItem}
                                    handleShiftClickItem={(itemId) => this.props.handleEditItem(itemId, -1)}
                                    handleRightClickItem={(itemId) => this.props.handleToggleModal('edit item', {
                                        itemId: itemId,
                                        lockable: false,
                                        on: true
                                    })}
                                    handleDropItem={this.props.handleDropEquipItem}
                                />
                            </Box>
                        </Grid>

                        {/* Right Column: Saved Loadouts */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Saved Loadouts Section */}
                                <EquipTable
                                    {...this.props}
                                    group={'slot'}
                                    type='equip'
                                    viewMode='right'
                                    sx={{ height: 'auto', p: 0 }}
                                    handleClickItem={this.props.handleUnequipItem} // Passed but unused by Saved section (uses handleEquipItem from props)
                                    handleDropItem={this.props.handleDropEquipItem}
                                    handleCtrlClickItem={this.props.handleDisableItem}
                                    handleRightClickItem={(itemId, lockable) => this.props.handleToggleModal('edit item', {
                                        itemId: itemId,
                                        lockable: lockable,
                                        on: true
                                    })}
                                />
                            </Box>
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
            </DndProvider>
        );
    };
}

export default Optimizer;
