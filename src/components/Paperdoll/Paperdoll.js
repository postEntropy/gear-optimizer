import React, { useMemo } from 'react';
import { Box, Paper, Typography, alpha, Grid, IconButton, Tooltip } from '@mui/material';
import { TargetItem } from '../Item/Item';
import { Slot, Factors } from '../../assets/ItemAux';

const getBracePathAt = (x, w, y_offset = 0, h = 10, tipX = null) => {
    const r = 5;
    const yTop = y_offset + 1;
    const yMid = y_offset + r + 1;
    const yBot = y_offset + h;
    const xMid = tipX !== null ? tipX : (x + w / 2);
    return `M ${x},${yTop} Q ${x},${yMid} ${x + r},${yMid} L ${xMid - r},${yMid} Q ${xMid},${yMid} ${xMid},${yBot} Q ${xMid},${yMid} ${xMid + r},${yMid} L ${x + w - r},${yMid} Q ${x + w},${yMid} ${x + w},${yTop}`;
};

const getFactorLabel = (type, factors, FactorsObject) => {
    if (!factors || !FactorsObject) return '';
    if (type === 'P1') {
        const factorKey = factors[0];
        return FactorsObject[factorKey] ? FactorsObject[factorKey][0] : 'Priority 1';
    }
    if (type === 'P2') {
        const factorKey = factors[1];
        return FactorsObject[factorKey] ? FactorsObject[factorKey][0] : 'Priority 2';
    }
    return '';
};

const itemMatchesFactor = (item, factorKey, FactorsObject) => {
    if (!item || item.empty || !factorKey || factorKey === 'NONE' || !FactorsObject) return false;
    const factorStats = FactorsObject[factorKey] && FactorsObject[factorKey][1];
    if (!factorStats || factorStats.length === 0) return false;
    return item.statnames && item.statnames.some(stat => factorStats.includes(stat));
};

