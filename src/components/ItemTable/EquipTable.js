import React, { useMemo, useState } from 'react';
import { Box, Paper, Typography, Grid, Divider, Button } from '@mui/material';
import { TargetItem } from '../Item/Item'
import { EmptySlot, Factors, Slot } from '../../assets/ItemAux'
import { cubeBaseItemData, score_equip, shorten } from '../../util'

import { default as SaveButtons } from './SaveButtons'

function equip2url(equip, itemdata) {
    const base = window.location.href
    let url = base.substring(0, base.indexOf('#') + 1) + '/loadout/'
    let first = true
    Object.getOwnPropertyNames(Slot).forEach(slot => {
        if (slot === 'OTHER') {
            return;
        }
        equip[Slot[slot][0]].forEach(item => {
            if (itemdata[item].empty) {
                return;
            }
            if (!first) {
                url += '&'
            } else {
                first = false;
            }
            url += item;
        })
    });
    return encodeURI(url);
}

const formatted = (val, stat, d) => {
    if (val === Infinity) {
        return '(+∞%)';
    }
    let num = shorten(Math.abs(val));
    let pf = d
        ? (
            val >= 0
                ? '(+'
                : '(-')
        : '';

    let sf = d
        ? '%)'
        : ''
    if (stat === 'Respawn') {
        sf = d
            ? 'pp)'
            : '% reduction';
    } else {
        pf = d
            ? pf
            : '×';
    }
    return pf + num + sf
};

const BonusLine = ({ factor, factors, itemdata, equip, savedequip, compactbonus, offhand, capstats }) => {
    const diffclass = (old, val) => {
        if (old < val) return 'success.main';
        if (old > val) return 'error.main';
        return 'text.primary';
    };

    const stat = factor[0];
    let priority = false;
    let fontWeight = 'normal';

    for (let idx = 0; idx < factors.length; idx++) {
        if (stat === Factors[factors[idx]][0]) {
            priority = true;
            fontWeight = 'bold';
            break;
        }
    }

    if (compactbonus && !priority) {
        return null;
    }

    let val = score_equip(itemdata, equip, factor, offhand, capstats);
    let old = score_equip(itemdata, savedequip, factor, offhand, capstats);
    let diff_val;

    if (stat === 'Power' || stat === 'Toughness' || stat === 'Respawn') {
        val *= 100;
        old *= 100;
    }

    if (stat === 'Respawn') {
        diff_val = val - old;
    } else {
        diff_val = val === old ? 0 : 100 * (val / old - 1);
    }

    const colorDiff = diffclass(old, val);

    return (
        <>
            <Typography component="span" sx={{ fontWeight }}>
                {factor[0] + ': ' + formatted(val, stat, false) + ' '}
                <Typography component="span" sx={{ color: colorDiff }}>
                    {formatted(diff_val, stat, true)}
                </Typography>
            </Typography>
            <br />
        </>
    );
};

