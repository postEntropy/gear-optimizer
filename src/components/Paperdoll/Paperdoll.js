import React from 'react';
import { Box, Paper, Typography, alpha, Grid } from '@mui/material';
import { TargetItem } from '../Item/Item';
import { Slot } from '../../assets/ItemAux';

const hudStyles = {
    container: (theme) => ({
        p: 3,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 450,
        background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.3),
        borderRadius: 4,
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.1)}`,
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)} 1px, transparent 1px)`,
            backgroundSize: '25px 25px',
            pointerEvents: 'none'
        }
    }),
    slotFrame: (theme, active) => ({
        width: 64,
        height: 64,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: alpha(theme.palette.background.default, 0.6),
        border: '1px solid',
        borderColor: active ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.2),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
            borderColor: theme.palette.secondary.main,
            boxShadow: `0 0 15px ${alpha(theme.palette.secondary.main, 0.3)}`,
            transform: 'scale(1.05)'
        },
        '&::before, &::after': {
            content: '""',
            position: 'absolute',
            width: 8, height: 8,
            borderColor: active ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.4),
            borderStyle: 'solid'
        },
        '&::before': { top: -2, left: -2, borderTopWidth: 2, borderLeftWidth: 2 },
        '&::after': { bottom: -2, right: -2, borderBottomWidth: 2, borderRightWidth: 2 }
    })
};

const Paperdoll = ({ equip, itemdata, handleClickItem, handleCtrlClickItem, handleShiftClickItem, handleRightClickItem, handleDropItem, locked, offhand, syncStatus = 'disconnected' }) => {

    const renderSlot = (slotType, index = 0, label = '') => {
        const itemId = equip[slotType][index];
        const item = itemdata[itemId];
        const isActive = !!(item && !item.empty);

        return (
            <Box key={`${slotType}-${index}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Box sx={(theme) => hudStyles.slotFrame(theme, isActive)}>
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
                            size="large"
                        />
                    ) : (
                        <Typography variant="caption" sx={{ opacity: 0.2, fontSize: '0.45rem', fontWeight: 900, textAlign: 'center' }}>
                            {label || slotType.toUpperCase()}
                        </Typography>
                    )}
                </Box>
                {isActive && (
                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'primary.main', fontWeight: 'bold' }}>
                        LVL {item.level}
                    </Typography>
                )}
            </Box>
        );
    };

    return (
        <Paper elevation={0} sx={hudStyles.container}>
            <Box sx={{ position: 'absolute', top: 10, left: 15, opacity: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', fontSize: '0.45rem' }}>HUD_ACTIVE: TRUE</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', fontSize: '0.45rem' }}>V2.4.4_TACTICAL</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                        width: 5, height: 5, borderRadius: '50%',
                        bgcolor: syncStatus === 'connected' ? 'success.main' : 'error.main',
                        animation: syncStatus === 'connected' ? 'pulse 2s infinite' : 'none',
                        boxShadow: (theme) => syncStatus === 'connected' ? `0 0 5px ${theme.palette.success.main}` : 'none'
                    }} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.45rem', letterSpacing: 1 }}>
                        LIVE_SYNC: {syncStatus.toUpperCase()}
                    </Typography>
                </Box>
            </Box>

            <Typography variant="overline" sx={{ letterSpacing: 6, fontWeight: 900, color: 'primary.main', mb: 4, opacity: 0.8 }}>
                GEAR DIAGNOSTICS
            </Typography>

            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                {/* Left Side: Body Armor - Forced alignment to right to push against center */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'primary.main', opacity: 0.6, fontSize: '0.55rem', mb: -1, pr: 1 }}>DEFENSE</Typography>
                    {renderSlot(Slot.HEAD[0], 0, 'NEURAL')}
                    {renderSlot(Slot.CHEST[0], 0, 'CORE')}
                    {renderSlot(Slot.PANTS[0], 0, 'KINETIC')}
                    {renderSlot(Slot.BOOTS[0], 0, 'GRAVITY')}
                </Box>

                {/* Center: Weapons & Core - Anchor for centering */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', width: 180, flexShrink: 0 }}>
                    <Box sx={{
                        width: 130, height: 180, border: '1px solid',
                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                        borderRadius: '20px 20px 80px 80px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: (theme) => `linear-gradient(to bottom, transparent, ${alpha(theme.palette.primary.main, 0.05)})`,
                        position: 'relative'
                    }}>
                        <Box sx={{
                            width: 50, height: 50, borderRadius: '50%', border: '1px solid', borderColor: 'primary.main',
                            boxShadow: (theme) => `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                            animation: 'pulse 2s infinite ease-in-out',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Typography sx={{ fontSize: '0.45rem', color: 'primary.main', fontWeight: 'bold' }}>CORE</Typography>
                        </Box>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: (theme) => theme.palette.primary.main, opacity: 0.2, animation: 'scan 4s infinite linear' }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {renderSlot(Slot.WEAPON[0], 0, 'PRI')}
                        {offhand > 0 && renderSlot(Slot.WEAPON[0], 1, 'SEC')}
                    </Box>
                </Box>

                {/* Expanded Right Column for Accessories */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'primary.main', opacity: 0.6, fontSize: '0.55rem', mb: 1, pl: 1 }}>AUGMENTS</Typography>
                    <Grid container columns={3} spacing={1} sx={{ width: 210 }}>
                        {equip[Slot.ACCESSORY[0]].map((_, idx) => (
                            <Grid item xs={1} key={`acc-${idx}`}>
                                {renderSlot(Slot.ACCESSORY[0], idx, `A${idx + 1}`)}
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>

            <style>{`
                @keyframes pulse { 0% { opacity: 0.4; transform: scale(0.95); } 50% { opacity: 0.8; transform: scale(1.05); } 100% { opacity: 0.4; transform: scale(0.95); } }
                @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
            `}</style>
        </Paper>
    );
};

export default Paperdoll;
