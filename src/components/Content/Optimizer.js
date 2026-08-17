import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import Paperdoll from '../Paperdoll/Paperdoll';
import Loading from '../Loading/Loading';

const Optimizer = (props) => {
    const [isReady, setIsReady] = useState(false);
    const [syncStatus, setSyncStatus] = useState('disconnected');
    const [inventoryCollapsed, setInventoryCollapsed] = useState(true);
    
    const freshRef = useRef(true);
    const gaFiredRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);



    useEffect(() => {
        if (isReady && props.loaded && props.loadLoadout !== undefined && freshRef.current) {
            props.handleEquipItems(props.loadLoadout);
            freshRef.current = false;
        }
    }, [isReady, props.loaded, props.loadLoadout, props]);

    const handleFocus = (event) => {
        event.target.select();
    };

    const handleChange = (event, name, idx = -1) => {
        let val = event.target.value;
        if (val < 0) {
            val = 0;
        }
        let stats = {
            ...props[name[0] + 'stats'],
            [name[1]]: val
        };
        if (name[0] === 'cube') {
            const power = Number(stats.power);
            const toughness = Number(stats.toughness);
            let tier = Number(stats.tier);
            if (name[1] !== 'tier') {
                tier = Math.floor(Math.log10(power + toughness) - 1);
            }
            stats.tier = Math.max(0, tier);
        }
        props.handleSettings(name[0] + 'stats', stats);
    };

    const closeEditModal = () => {
        props.handleToggleModal('edit item', {
            itemId: undefined,
            lockable: false,
            on: false
        });
    };

    // A MÁGICA DE PERFORMANCE OCORRE AQUI:
    // A base de itens gigante só é reconstruída se algo realmente mudar.
    const itemdata = useMemo(() => {
        if (!props.loaded) return null;
        return cubeBaseItemData(props.itemdata, props.cubestats, props.basestats);
    }, [props.loaded, props.itemdata, props.cubestats, props.basestats]);

    if (!isReady) {
        return <Loading />;
    }
    
    if (!props.loaded) {
        return <div />;
    }

    if (props.loadLoadout !== undefined && !freshRef.current) {
        return <Navigate to='/' />;
    }

    const zone = get_zone(props.zone);
    const maxzone = get_max_zone(props.zone);
    const maxtitan = get_max_titan(props.zone);
    const accslots = props.equip.accessory.length;
    const looty = props.looty >= 0 ? LOOTIES[props.looty] : 'None';
    const pendant = props.pendant >= 0 ? PENDANTS[props.pendant] : 'None';

    return (
        <DndProvider backend={HTML5Backend}>
            <Box className={props.className} sx={{ flexGrow: 1, p: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            {/* Left Column: Paperdoll & Data Integration */}
                            <Grid item xs={12} md="auto" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Paperdoll
                                    equip={props.equip}
                                    liveEquip={props.liveEquip}
                                    itemdata={itemdata}
                                    handleClickItem={props.handleUnequipItem}
                                    handleCtrlClickItem={props.handleDisableItem}
                                    handleShiftClickItem={(itemId) => props.handleEditItem(itemId, -1)}
                                    handleRightClickItem={(itemId, lockable) => props.handleToggleModal('edit item', {
                                        itemId: itemId,
                                        lockable: lockable,
                                        on: true
                                    })}
                                    handleDropItem={props.handleDropEquipItem}
                                    locked={props.locked}
                                    offhand={props.offhand}
                                    syncStatus={syncStatus}
                                    optimizedEquip={props.optimizedEquip}
                                    onShare={null}
                                    highlightEquipped={props.highlightEquipped}
                                    factors={props.factors}
                                    maxslots={props.maxslots}
                                />

                                {/* Data Integration (Below Paperdoll) */}
                                <Paper sx={{ p: 1.5, width: '100%', borderRadius: 2 }}>
                                    <Typography variant="overline" sx={{ fontWeight: 'bold', display: 'block', color: 'primary.main', letterSpacing: 1.5, lineHeight: 1, mb: 1 }}>
                                        DATA INTEGRATION
                                    </Typography>
                                    <ImportSaveForm onSyncStatusChange={setSyncStatus}>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Button variant="outlined" size="small" onClick={() => props.handleGo2Titan(8, 3, 5, 12)} sx={{ py: 0.5, px: 1, minWidth: 0 }}>
                                                T8
                                            </Button>
                                            <Button variant="outlined" size="small" onClick={() => props.handleGo2Titan(11, 6, 8, 15)} sx={{ py: 0.5, px: 1, minWidth: 0 }}>
                                                T11
                                            </Button>
                                            <ResetItemsButton />
                                        </Box>
                                    </ImportSaveForm>
                                </Paper>

                                {/* Stats Modifiers (Below Data Integration) */}
                                <Paper sx={{ p: 2, width: '100%', overflow: 'auto', borderRadius: 2 }}>
                                    <Typography variant="overline" sx={{ fontWeight: 'bold', mb: 2, display: 'block' }}>Stats Modifiers</Typography>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Allow disabled items</TableCell>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={props.ignoreDisabled}
                                                        onChange={() => props.handleSettings('ignoreDisabled', !props.ignoreDisabled)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>P/T input</TableCell>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={props.basestats.modifiers}
                                                        onChange={(e) => props.handleSettings('basestats', {
                                                            ...props.basestats,
                                                            modifiers: !props.basestats.modifiers
                                                        })}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            {((props.basestats.modifiers) ? ['power', 'toughness'] : []).map((statname) => (
                                                <TableRow key={statname}>
                                                    <TableCell>{'Base ' + statname.charAt(0).toUpperCase() + statname.slice(1)}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            hiddenLabel size="small"
                                                            type="number"
                                                            value={props.basestats[statname]}
                                                            onFocus={handleFocus}
                                                            onChange={(e) => handleChange(e, ['base', statname])}
                                                            inputProps={{ step: "any" }}
                                                            sx={{ width: `${Math.max(8, String(props.basestats[statname]).length + 1)}ch`, minWidth: '8ch' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {((props.basestats.modifiers) ? ['power', 'toughness', 'tier'] : ['tier']).map((statname) => (
                                                <TableRow key={statname}>
                                                    <TableCell>{'Cube ' + statname.charAt(0).toUpperCase() + statname.slice(1)}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            hiddenLabel size="small"
                                                            type="number"
                                                            value={props.cubestats[statname]}
                                                            onFocus={handleFocus}
                                                            onChange={(e) => handleChange(e, ['cube', statname])}
                                                            inputProps={{ step: "any" }}
                                                            sx={{ width: `${Math.max(8, String(props.cubestats[statname]).length + 1)}ch`, minWidth: '8ch' }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell>Hardcap input</TableCell>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={props.capstats.modifiers}
                                                        onChange={(e) => props.handleSettings('capstats', {
                                                            ...props.capstats,
                                                            modifiers: !props.capstats.modifiers
                                                        })}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            {props.capstats.modifiers && Object.getOwnPropertyNames(props.capstats).map((statname) => {
                                                if (statname.slice(0, 4) !== 'Nude') return null;
                                                return (
                                                    <TableRow key={statname}>
                                                        <TableCell>{statname}</TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                hiddenLabel size="small"
                                                                type="number"
                                                                value={props.capstats[statname]}
                                                                onFocus={handleFocus}
                                                                onChange={(e) => handleChange(e, ['cap', statname])}
                                                                inputProps={{ step: "any" }}
                                                                sx={{ width: `${Math.max(8, String(props.capstats[statname]).length + 1)}ch`, minWidth: '8ch' }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </Paper>
                            </Grid>

                            {/* Right Column: Tactical Processor & Zone Config */}
                            <Grid item xs={12} md>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                                    {/* Tactical Processor (Top Right) */}
                                    <Paper sx={{ p: 2, overflow: 'auto' }}>
                                        <Typography variant="overline" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'primary.main', letterSpacing: 1.5 }}>
                                            TACTICAL PROCESSOR
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            <OptimizeButton text={'Gear'} running={props.running}
                                                abort={props.handleTerminate}
                                                optimize={props.handleOptimizeGear} />
                                        </Box>
                                        <Grid container spacing={1}>
                                            {[...props.factors.keys()].map((idx) => (
                                                <Grid item xs={12} md={12} lg={6} key={'factorform' + idx}>
                                                    <FactorForm {...props} idx={idx} />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Paper>

                                    {/* Zone Configuration (Below Tactical Processor) */}
                                    <Paper sx={{ p: 2, flexGrow: 1 }}>
                                        <Typography variant="overline" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'primary.main', letterSpacing: 1.5, lineHeight: 1 }}>
                                            ZONE CONFIGURATION
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Crement header='Highest zone' value={zone[0]} name='zone'
                                                handleClick={props.handleCrement} min={2} max={maxzone} />
                                            {props.zone > 20 && (
                                                <Crement header={maxtitan[0] + ' version'} value={props.titanversion}
                                                    name='titanversion' handleClick={props.handleCrement} min={1} max={4} />
                                            )}
                                            <Crement header='Highest looty' value={looty} name='looty'
                                                handleClick={props.handleCrement} min={-1} max={LOOTIES.length - 1} />
                                            <Crement header='Highest pendant' value={pendant} name='pendant'
                                                handleClick={props.handleCrement} min={-1} max={PENDANTS.length - 1} />
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Crement header='Acc slots' value={accslots} name='accslots'
                                                        handleClick={props.handleCrement} min={0} max={100} />
                                                </Box>
                                                {props.zone > 27 && (
                                                    <Box sx={{ flex: 1 }}>
                                                        <Crement header='Offhand' value={props.offhand * 5 + '%'}
                                                            name='offhand' handleClick={props.handleCrement} min={0} max={20} />
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Equipment List Row */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <EquipTable
                                {...props}
                                group={'slot'}
                                type='equip'
                                viewMode='left'
                                sx={{ height: 'auto', p: 0 }}
                                handleClickItem={props.handleUnequipItem}
                                handleDropItem={props.handleDropEquipItem}
                                handleCtrlClickItem={props.handleDisableItem}
                                handleRightClickItem={(itemId, lockable) => props.handleToggleModal('edit item', {
                                    itemId: itemId,
                                    lockable: lockable,
                                    on: true
                                })}
                            />

                            {/* Inventory - Collapsible */}
                            <Paper sx={{ p: 1, border: '1px solid', borderColor: 'divider' }}>
                                <Box
                                    onClick={() => setInventoryCollapsed(!inventoryCollapsed)}
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
                                        {inventoryCollapsed ? '▼' : '▲'}
                                    </Typography>
                                </Box>

                                {!inventoryCollapsed && (
                                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                                        <ItemTable
                                            {...props}
                                            maxtitan={maxtitan}
                                            group={'zone'}
                                            type='items'
                                            handleClickItem={props.handleEquipItem}
                                            handleCtrlClickItem={props.handleDisableItem}
                                            handleRightClickItem={(itemId) => props.handleToggleModal('edit item', {
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
                                condition={id => itemdata[id].level !== 100}
                                title="Not maxed"
                                items={props.items}
                                itemdata={itemdata}
                                equip={props.equip}
                                handleEquipItem={props.handleEquipItem}
                                handleCtrlClickItem={props.handleDisableItem}
                                handleShiftClickItem={(itemId) => props.handleEditItem(itemId, -1)}
                                handleRightClickItem={(itemId) => props.handleToggleModal('edit item', {
                                    itemId: itemId,
                                    lockable: false,
                                    on: true
                                })}
                                handleDropItem={props.handleDropEquipItem}
                                highlightEquipped={props.highlightEquipped}
                            />

                            <ConditionalSection
                                condition={id => itemdata[id].disable}
                                title="Disabled Items"
                                items={props.items}
                                itemdata={itemdata}
                                equip={props.equip}
                                handleEquipItem={props.handleEquipItem}
                                handleCtrlClickItem={props.handleDisableItem}
                                handleShiftClickItem={(itemId) => props.handleEditItem(itemId, -1)}
                                handleRightClickItem={(itemId) => props.handleToggleModal('edit item', {
                                    itemId: itemId,
                                    lockable: false,
                                    on: true
                                })}
                                handleDropItem={props.handleDropEquipItem}
                                highlightEquipped={props.highlightEquipped}
                            />
                        </Box>
                    </Grid>

                    {/* Right Column: Saved Loadouts */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Saved Loadouts Section */}
                            <EquipTable
                                {...props}
                                group={'slot'}
                                type='equip'
                                viewMode='right'
                                sx={{ height: 'auto', p: 0 }}
                                handleClickItem={props.handleUnequipItem}
                                handleDropItem={props.handleDropEquipItem}
                                handleCtrlClickItem={props.handleDisableItem}
                                handleRightClickItem={(itemId, lockable) => props.handleToggleModal('edit item', {
                                    itemId: itemId,
                                    lockable: lockable,
                                    on: true
                                })}
                            />
                        </Box>
                    </Grid>
                </Grid>

                <Dialog
                    open={props.editItem?.on || false}
                    onClose={closeEditModal}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogContent>
                        <ItemForm {...props} closeEditModal={closeEditModal} />
                    </DialogContent>
                </Dialog>

            </Box>
        </DndProvider>
    );
};

export default Optimizer;
