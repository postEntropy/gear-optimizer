
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Tooltip, Switch, FormControlLabel, Typography, Dialog, DialogContent, alpha } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Crement } from '../../actions/Crement';
import { MassUpdate } from '../../actions/MassUpdateItems';
import { Settings } from '../../actions/Settings';
import { Deserializer } from './deserializeDotNet'
import { RecordHistory } from '../../actions/History';
import { ItemNameContainer } from '../../assets/ItemAux';
import { applySaveData } from '../../utils/saveHandling';




const ImportSaveForm = ({ hideSwitch = false, onSyncStatusChange, children, minimal = false, label = "Import" }) => {
    const dispatch = useDispatch();

    const optimizerState = useSelector(state => state.optimizer);
    const disableItems = optimizerState.disableUnowned !== false;
    const [syncStatus, setSyncStatus] = useState('disconnected'); // 'disconnected', 'connected', 'error'
    const [guideOpen, setGuideOpen] = useState(false);
    const [hasReceivedData, setHasReceivedData] = useState(false);
    let fileReader;

    const inputElem = useRef(null);

    // Mantém a ref sempre atualizada quando o state muda


    const handleFileRead = (file, content) => {
        let data;
        try {
            // Try to parse as JSON first (NGUSav.es format)
            data = JSON.parse(content);
        } catch (e) {
            // If JSON fails, try as Raw NRBF (native save)
            try {
                const rawResult = Deserializer.fromFile(content);
                if (!rawResult || !rawResult[1]) {
                    throw new Error("Deserializer returned invalid data structure");
                }
                const rawData = rawResult[1];
                data = Deserializer.convertData(undefined, rawData);
            } catch (e2) {
                console.error("Error parsing save file:", file.name, "as JSON:", e, "as NRBF:", e2);
                return null;
            }
        }

        if (!data) return null;


        // Try to extract timestamp from filename: Rebirth_2026-01-22_14-29-17
        let timestamp = file.lastModified || Date.now();
        const dateMatch = file.name.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
        if (dateMatch) {
            const [_, year, month, day, hour, minute, second] = dateMatch;
            timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).getTime();
        }

        // Return extracted stats for history
        const result = {
            rebirths: data.rebirths || data.numberRebirths || data.stats?.rebirthNumber || 0,
            exp: data.totalExperience || data.totalExp || data.totalExpEarned || data.stats?.totalExp || 0,

            baseEnergyCap: data.baseEnergyCap || data.energyPurchasedCap || data.purchasedEnergyCap || 0,
            baseMagicCap: data.baseMagicCap || data.magicPurchasedCap || data.purchasedMagicCap || 0,
            highestBoss: data.highestBoss || data.stats?.highestBoss || 0,
            highestHardBoss: data.highestHardBoss || 0,
            highestSadisticBoss: data.highestSadisticBoss || 0,
            nguLevels: (data.NGU?.skills || []).map(s => ({ normal: s.level || 0, evil: s.evilLevel || 0, sadistic: s.sadisticLevel || 0 })),
            magicNguLevels: (data.NGU?.magicSkills || []).map(s => ({ normal: s.level || 0, evil: s.evilLevel || 0, sadistic: s.sadisticLevel || 0 })),
            hackLevels: (Array.isArray(data.hacks?.hacks) ? data.hacks.hacks : (data.hacks?.hacks ? Object.values(data.hacks.hacks) : [])).map(h => (typeof h === 'object' ? h.level : h) || 0),

            // Resource Stats (Base/Purchased Cap for stable history)
            energyCap: data.energyPurchasedCap || data.baseEnergyCap || data.purchasedEnergyCap || data.capEnergy || 0,
            energyBars: data.energyBars || 0,
            energyPower: data.energyPower || 1,

            // Magic (Base/Purchased Cap)
            magicCap: data.magicPurchasedCap || data.magic?.purchasedMagicCap || data.magic?.capMagic || 0,
            magicBars: data.magic?.magicPerBar || 0,
            magicPower: data.magic?.magicPower || 1,

            // Res3 (Base/Purchased Cap)
            res3Cap: data.res3PurchasedCap || data.res3?.purchasedRes3Cap || data.res3?.capRes3 || 0,
            res3Bars: data.res3?.res3PerBar || 0,
            res3Power: data.res3?.res3Power || 1,

            // Advanced Metrics
            pp: data.adventure?.itopod?.lifetimePoints || data.itopod?.lifetimePoints || 0,
            ap: data.arbitrary?.curLifetimePoints || 0,

            // Playtime: Handle missing totalseconds by calculating from parts
            playtime: data.totalPlaytime ? (
                data.totalPlaytime.totalseconds ||
                ((data.totalPlaytime.days || 0) * 86400 +
                    (data.totalPlaytime.hours || 0) * 3600 +
                    (data.totalPlaytime.minutes || 0) * 60 +
                    (data.totalPlaytime.seconds || 0))
            ) : 0,


            challenges: Object.values(data.challenges || {}).reduce((acc, c) => acc + (typeof c === 'object' ? (c.curCompletions || 0) + (c.curEvilCompletions || 0) + (c.curSadisticCompletions || 0) : 0), 0),
            beardLevels: Array.isArray(data.beards?.beards) ? data.beards.beards.map(b => b?.permLevel || 0) : [],

            timestamp,
            isRebirth: file.name.toLowerCase().includes('rebirth'),
            // keep the full data locally for initial application
            fullData: data
        };

        return result;
    }





    // Initialize liveSyncEnabled from persisted state or default to true
    const liveSyncEnabled = optimizerState.liveSyncEnabled !== false;

    
    // Add stateRef so applySaveData works
    const stateRef = React.useRef(optimizerState);
    React.useEffect(() => {
        stateRef.current = optimizerState;
    }, [optimizerState]);

    // Read live sync status from global redux for the UI
    React.useEffect(() => {
        if (optimizerState.liveSync?.status) {
            setSyncStatus(optimizerState.liveSync.status);
            if (onSyncStatusChange) onSyncStatusChange(optimizerState.liveSync.status);
            if (optimizerState.liveSync.updateCount > 0) setHasReceivedData(true);
        }
    }, [optimizerState.liveSync?.status, optimizerState.liveSync?.updateCount, onSyncStatusChange]);

    const toggleLiveSync = () => {
        const newValue = !liveSyncEnabled;
        dispatch(Settings("liveSyncEnabled", newValue));
    }


    const handleFilePick = async (e) => {
        const files = Array.from(e.target.files);
        e.target.value = null;

        const results = await Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const processed = handleFileRead(file, event.target.result);
                    resolve(processed);
                };
                reader.readAsText(file);
            });
        }));

        const validResults = results.filter(r => r !== null);
        if (validResults.length === 0) return;

        // Record only Rebirth saves in history
        validResults.forEach(res => {
            const { fullData, isRebirth, ...historyData } = res;
            if (isRebirth) {
                dispatch(RecordHistory(historyData));
            }
        });

        // Apply only the one with the highest rebirth count (latest)
        const latest = validResults.sort((a, b) => {
            if (a.rebirths !== b.rebirths) return b.rebirths - a.rebirths;
            return b.timestamp - a.timestamp;
        })[0];

        if (latest) {
            applySaveData(latest.fullData, stateRef.current, disableItems, dispatch);
        }
    }


    if (minimal) {
        return (
            <Box>
                <input ref={inputElem} style={{ display: "none" }} type='file' id='savefileloader'
                    multiple onChange={e => handleFilePick(e)} />
                <Tooltip title="Bulk import rebirth save files to populate history" arrow>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<UploadFileIcon />}
                        onClick={() => inputElem.current.click()}
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 700,
                            textTransform: 'none',
                            px: 3,
                            boxShadow: (theme) => `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                            '&:hover': {
                                boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.6)}`,
                            }
                        }}
                    >
                        {label}
                    </Button>
                </Tooltip>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 0.5 }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%'
            }}>
                <input ref={inputElem} style={{ display: "none" }} type='file' id='savefileloader'
                    multiple onChange={e => handleFilePick(e)} />

                <Tooltip title="Manually import save files" placement="bottom">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => inputElem.current.click()}
                        sx={{
                            borderRadius: '8px',
                            flex: '1 1 auto',
                            py: 0.5,
                            minWidth: 0,
                            fontWeight: 700,
                        }}
                    >
                        Import
                    </Button>
                </Tooltip>

                <Button
                    variant="outlined"
                    onClick={() => setGuideOpen(true)}
                    disabled={!liveSyncEnabled}
                    sx={{
                        borderRadius: '8px',
                        flex: '1 1 auto',
                        py: 0.5,
                        minWidth: 0,
                        fontWeight: 700,
                        borderColor: liveSyncEnabled ? 'primary.main' : 'action.disabled',
                        color: liveSyncEnabled ? 'primary.main' : 'action.disabled',
                        background: liveSyncEnabled ? 'rgba(0, 255, 255, 0.02)' : 'transparent',
                        '&:hover': {
                            borderColor: liveSyncEnabled ? 'primary.light' : 'action.disabled',
                            background: liveSyncEnabled ? 'rgba(0, 255, 255, 0.08)' : 'transparent',
                        }
                    }}
                >
                    Live Sync {liveSyncEnabled && (syncStatus === 'connected' ? '🟢' : '🔴')}
                </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '0 0 auto', mr: 1 }}>
                    <Tooltip title="When enabled, Live Sync will update your Current Equipment automatically. Disable to view/edit Saved Loadouts without interruption." arrow>
                        <FormControlLabel
                            sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.85rem' } }}
                            control={
                                <Switch
                                    size="small"
                                    checked={optimizerState.syncEquip !== false}
                                    onChange={() => dispatch(Settings("syncEquip", !optimizerState.syncEquip))}
                                />
                            }
                            label="Sync Equipment"
                        />
                    </Tooltip>
                </Box>

                <Box sx={{ flex: '0 0 auto', mr: 1 }}>
                    <Tooltip title="Enable/Disable Live Sync Connection" arrow>
                        <FormControlLabel
                            sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.85rem' } }}
                            control={
                                <Switch
                                    size="small"
                                    checked={liveSyncEnabled}
                                    onChange={toggleLiveSync}
                                />
                            }
                            label="Enable Live Sync"
                        />
                    </Tooltip>
                </Box>

                {!hideSwitch && (
                    <Box sx={{ flex: '0 0 auto', mr: 1 }}>
                        <Tooltip title="Disable unowned items upon import" arrow>
                            <FormControlLabel
                                sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.85rem' } }}
                                control={
                                    <Switch
                                        size="small"
                                        checked={disableItems}
                                        onChange={() => dispatch(Settings("disableUnowned", !disableItems))}
                                    />
                                }
                                label="Disable unowned"
                            />
                        </Tooltip>
                    </Box>
                )}
                {children}
            </Box>

            {/* Sync Setup Dialog */}
            <Dialog
                open={guideOpen}
                onClose={() => setGuideOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'white',
                        backgroundImage: 'none',
                        boxShadow: 24
                    }
                }}
            >
                <DialogContent sx={{ p: 4, position: 'relative' }}>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>📡 Live Sync Setup Guide</Typography>
                        <Box sx={{
                            px: 1.5, py: 0.5, borderRadius: 50,
                            bgcolor: syncStatus === 'connected' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 61, 0, 0.1)',
                            border: '1px solid',
                            borderColor: syncStatus === 'connected' ? 'success.main' : 'error.main',
                            display: 'flex', alignItems: 'center', gap: 1
                        }}>
                            <Box sx={{
                                width: 8, height: 8, borderRadius: '50%',
                                bgcolor: syncStatus === 'connected' ? 'success.main' : 'error.main',
                                animation: syncStatus === 'connected' ? 'pulse 2s infinite' : 'none',
                                '@keyframes pulse': {
                                    '0%': { opacity: 1, transform: 'scale(1)' },
                                    '50%': { opacity: 0.4, transform: 'scale(1.2)' },
                                    '100%': { opacity: 1, transform: 'scale(1)' }
                                }
                            }} />
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: syncStatus === 'connected' ? 'success.main' : 'error.main' }}>
                                {syncStatus === 'connected' ? 'CONNECTED' : 'WAITING FOR GAME...'}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <StepItem
                            num="1"
                            title="Download & Install Mod"
                            desc={
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography
                                        component="a"
                                        href="./NGULiveSync.dll"
                                        download
                                        sx={{
                                            color: 'primary.main',
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                            borderBottom: '1px solid',
                                            borderColor: 'primary.main',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                color: 'primary.light',
                                                borderColor: 'primary.light'
                                            }
                                        }}
                                    >
                                        1. Download NGULiveSync.dll
                                    </Typography>
                                    <Typography
                                        component="a"
                                        href="./Newtonsoft.Json.dll"
                                        download
                                        sx={{
                                            color: 'primary.main',
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                            borderBottom: '1px solid',
                                            borderColor: 'primary.main',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                color: 'primary.light',
                                                borderColor: 'primary.light'
                                            }
                                        }}
                                    >
                                        2. Download Newtonsoft.Json.dll
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Place <b>BOTH</b> files in your <code>BepInEx/plugins</code> folder.
                                    </Typography>
                                </Box>
                            }
                            active={true}
                            completed={true}
                        />
                        <StepItem
                            num="2"
                            title="Open the Game"
                            desc="Launch NGU Idle. The mod will automatically start the connection."
                            active={syncStatus === 'connected'}
                            completed={syncStatus === 'connected'}
                        />
                        <StepItem
                            num="3"
                            title="Sync Active!"
                            desc={hasReceivedData ? "Data received! The optimizer is now updating live." : "Waiting for the first save data bundle from the game..."}
                            active={syncStatus === 'connected'}
                            completed={hasReceivedData}
                        />
                    </Box>

                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => setGuideOpen(false)}
                        sx={{ mt: 4, borderRadius: 2 }}
                    >
                        Got it!
                    </Button>
                </DialogContent>
            </Dialog>
        </Box >
    )
}

const StepItem = ({ num, title, desc, active, completed }) => (
    <Box sx={{ display: 'flex', gap: 2, opacity: active ? 1 : 0.4, transition: 'all 0.4s ease' }}>
        <Box sx={{
            width: 32, height: 32, borderRadius: '50%',
            bgcolor: completed ? 'success.main' : 'action.disabledBackground',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', color: completed ? 'white' : 'text.secondary',
            flexShrink: 0,
            boxShadow: completed ? '0 0 10px rgba(76, 175, 80, 0.4)' : 'none'
        }}>
            {completed ? '✓' : num}
        </Box>
        <Box>
            <Typography sx={{ fontWeight: 'bold', color: completed ? 'success.main' : 'text.primary', transition: 'color 0.3s' }}>{title}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{desc}</Typography>
        </Box>
    </Box>
);

ImportSaveForm.propTypes = {}
export default ImportSaveForm;
