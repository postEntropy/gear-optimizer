import React, { useMemo } from 'react';
import { Box, Typography, Paper, Divider, Tooltip } from '@mui/material';
import { NGU } from '../../NGU';
import { shorten } from '../../util';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Memoized Milestone to prevent redundant re-renders
const Milestone = React.memo(({ timeLabel, levels, dLevels, bonusMultiplier, isLast, color, isHighlighted }) => {
    const percentage = Math.round((bonusMultiplier - 1) * 100);
    const hasGain = percentage !== 0;

    const LevelChip = ({ label, value, delta, color, tooltip }) => (
        <Tooltip title={tooltip}>
            <Box sx={{
                bgcolor: `${color}1a`, // 10% opacity
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: '60px',
                border: '1px solid',
                borderColor: `${color}33`
            }}>
                <Typography variant="caption" sx={{ color: color, fontWeight: 'bold', fontSize: '0.7rem' }}>
                    {label}: {shorten(value)}
                </Typography>
                {delta > 0 && (
                    <Typography variant="caption" sx={{ color: color, fontSize: '0.65rem', opacity: 0.9 }}>
                        (+{shorten(delta)})
                    </Typography>
                )}
            </Box>
        </Tooltip>
    );

    return (
        <Box sx={{
            position: 'relative',
            flex: 1,
            minWidth: '150px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Time Label */}
                <Typography variant="caption" sx={{
                    fontWeight: isHighlighted ? 'bold' : 'medium',
                    color: isHighlighted ? 'primary.main' : 'text.secondary',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: isHighlighted ? '0.8rem' : '0.75rem',
                    transition: 'all 0.3s ease',
                    height: '24px'
                }}>
                    <AccessTimeIcon sx={{ fontSize: isHighlighted ? '1rem' : '0.875rem' }} /> {timeLabel}
                </Typography>

                {/* the dot */}
                <Box sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: isHighlighted ? 'primary.main' : color,
                    border: '2px solid white',
                    boxShadow: isHighlighted ? 3 : 1,
                    zIndex: 2,
                    mb: 2,
                    transform: isHighlighted ? 'scale(1.4)' : 'scale(1)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }} />

                {/* Line connecting to next */}
                {!isLast && (
                    <Box sx={{
                        position: 'absolute',
                        top: '36px',
                        left: 'calc(50% + 6px)',
                        right: 'calc(-50% + 6px)',
                        height: '2px',
                        bgcolor: 'divider',
                        zIndex: 1,
                        transition: 'all 0.3s ease'
                    }} />
                )}

                {/* Content Card */}
                <Paper elevation={isHighlighted ? 4 : 0} sx={{
                    p: 1.5,
                    bgcolor: isHighlighted ? 'background.paper' : 'background.default',
                    border: '1px solid',
                    borderColor: isHighlighted ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    width: '95%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    transform: isHighlighted ? 'scale(1.05)' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    zIndex: isHighlighted ? 3 : 2,
                    minHeight: '130px'
                }}>
                    <Box sx={{ transition: 'opacity 0.2s ease' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}>Levels & Gains</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                            <LevelChip label="N" value={levels.normal} delta={dLevels.normal} color="#2196f3" tooltip="Normal Level" />
                            <LevelChip label="E" value={levels.evil} delta={dLevels.evil} color="#f44336" tooltip="Evil Level" />
                            <LevelChip label="S" value={levels.sadistic} delta={dLevels.sadistic} color="#9c27b0" tooltip="Sadistic Level" />
                        </Box>
                    </Box>

                    <Divider sx={{ opacity: 0.5 }} />

                    <Box sx={{ transition: 'opacity 0.2s ease' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Bonus Gain</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <TrendingUpIcon sx={{ fontSize: '1rem' }} /> ×{shorten(bonusMultiplier, 3)}
                            {hasGain && (
                                <Typography component="span" variant="caption" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                    (+{percentage}%)
                                </Typography>
                            )}
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
});

const NGUTimeline = (props) => {
    const { ngustats, ngu, isMagic } = props;
    const quirk = ngustats.quirk;

    const milestonesData = useMemo(() => {
        const nguOptimizer = new NGU(props);
        const setTimeMinutes = ngustats.ngutime || 0;
        const setTimeHours = setTimeMinutes / 60;

        const currentLevels = ngu.levels;
        const pos = ngu.pos;

        // Get initial bonus to calculate change
        const initialReachable = nguOptimizer.reachableBonus(currentLevels, 0, pos, isMagic, quirk);
        const initialEvilBonus = initialReachable.bonus.evil;
        const initialLevels = initialReachable.level;

        const getMilestone = (hours, label, id, isHighlighted = false) => {
            const minutes = hours * 60;
            const reachable = nguOptimizer.reachableBonus(currentLevels, minutes, pos, isMagic, quirk);
            const levelData = reachable.level;

            return {
                id,
                label,
                levels: levelData,
                dLevels: {
                    normal: levelData.normal - initialLevels.normal,
                    evil: levelData.evil - initialLevels.evil,
                    sadistic: levelData.sadistic - initialLevels.sadistic
                },
                bonusMultiplier: reachable.bonus.evil / initialEvilBonus,
                isHighlighted
            };
        };

        let milestones = [];

        // 1. Always "Now"
        milestones.push(getMilestone(0, 'Now', 'now'));

        // 2. Middle Milestone
        if (setTimeHours > 0 && setTimeHours < 10) {
            milestones.push(getMilestone(setTimeHours, `${shorten(setTimeHours, 1)}h (Set)`, 'set', true));
        } else {
            milestones.push(getMilestone(4, '4 Hours', '4h'));
        }

        // 3. Late Milestone
        if (setTimeHours >= 10 && setTimeHours < 20) {
            milestones.push(getMilestone(setTimeHours, `${shorten(setTimeHours, 1)}h (Set)`, 'set', true));
        } else {
            milestones.push(getMilestone(12, '12 Hours', '12h'));
        }

        // 4. Always 24h
        const is24hSet = setTimeHours >= 20;
        milestones.push(getMilestone(is24hSet ? setTimeHours : 24, is24hSet ? `${shorten(setTimeHours, 1)}h (Set)` : '24 Hours', is24hSet ? 'set' : '24h', is24hSet));

        return milestones;
    }, [ngustats.ngutime, ngu.levels, ngu.pos, isMagic, quirk]);

    const getColor = (name) => {
        const colors = [
            '#ff9800', '#2196f3', '#4caf50', '#f44336', '#9c27b0',
            '#00bcd4', '#ffeb3b', '#795548', '#607d8b', '#e91e63'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const timelineColor = useMemo(() => getColor(ngu.name), [ngu.name]);

    return (
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2, mt: 1, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4, gap: 1 }}>
                <TrendingUpIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {ngu.name} - Progress Timeline
                </Typography>
            </Box>

            <Box sx={{
                display: 'flex',
                overflowX: 'auto',
                pb: 4,
                pt: 2,
                '&::-webkit-scrollbar': { height: '8px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '4px' }
            }}>
                {milestonesData.map((ms, idx) => (
                    <Milestone
                        key={ms.id}
                        timeLabel={ms.label}
                        levels={ms.levels}
                        dLevels={ms.dLevels}
                        bonusMultiplier={ms.bonusMultiplier}
                        isLast={idx === milestonesData.length - 1}
                        color={timelineColor}
                        isHighlighted={ms.isHighlighted}
                    />
                ))}
            </Box>
        </Paper>
    );
};

export default NGUTimeline;
