import React from 'react';
import { Box, Paper, Typography, alpha, Grid, IconButton, Tooltip } from '@mui/material';
import { TargetItem } from '../Item/Item';
import { Slot } from '../../assets/ItemAux';

const Paperdoll = ({ equip, optimizedEquip, itemdata, handleClickItem, handleCtrlClickItem, handleShiftClickItem, handleRightClickItem, handleDropItem, locked, offhand, syncStatus = 'disconnected', onShare, highlightEquipped }) => {

    // Use optimizedEquip for display if available, otherwise fallback to current equip
    const displayEquip = optimizedEquip || equip;

    const renderSlot = (slotType, index = 0) => {
        const itemId = displayEquip[slotType][index];
        const item = itemdata[itemId];
        const isActive = !!(item && !item.empty);

        // Check if item is currently equipped in the actual 'equip' loadout
        let isEquipped = false;
        if (isActive && equip && equip[slotType]) {
            isEquipped = equip[slotType].includes(itemId);
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
            borderColor: 'divider',
            borderRadius: 2
        }}>
            {/* Header / Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: -0.5 }}>
                <Typography variant="overline" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                    Gear Optimizer
                </Typography>

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

export default Paperdoll;