const Paperdoll = ({ equip, liveEquip, optimizedEquip, itemdata, handleClickItem, handleCtrlClickItem, handleShiftClickItem, handleRightClickItem, handleDropItem, locked, offhand, syncStatus = 'disconnected', onShare, highlightEquipped, factors, maxslots }) => {

    // Use optimizedEquip for display if available, otherwise fallback to current equip
    const displayEquip = optimizedEquip || equip;
    
    // Determine the actual current equipment setup we are checking against (liveSync if connected, fallback to active optimizer equip)
    const currentEquip = (syncStatus === 'connected' && liveEquip) ? liveEquip : equip;

    const isAllEquipped = useMemo(() => {
        if (!optimizedEquip || !currentEquip || !displayEquip || !itemdata) {
            return false;
        }

        const isEmpty = (id) => !id || !itemdata[id] || itemdata[id].empty;

        // Check main slots: weapon, head, chest, pants, boots
        const mainSlots = ['weapon', 'head', 'chest', 'pants', 'boots'];
        for (const slot of mainSlots) {
            const displayList = displayEquip[slot] || [];
            const liveList = currentEquip[slot] || [];
            
            const maxIdx = slot === 'weapon' ? (offhand > 0 ? 2 : 1) : 1;
            for (let i = 0; i < maxIdx; i++) {
                const itemId = displayList[i];
                if (!isEmpty(itemId)) {
                    if (!liveList.includes(itemId)) {
                        return false;
                    }
                }
            }
        }

        // Check accessories
        const displayAccs = (displayEquip.accessory || []).filter(id => !isEmpty(id));
        const liveAccs = (currentEquip.accessory || []).filter(id => !isEmpty(id));

        const liveCountMap = {};
        for (const id of liveAccs) {
            liveCountMap[id] = (liveCountMap[id] || 0) + 1;
        }

        for (const id of displayAccs) {
            if (!liveCountMap[id] || liveCountMap[id] <= 0) {
                return false;
            }
            liveCountMap[id]--;
        }

        return true;
    }, [optimizedEquip, displayEquip, currentEquip, itemdata, offhand]);

    const formatFactorName = (name) => {
        if (!name) return '';
        return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const renderSlot = (slotType, index = 0) => {
        const itemId = displayEquip[slotType][index];
        const item = itemdata[itemId];
        const isActive = !!(item && !item.empty);

        // Check if item is currently equipped in the active/live loadout
        let isEquipped = false;
        if (isActive && currentEquip && currentEquip[slotType]) {
            isEquipped = currentEquip[slotType].includes(itemId);
        }
        const showHighlight = highlightEquipped && isEquipped;

        // Calculate priority label (P1 or P2) ONLY for non-accessory slots (fixed order)
        let priorityLabel = null;
        let priorityColor = null;

        if (isActive && slotType !== 'accessory') {
            const p1_active = factors && factors[0] && factors[0] !== 'NONE';
            const p2_active = factors && factors[1] && factors[1] !== 'NONE';

            if (p1_active) {
                priorityLabel = 'P1';
                priorityColor = '#ffb300';
            } else if (p2_active) {
                priorityLabel = 'P2';
                priorityColor = '#a855f7';
            }
        }

        return (
            <Box key={`${slotType}-${index}`} sx={{
                width: 48, height: 48,
                position: 'relative',
                border: showHighlight ? '2px solid' : '1px solid',
                borderColor: showHighlight ? '#00e676' : 'divider',
                boxShadow: showHighlight ? '0 0 12px rgba(0, 230, 118, 0.8), inset 0 0 4px rgba(0, 230, 118, 0.4)' : 'none',
                animation: showHighlight ? 'pulse-equipped 2s infinite ease-in-out' : 'none',
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: 'background.paper',
                '&:hover': { borderColor: showHighlight ? '#69f0ae' : 'primary.main' }
            }}>
                {priorityLabel && (
                    <Box sx={{
                        position: 'absolute',
                        top: 2,
                        left: 2,
                        bgcolor: priorityColor,
                        color: priorityColor === '#ffb300' ? '#000' : '#fff',
                        fontSize: '7.5px',
                        fontWeight: 900,
                        px: 0.4,
                        py: 0.1,
                        borderRadius: '3px',
                        lineHeight: 1,
                        zIndex: 2,
                        pointerEvents: 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        textTransform: 'uppercase'
                    }}>
                        {priorityLabel}
                    </Box>
                )}
                {isActive ? (
                    <TargetItem
                        item={item}
                        idx={index}
                        lockable={true}
                        locked={locked}
                        handleClickItem={handleClickItem}
                        handleCtrlClickItem={handleCtrlClickItem}
                        handleShiftClickItem={handleShiftClickItem}
                        handleRightClickItem={handleRightClickItem}
                        handleDropItem={handleDropItem}
                        size="medium"
                    />
                ) : (
                    <Box sx={{ width: '100%', height: '100%', bgcolor: 'action.hover' }} />
                )}
            </Box>
        );
    };

    const getPriorityBlocks = (factorIdx) => {
        const accessoryList = displayEquip && displayEquip.accessory ? displayEquip.accessory : [];
        if (accessoryList.length === 0) return [];

        const p_active = factors && factors[factorIdx] && factors[factorIdx] !== 'NONE';
        if (!p_active) return [];

        const totalAccs = accessoryList.length;

        // 1. Get unlocked indices
        const unlockedAccIndices = [];
        for (let i = 0; i < totalAccs; i++) {
            const isAccLocked = locked && locked.accessory && locked.accessory.includes(i);
            if (!isAccLocked) {
                unlockedAccIndices.push(i);
            }
        }

        const p1_active = factors && factors[0] && factors[0] !== 'NONE';
        const p1_max_slots = maxslots && maxslots[0] !== undefined ? maxslots[0] : Infinity;
        const p1_slots_count = p1_active ? Math.min(unlockedAccIndices.length, p1_max_slots) : 0;

        const p2_active = factors && factors[1] && factors[1] !== 'NONE';
        const p2_max_slots = maxslots && maxslots[1] !== undefined ? maxslots[1] : Infinity;
        const p2_slots_count = p2_active ? Math.min(unlockedAccIndices.length - p1_slots_count, p2_max_slots) : 0;

        // 2. Classify each index for this factor
        const slotTypes = [];
        for (let i = 0; i < totalAccs; i++) {
            const isLocked = locked && locked.accessory && locked.accessory.includes(i);
            if (isLocked) {
                slotTypes.push('locked');
            } else {
                const unlockedIndex = unlockedAccIndices.indexOf(i);
                if (unlockedIndex !== -1) {
                    // Check designation
                    let isDesignated = false;
                    if (factorIdx === 0) {
                        isDesignated = unlockedIndex < p1_slots_count;
                    } else if (factorIdx === 1) {
                        isDesignated = unlockedIndex >= p1_slots_count && unlockedIndex < p1_slots_count + p2_slots_count;
                    }

                    // Check item match and if the slot is active (not empty)
                    const itemId = accessoryList[i];
                    const item = itemdata && itemdata[itemId];
                    const isActive = !!(item && !item.empty);
                    const isItemMatch = itemMatchesFactor(item, factors[factorIdx], Factors);

                    if (isActive && (isDesignated || isItemMatch)) {
                        slotTypes.push('match');
                    } else {
                        slotTypes.push('none');
                    }
                } else {
                    slotTypes.push('none');
                }
            }
        }

        // 3. Group into contiguous blocks
        const blocks = [];
        let currentType = null;
        let currentCount = 0;
        let startIndex = 0;

        for (let i = 0; i < totalAccs; i++) {
            const type = slotTypes[i];
            if (type === currentType) {
                currentCount++;
            } else {
                if (currentCount > 0) {
                    blocks.push({
                        type: currentType,
                        startIndex: startIndex,
                        count: currentCount
                    });
                }
                currentType = type;
                currentCount = 1;
                startIndex = i;
            }
        }
        if (currentCount > 0) {
            blocks.push({
                type: currentType,
                startIndex: startIndex,
                count: currentCount
            });
        }

        return blocks;
    };

    const p1Blocks = useMemo(() => getPriorityBlocks(0), [displayEquip, factors, maxslots, locked, itemdata]);
    const p2Blocks = useMemo(() => getPriorityBlocks(1), [displayEquip, factors, maxslots, locked, itemdata]);

    const hasOverlap = useMemo(() => {
        return p1Blocks.some(b1 => b1.type === 'match' && p2Blocks.some(b2 => b2.type === 'match' && 
            Math.max(b1.startIndex, b2.startIndex) < Math.min(b1.startIndex + b1.count, b2.startIndex + b2.count)
        ));
    }, [p1Blocks, p2Blocks]);

    return (
        <Paper elevation={0} sx={{
            p: 1.5,
            width: '100%',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            border: '1px solid',
            borderColor: isAllEquipped ? 'success.main' : 'divider',
            borderRadius: 2,
            bgcolor: (theme) => isAllEquipped ? alpha(theme.palette.success.main, 0.12) : 'background.paper',
            background: (theme) => isAllEquipped 
                ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)` 
                : 'background.paper',
            boxShadow: isAllEquipped ? '0 0 16px rgba(76, 175, 80, 0.3)' : 'none',
            transition: 'all 0.3s ease-in-out',
            animation: isAllEquipped ? 'pulse-border 2s infinite ease-in-out' : 'none',
            '@keyframes pulse-border': {
                '0%': {
                    boxShadow: '0 0 8px rgba(76, 175, 80, 0.25), inset 0 0 4px rgba(76, 175, 80, 0.05)',
                },
                '50%': {
                    boxShadow: '0 0 18px rgba(76, 175, 80, 0.45), inset 0 0 8px rgba(76, 175, 80, 0.15)',
                },
                '100%': {
                    boxShadow: '0 0 8px rgba(76, 175, 80, 0.25), inset 0 0 4px rgba(76, 175, 80, 0.05)',
                }
            }
        }}>
            {/* Header / Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: -0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="overline" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                        Gear Optimizer
                    </Typography>
                    {isAllEquipped && (
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontWeight: 'bold', 
                                color: 'success.main', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                fontSize: '0.7rem',
                                bgcolor: (theme) => alpha(theme.palette.success.main, 0.15),
                                px: 1,
                                py: 0.2,
                                borderRadius: 1,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5
                            }}
                        >
                            ✓ Tudo Equipado
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Status Dot */}
                    {syncStatus === 'connected' && (
                        <Box sx={{
                            width: 6, height: 6, borderRadius: '50%',
                            bgcolor: 'success.main',
                            boxShadow: (theme) => `0 0 4px ${theme.palette.success.main}`
                        }} />
                    )}
                </Box>
            </Box>

            {/* Legend for Priorities */}
            {(factors && (factors[0] !== 'NONE' || factors[1] !== 'NONE')) && (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: -0.5, mb: 0.5, px: 0.5 }}>
                    {factors[0] && factors[0] !== 'NONE' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#ffb300' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary' }}>
                                P1: {formatFactorName(factors[0])}
                            </Typography>
                        </Box>
                    )}
                    {factors[1] && factors[1] !== 'NONE' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#a855f7' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'text.secondary' }}>
                                P2: {formatFactorName(factors[1])}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* Section: OUTFIT (Weapons + Armor) */}
            <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>
                    Outfit
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {renderSlot(Slot.WEAPON[0], 0)} {/* Main Hand */}
                    {offhand > 0 && renderSlot(Slot.WEAPON[0], 1)} {/* Off Hand */}

                    {renderSlot(Slot.HEAD[0], 0)}
                    {renderSlot(Slot.CHEST[0], 0)}
                    {renderSlot(Slot.PANTS[0], 0)}
                    {renderSlot(Slot.BOOTS[0], 0)}
                </Box>
            </Box>

            {/* Section: ACCESSORIES */}
            <Box sx={{ maxWidth: '100%' }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>
                    Accessories
                </Typography>
                <Box sx={{ overflowX: 'auto', maxWidth: '100%', pb: 1.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 'max-content' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {displayEquip[Slot.ACCESSORY[0]].map((_, idx) => (
                                <React.Fragment key={`acc-${idx}`}>
                                    {renderSlot(Slot.ACCESSORY[0], idx)}
                                </React.Fragment>
                            ))}
                        </Box>
                        {/* Braces Row inside single SVG */}
{(p1Blocks.some(b => b.type === 'match') || p2Blocks.some(b => b.type === 'match')) && (
                            <Box sx={{ mt: 0.5, width: '100%' }}>
                                {(() => {
                                    const accessoryList = displayEquip && displayEquip.accessory ? displayEquip.accessory : [];
                                    const totalAccs = accessoryList.length;
                                    const svgWidth = totalAccs * 48 + (totalAccs - 1) * 4;
                                    const svgHeight = hasOverlap ? 54 : 28;

                                    const b1 = p1Blocks.find(b => b.type === 'match');
                                    const b2 = p2Blocks.find(b => b.type === 'match');

                                    let p1_y_offset = 0;
                                    let p1_text_y = 23;
                                    let p2_y_offset = hasOverlap ? 28 : 0;
                                    let p2_text_y = hasOverlap ? 51 : 23;

                                    if (hasOverlap && b1 && b2) {
                                        const p1_size = b1.count;
                                        const p2_size = b2.count;
                                        if (p2_size < p1_size) {
                                            // P2 is smaller, so P2 goes on top (offset 0) and P1 goes on bottom (offset 28)
                                            p2_y_offset = 0;
                                            p2_text_y = 23;
                                            p1_y_offset = 28;
                                            p1_text_y = 51;
                                        }
                                    }

                                    return (
                                        <svg width={svgWidth} height={svgHeight} style={{ display: 'block', overflow: 'visible' }}>
                                            {/* Render P1 Braces */}
                                            {p1Blocks.map((block, idx) => {
                                                if (block.type === 'match') {
                                                    const x = block.startIndex * 52;
                                                    const w = block.count * 48 + (block.count - 1) * 4;
                                                    const p1_tip_x = x + w / 2;
                                                    const color = '#ffb300';
                                                    return (
                                                        <React.Fragment key={`p1-svg-${idx}`}>
                                                            <path
                                                                d={getBracePathAt(x, w, p1_y_offset, 10, p1_tip_x)}
                                                                fill="none"
                                                                stroke={color}
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                            />
                                                            <text
                                                                x={p1_tip_x}
                                                                y={p1_text_y}
                                                                textAnchor="middle"
                                                                fill={color}
                                                                style={{
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 900,
                                                                    fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
                                                                }}
                                                            >
                                                                {getFactorLabel('P1', factors, Factors)}
                                                            </text>
                                                        </React.Fragment>
                                                    );
                                                }
                                                return null;
                                            })}

                                            {/* Render P2 Braces */}
                                            {p2Blocks.map((block, idx) => {
                                                if (block.type === 'match') {
                                                    const x = block.startIndex * 52;
                                                    const w = block.count * 48 + (block.count - 1) * 4;
                                                    const p2_tip_x = x + w / 2;
                                                    const color = '#a855f7';
                                                    return (
                                                        <React.Fragment key={`p2-svg-${idx}`}>
                                                            <path
                                                                d={getBracePathAt(x, w, p2_y_offset, 10, p2_tip_x)}
                                                                fill="none"
                                                                stroke={color}
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                            />
                                                            <text
                                                                x={p2_tip_x}
                                                                y={p2_text_y}
                                                                textAnchor="middle"
                                                                fill={color}
                                                                style={{
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 900,
                                                                    fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
                                                                }}
                                                            >
                                                                {getFactorLabel('P2', factors, Factors)}
                                                            </text>
                                                        </React.Fragment>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </svg>
                                    );
                                })()}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

export default React.memo(Paperdoll, (prevProps, nextProps) => {
    return (
        prevProps.equip === nextProps.equip &&
        prevProps.liveEquip === nextProps.liveEquip &&
        prevProps.optimizedEquip === nextProps.optimizedEquip &&
        prevProps.itemdata === nextProps.itemdata &&
        prevProps.locked === nextProps.locked &&
        prevProps.offhand === nextProps.offhand &&
        prevProps.syncStatus === nextProps.syncStatus &&
        prevProps.highlightEquipped === nextProps.highlightEquipped &&
        prevProps.factors === nextProps.factors &&
        prevProps.maxslots === nextProps.maxslots
    );
});
