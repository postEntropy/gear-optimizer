import React, { useMemo } from 'react';
import { Box, Paper, Typography, alpha, Grid, IconButton, Tooltip } from '@mui/material';
import { TargetItem } from '../Item/Item';
import { Slot } from '../../assets/ItemAux';

const Paperdoll = ({ equip, liveEquip, optimizedEquip, itemdata, handleClickItem, handleCtrlClickItem, handleShiftClickItem, handleRightClickItem, handleDropItem, locked, offhand, syncStatus = 'disconnected', onShare, highlightEquipped }) => {

    // Use optimizedEquip for display if available, otherwise fallback to current equip
    const displayEquip = optimizedEquip || equip;
    
    // Determine the actual current equipment setup we are checking against (liveSync if connected, fallback to active optimizer equip)
    const currentEquip = (syncStatus === 'connected' && liveEquip) ? liveEquip : equip;

    const isAllEquipped = useMemo(() => {
        if (!currentEquip || !displayEquip || !itemdata) {
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
    }, [displayEquip, currentEquip, itemdata, offhand]);

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
            <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>
                    Accessories
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: '100%' }}>
                    {displayEquip[Slot.ACCESSORY[0]].map((_, idx) => (
                        <React.Fragment key={`acc-${idx}`}>
                            {renderSlot(Slot.ACCESSORY[0], idx)}
                        </React.Fragment>
                    ))}
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
        prevProps.highlightEquipped === nextProps.highlightEquipped
    );
});
