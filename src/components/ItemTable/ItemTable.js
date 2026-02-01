import React, { useMemo } from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { SourceItem } from '../Item/Item'
import { allowed_zone, get_limits } from '../../util'

function compare_factory(key) {
    return function (prop) {
        return function (a, b) {
            a = prop[a];
            b = prop[b];
            if (a === undefined || a[key] === undefined || b === undefined || b[key] === undefined) {
                return true;
            }
            let result;
            if (a[key][1] !== b[key][1]) {
                // HACK: place items from different titan versions in same bucket
                if (a[key][0].substring(0, a[key][0].length - 2) === b[key][0].substring(0, b[key][0].length - 2)) {
                    result = a.slot[1] - b.slot[1];
                } else if (a[key][1] * b[key][1] < 0) {
                    result = a[key][1] - b[key][1];
                } else {
                    result = b[key][1] - a[key][1];
                }
            } else {
                result = a.slot[1] - b.slot[1]
            }
            return result;
        }
    }
}

function group(a, b, g) {
    if (a === undefined || b === undefined) {
        return false;
    }
    // HACK: place items from different titan versions in same bucket
    return a[g][0].substring(0, a[g][0].length - 2) !== b[g][0].substring(0, b[g][0].length - 2);
}

const ItemSection = ({ groupName, items, hidden, handleZoneClick }) => {
    if (items.length === 0) return null;

    return (
        <Grid item xs={12} sm={6} md={4} lg={3}>
            <Paper sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography
                    variant="subtitle2"
                    onClick={handleZoneClick}
                    sx={{ cursor: 'pointer', mb: 1, fontWeight: 'bold' }}
                >
                    {groupName}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {!hidden && items}
                </Box>
            </Paper>
        </Grid>
    );
};

const ItemTable = (props) => {
    const {
        group: groupBy,
        itemdata,
        items,
        compactitemlist,
        showunused,
        savedequip,
        hidden,
        handleDisableZone,
        handleSettings,
        handleHideZone,
        handleClickItem,
        handleCtrlClickItem,
        handleEditItem,
        handleRightClickItem
    } = props;

    const limits = useMemo(() => get_limits(props), [props.zone, props.titanversion, props.looty, props.pendant]);

    const handleZoneClick = (e, zoneId) => {
        if (e.ctrlKey || e.altKey) {
            handleDisableZone(zoneId);
        } else if (e.shiftKey) {
            handleSettings('compactitemlist', !compactitemlist);
        } else {
            handleHideZone(zoneId);
        }
    };

    const sortedBuffer = useMemo(() => {
        let buffer = [];
        let localbuffer = [];

        const compare = compare_factory(groupBy)(itemdata);
        const sorted = [...items].sort(compare);
        let last = undefined;
        let lastZoneId = undefined;
        let lastGroupName = '';

        const flushBuffer = (zoneId, groupName) => {
            if (localbuffer.length > 0) {
                buffer.push(
                    <ItemSection
                        key={buffer.length} // Simple index key as order is stable
                        groupName={groupName}
                        items={localbuffer}
                        hidden={hidden[zoneId]}
                        handleZoneClick={(e) => handleZoneClick(e, zoneId)}
                    />
                );
                localbuffer = [];
            }
        };

        for (let idx = 0; idx < sorted.length; idx++) {
            const id = sorted[idx];
            const item = itemdata[id];
            if (item.empty) {
                continue;
            }

            // Determine if we need to start a new section
            let next = group(last, item, groupBy);

            // If changing groups and not in compact mode (or if prev group was invalid), flush.
            // Also logic from original: (!compactitemlist || last.zone[1] < 0)
            if (next && (!compactitemlist || (last && last.zone[1] < 0))) {
                flushBuffer(lastZoneId, lastGroupName);
            }

            // Update current group info if we are starting a fresh one or just continuing
            if (last === undefined || next) {
                lastGroupName = item[groupBy][0];
                lastZoneId = item.zone[1];
            }

            let className = '';
            if (!item.disable && showunused) {
                className = ' unused-item';
                // Check if used in any saved equip
                let isUsed = false;
                for (let save of savedequip) {
                    if (save.ignore || !save[item.slot[0]]) continue;
                    if (save[item.slot[0]].includes(id)) {
                        isUsed = true;
                        break;
                    }
                }
                if (isUsed) className = '';
            }

            if (allowed_zone(itemdata, limits, id) && !(compactitemlist && item.disable)) {
                localbuffer.push(
                    <SourceItem
                        className={className}
                        item={item}
                        handleClickItem={handleClickItem}
                        handleCtrlClickItem={handleCtrlClickItem}
                        handleShiftClickItem={(itemId) => handleEditItem(itemId, -1)}
                        handleRightClickItem={handleRightClickItem}
                        key={id}
                    />
                );
            }
            last = item;
        }

        // Final flush
        flushBuffer(compactitemlist ? Infinity : lastZoneId, compactitemlist ? 'Items' : lastGroupName);

        return buffer;
    }, [items, itemdata, groupBy, compactitemlist, showunused, savedequip, hidden, limits]);

    return (
        <Box sx={{ width: '100%', height: '72vh', margin: 'auto', overflowY: 'auto', p: 1 }}>
            <Grid container spacing={1}>
                {sortedBuffer}
            </Grid>
        </Box>
    );
}

export default ItemTable;