// Simplified component without heavy memoization overhead for cleaner fast renders
const EquipmentSection = ({ equip, prefix, itemdata, group, locked, handleClickItem, handleCtrlClickItem, handleShiftClickItem, handleRightClickItem, handleDropItem, lockable, bgColor = 'transparent' }) => {

    // Calculate sections immediately - optimized enough without useMemo for this amount of data
    // to avoid overhead of dependency checking on every prop change
    const sorted = Object.getOwnPropertyNames(Slot)
        .sort((a, b) => Slot[a][1] - Slot[b][1])
        .reduce((res, slot) => res.concat(equip[Slot[slot][0]]), []);

    const result = [];
    let localbuffer = [];
    let last = new EmptySlot();
    let typeIdx = 0;
    let classIdx = 0;

    const groupFunc = (a, b, g) => {
        if (a[g] === undefined || b[g] === undefined) {
            return false;
        }
        return a[g][1] !== b[g][1];
    };

    for (let idx = 0; idx < sorted.length; idx++) {
        const id = sorted[idx];
        const item = itemdata[id];

        if (item === undefined || item.slot === Slot.OTHER) {
            continue;
        }

        const next = groupFunc(last, item, group);

        if (next) {
            typeIdx = idx;
            if (item.slot[0] === Slot.ACCESSORY[0]) {
                result.push({
                    key: classIdx++,
                    title: prefix + 'Outfit',
                    items: [...localbuffer]
                });
                localbuffer = [];
            }
        }

        localbuffer.push(
            <TargetItem
                item={item}
                idx={idx - typeIdx}
                lockable={lockable}
                locked={locked}
                handleClickItem={handleClickItem}
                handleCtrlClickItem={handleCtrlClickItem}
                handleShiftClickItem={handleShiftClickItem}
                handleRightClickItem={(itemId) => handleRightClickItem(itemId, true)}
                handleDropItem={handleDropItem}
                key={id + '_' + idx}
            />
        );
        last = item;
    }

    result.push({
        key: classIdx++,
        title: prefix + 'Accessories',
        items: [...localbuffer]
    });

    return (
        <Paper elevation={0} sx={{ p: 1, backgroundColor: bgColor, borderRadius: 1 }}>
            {/* Render flat list of grids to avoid excessive nesting */}
            <Grid container spacing={1}>
                {result.map(section => (
                    <Grid item xs={12} key={section.key}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 1, bgcolor: 'background.paper' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {section.title}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {section.items}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

// Export ConditionalSection for use in Optimizer.js
export const ConditionalSection = ({ condition, title, items, itemdata, handleEquipItem, handleCtrlClickItem, handleShiftClickItem, handleRightClickItem, handleDropItem }) => {
    // Default to collapsed (hidden)
    const [expanded, setExpanded] = useState(false);

    const filteredItems = useMemo(() => {
        if (!expanded) return []; // optimization: don't calculate if closed
        return items
            .filter(id => condition(id) && itemdata[id].level !== undefined)
            .map(id => (
                <TargetItem
                    item={itemdata[id]}
                    lockable={false}
                    handleClickItem={handleEquipItem}
                    handleCtrlClickItem={handleCtrlClickItem}
                    handleShiftClickItem={handleShiftClickItem}
                    handleRightClickItem={(itemId) => handleRightClickItem(itemId, false)}
                    handleDropItem={handleDropItem}
                    key={id}
                />
            ));
    }, [items, itemdata, condition, expanded, handleEquipItem, handleCtrlClickItem, handleShiftClickItem, handleRightClickItem, handleDropItem]);

    // Calculate count even if collapsed to show in header
    const count = useMemo(() => {
        return items.filter(id => condition(id) && itemdata[id].level !== undefined).length;
    }, [items, itemdata, condition]);

    if (count === 0) return null;

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 1, border: '1px solid', borderColor: 'divider' }}>
                <Box
                    onClick={() => setExpanded(!expanded)}
                    sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 0.5
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        {title}
                        <Typography component="span" variant="caption" sx={{ ml: 1, px: 1, py: 0.5, bgcolor: 'action.selected', borderRadius: 1 }}>
                            {count}
                        </Typography>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {expanded ? '▼' : '►'}
                    </Typography>
                </Box>
                {expanded && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                        {filteredItems}
                    </Box>
                )}
            </Paper>
        </Grid>
    );
};

const EquipTable = (props) => {
    const { viewMode = 'full' } = props;

    // Keep heavy data calculation memoized
    const itemdata = useMemo(() =>
        cubeBaseItemData(props.itemdata, props.cubestats, props.basestats),
        [props.itemdata, props.cubestats, props.basestats]
    );

    const equip = props.equip;
    const savedequip = props.savedequip[props.savedidx];

    const loadoutURIs = useMemo(() => ({
        current: equip2url(equip, itemdata),
        saved: equip2url(savedequip, itemdata)
    }), [equip, savedequip, itemdata]);

    const renderCurrent = () => (
        <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2, border: '1px solid', borderColor: 'primary.light' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                    ⚔️ Current Equipment (In Use)
                </Typography>

                <EquipmentSection
                    equip={equip}
                    prefix=""
                    itemdata={itemdata}
                    group={props.group}
                    locked={props.locked}
                    handleClickItem={props.handleClickItem}
                    handleCtrlClickItem={props.handleCtrlClickItem}
                    handleShiftClickItem={(itemId) => props.handleEditItem(itemId, -1)}
                    handleRightClickItem={props.handleRightClickItem}
                    handleDropItem={props.handleDropItem}
                    lockable={true}
                />
            </Paper>
        </Grid>
    );

    const renderSaved = () => (
        <>
            <Grid item xs={12}>
                <Paper elevation={2} sx={{ p: 2, mb: 1, border: '1px solid', borderColor: 'primary.light' }}>

                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                        💾 Saved Loadout
                    </Typography>

                    <EquipmentSection
                        equip={savedequip}
                        prefix=""
                        itemdata={itemdata}
                        group={props.group}
                        locked={props.locked}
                        handleClickItem={props.handleEquipItem}
                        handleCtrlClickItem={props.handleCtrlClickItem}
                        handleShiftClickItem={() => { }}
                        handleRightClickItem={props.handleRightClickItem}
                        handleDropItem={props.handleDropItem}
                        lockable={false}
                    />

                    {/* Save Buttons & Controls */}
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <SaveButtons
                            {...props}
                            loadoutURI={loadoutURIs.current}
                            saveURI={loadoutURIs.saved}
                        />
                    </Box>

                    {/* Stats Comparison */}
                    <Box sx={{ mt: 2 }}>
                        <Paper variant="outlined" sx={{ p: 1, cursor: 'pointer' }} onClick={() => props.handleSettings('compactbonus', !props.compactbonus)}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Gear stats (Saved vs. Current)</Typography>
                            <Box sx={{ mt: 1 }}>
                                {Object.getOwnPropertyNames(Factors).map((factor) => (
                                    (factor === 'NONE' || factor === 'DELETE' || factor === 'INSERT')
                                        ? <div key={factor} />
                                        : <BonusLine
                                            key={factor}
                                            itemdata={itemdata}
                                            equip={equip}
                                            savedequip={savedequip}
                                            compactbonus={props.compactbonus}
                                            factor={Factors[factor]}
                                            factors={props.factors}
                                            capstats={props.capstats}
                                            offhand={props.offhand * 5}
                                        />
                                ))}
                            </Box>
                        </Paper>
                    </Box>
                </Paper>
            </Grid>
        </>
    );

    return (
        <Box sx={{ width: '100%', height: '72vh', margin: 'auto', overflowY: 'auto', p: 1, ...props.sx }}>
            <Grid container spacing={2}>
                {(viewMode === 'full' || viewMode === 'left') && renderCurrent()}
                {(viewMode === 'full') && (
                    <Grid item xs={12}>
                        <Divider sx={{ my: 0.5, borderBottomWidth: 3, borderColor: 'divider', opacity: 0.5 }} />
                    </Grid>
                )}
                {(viewMode === 'full' || viewMode === 'right') && renderSaved()}
            </Grid>
        </Box>
    );
};

export default EquipTable;
