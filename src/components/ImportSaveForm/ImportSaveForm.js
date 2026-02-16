
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


// minimal boss for each zone, per difficulty
const sadisticZones = [
    // TODO: add new zones here
    [248, 44],
    [240, 42],
    [232, 41],
    [224, 40],
    [216, 38],
    [208, 37],
    [175, 36],
    [150, 35],
    [125, 34],
];

const evilZones = [
    [200, 33],
    [190, 32],
    [182, 30],
    [174, 29],
    [166, 28],
    [158, 26],
    [125, 25],
    [100, 24],
    [58, 23],
];

const normalZones = [
    [138, 22],
    [132, 21],
    [124, 20],
    [116, 19],
    [108, 17],
    [100, 16],
    [90, 14],
    [82, 13],
    [74, 11],
    [66, 10],
    [58, 8],
    [48, 6],
    [37, 5],
    [17, 4],
    [7, 3],
];

const ImportSaveForm = ({ hideSwitch = false, onSyncStatusChange, children, minimal = false, label = "Import" }) => {
    const dispatch = useDispatch();

    const optimizerState = useSelector(state => state.optimizer);
    const [disableItems, setDisableItems] = useState(true);
    const [syncStatus, setSyncStatus] = useState('disconnected'); // 'disconnected', 'connected', 'error'
    const [guideOpen, setGuideOpen] = useState(false);
    const [hasReceivedData, setHasReceivedData] = useState(false);
    let fileReader;

    const inputElem = useRef(null);

    const handleFileRead = (file, content) => {
        let data;
        try {
            // Try to parse as JSON first (NGUSav.es format)
            data = JSON.parse(content);
        } catch (e) {
            // If JSON fails, try as Raw NRBF (native save)
            try {
                const rawData = Deserializer.fromFile(content)[1];
                data = Deserializer.convertData(undefined, rawData);
            } catch (e2) {
                console.error("Error parsing save file:", file.name, e);
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





    const getZone = (B, eB, sB) => {
        let zones = [sadisticZones, evilZones, normalZones];
        let bosses = [sB, eB, B];
        for (let i = 0; i < 3; i++) {
            if (bosses[i] <= 1) {
                // not in this difficulty yet
                continue;
            }
            for (let j = 0; j < zones[i].length; j++) {
                if (bosses[i] >= zones[i][j][0]) {
                    return zones[i][j][1];
                }
            }
        }
        return 2;
    }

    const updateAugmentTab = (data) => {
        let energyCap = Math.max(data.capEnergy, data.curEnergy)
        let nac;
        let lsc;
        let augdata = data.challenges
        nac = augdata.noAugsChallenge.curCompletions
        lsc = augdata.laserSwordChallenge.curCompletions
        dispatch(Settings("augstats", { ...stateRef.current.augstats, lsc: lsc, nac: nac, ecap: energyCap }))
    }

    const stateRef = useRef(optimizerState);
    React.useEffect(() => {
        stateRef.current = optimizerState;
    }, [optimizerState]);

    const updateHackTab = (data) => {
        if (!data || !data.hacks || !data.hacks.hacks) return;

        // Use the ref to get the absolute LATEST state, avoiding closure bugs
        const currentHackstats = stateRef.current.hackstats;


        // Create a clean new state based on CURRENT hackstats
        // We ONLY update the levels, keeping rpow, rcap, and hackspeed as they are
        let newHacks = currentHackstats.hacks.map((h, i) => {
            const importedHacks = Array.isArray(data.hacks?.hacks) ? data.hacks.hacks : (data.hacks?.hacks ? Object.values(data.hacks.hacks) : []);
            const importedHack = importedHacks[i];
            return {
                ...h,
                level: importedHack !== undefined && importedHack !== null ? (typeof importedHack === 'object' ? (importedHack.level || 0) : importedHack) : h.level
            };
        });

        const newState = {
            ...currentHackstats,
            hacks: newHacks
        };

        dispatch(Settings("hackstats", newState));
    }


    const updateItemLevels = (data, newData) => {
        let equipped = data.inventory

        // fix [null, null] entries that make the accs array always have length 20
        equipped.accs = equipped.accs.filter(x => x && !isNaN(x.id));

        let foundIds = []
        const lootys = [67, 128, 169, 230, 296, 389, 431, 505]
        const pendants = [53, 76, 94, 142, 170, 229, 295, 388, 430, 504]

        let hL = 0;
        let hP = 0;

        let found = {};

        const updateItem = (item, _) => {
            if (!item) {
                return;
            }
            let id = item.id;
            let level = item.level;
            if (id !== undefined && id in newData && level !== undefined) {
                if (found[id] !== undefined) {
                    // multiple copies !
                    if (level < newData[id].level) {
                        return;
                    }
                }
                found[id] = true;
                newData[id].level = level;
                foundIds.push(id);
                if (lootys.includes(id) && id > hL) {
                    // set highest looty
                    hL = id;
                }
                if (pendants.includes(id) && id > hP) {
                    // set highest pendant
                    hP = id;
                }
            }
        };
        // gather equipment, accs, and inventory items
        for (let i of Object.keys(equipped)) {
            updateItem(equipped[i], i);
        }
        for (let i = 0; i < equipped.accs.length; i++) {
            updateItem(equipped.accs[i], i);
        }
        for (let i of Object.keys(equipped.inventory)) {
            updateItem(equipped.inventory[i], i)
        }

        let lIndex = lootys.indexOf(hL)
        let pIndex = pendants.indexOf(hP)
        let accSlots = equipped.accs.length


        dispatch(Settings("accslots", accSlots))

        dispatch(Settings("looty", lIndex))
        dispatch(Settings("pendant", pIndex))


        return foundIds
    }

    const calculateDiff = (current, newV) => {
        return newV - current;
    }

    const updateNgus = (data) => {
        let ngus = []
        for (let i = 0; i < data.NGU.skills.length; i++) {
            const skill = data.NGU.skills[i];
            let temp = {}
            temp.normal = skill.level
            temp.evil = skill.evilLevel
            temp.sadistic = skill.sadisticLevel
            ngus.push(temp)
        }

        let mngus = []
        for (let i = 0; i < data.NGU.magicSkills.length; i++) {
            const magicSkill = data.NGU.magicSkills[i];
            let temp = {}
            temp.normal = magicSkill.level
            temp.evil = magicSkill.evilLevel
            temp.sadistic = magicSkill.sadisticLevel
            mngus.push(temp)
        }

        let newState = JSON.parse(JSON.stringify(stateRef.current.ngustats));

        newState.quirk.e2n = data.beastQuest.quirkLevel[14] > 0
        newState.quirk.s2e = data.beastQuest.quirkLevel[89] > 0
        newState.blueHeart = data.inventory.itemList.itemMaxxed[195]
        newState.eBetaPot = data.arbitrary.energyPotion2InUse
        newState.eDeltaPot = data.arbitrary.energyPotion1Time.totalseconds > 0
        newState.energy.cap = Math.max(data.capEnergy, data.curEnergy)
        newState.energy.ngus = ngus
        newState.mBetaPot = data.arbitrary.magicPotion2InUse
        newState.mDeltaPot = data.arbitrary.magicPotion1Time.totalseconds > 0
        newState.magic.cap = Math.max(data.magic.capMagic, data.magic.curMagic)
        newState.magic.ngus = mngus

        dispatch(Settings("ngustats",
            newState
        ))
    }

    const updateEquipped = (data) => {
        // Check if syncEquip is enabled in Redux state
        if (!stateRef.current.syncEquip) return;

        const inv = data.inventory;
        const offhand = inv.weapon2 && inv.weapon2.id > 0 ? 1 : 0;
        const accSlots = inv.accs.length;

        let newEquip = ItemNameContainer(accSlots, offhand);

        const setItem = (slot, idx, item) => {
            if (item && item.id > 0) {
                newEquip[slot][idx] = item.id;
            }
        };

        setItem('head', 0, inv.head);
        setItem('armor', 0, inv.chest);
        setItem('pants', 0, inv.legs);
        setItem('boots', 0, inv.boots);
        setItem('weapon', 0, inv.weapon);
        if (offhand) {
            setItem('weapon', 1, inv.weapon2);
        }

        inv.accs.forEach((acc, i) => {
            if (i < accSlots) {
                setItem('accessory', i, acc);
            }
        });

        dispatch(Settings("offhand", offhand));
        dispatch(Settings("equip", newEquip));
    }

    const disableUnownedItems = (foundIds, newData) => {
        for (let i of Object.keys(newData)) {
            if (!foundIds.includes(newData[i].id)) {
                newData[i].disable = true
            }
        }
    }

    const resetItems = (newdata) => {
        for (let i of Object.keys(newdata)) {
            newdata[i].disable = false
            newdata[i].level = 100
        }
    }

    const applyData = (data, fromLiveSync = false) => {

        let newItemData = {};
        Object.keys(stateRef.current.itemdata).forEach(key => {
            const item = stateRef.current.itemdata[key];
            newItemData[key] = Object.assign(Object.create(Object.getPrototypeOf(item)), item);
        });

        let zone = getZone(
            data.highestBoss,
            data.highestHardBoss,
            data.highestSadisticBoss,
        );

        dispatch(Settings("zone", zone));
        resetItems(newItemData)
        let found = updateItemLevels(data, newItemData)
        if (disableItems) {
            disableUnownedItems(found, newItemData)
        }

        dispatch(MassUpdate(newItemData))
        updateNgus(data)
        updateAugmentTab(data)
        updateHackTab(data)

        updatePerkTab(data)
        updateEquipped(data)
    }

    const updatePerkTab = (data) => {
        if (data && data.adventure && data.adventure.itopod && data.adventure.itopod.perkLevel) {
            const perkLevel = data.adventure.itopod.perkLevel;
            dispatch(Settings("adventure", {
                itopod: {
                    perkLevel: perkLevel
                }
            }));
        } else if (data && data.itopod && data.itopod.perkLevel) {
            // Support for potentially flattened structure or diferent save versions
            const perkLevel = data.itopod.perkLevel;
            dispatch(Settings("adventure", {
                itopod: {
                    perkLevel: perkLevel
                }
            }));
        }
    }

    // Initialize liveSyncEnabled from persisted state or default to true
    const liveSyncEnabled = optimizerState.liveSyncEnabled !== false;

    // Live Sync Listener
    React.useEffect(() => {
        let eventSource;

        // Only connect if enabled
        if (!liveSyncEnabled) {
            setSyncStatus('disconnected');
            if (onSyncStatusChange) onSyncStatusChange('disconnected');
            return;
        }

        const connect = () => {
            eventSource = new EventSource('http://localhost:3005/events');

            eventSource.onopen = () => {
                setSyncStatus('connected');
                dispatch(Settings("liveSync", {
                    ...optimizerState.liveSync,
                    status: 'connected'
                }));
                if (onSyncStatusChange) onSyncStatusChange('connected');
            };

            eventSource.onmessage = (event) => {
                try {
                    let data;
                    if (event.data.trim().startsWith('{')) {
                        // Old JSON format
                        data = JSON.parse(event.data);
                    } else {
                        // New Base64 format (native save)
                        const extracted = handleFileRead({ name: "LiveSync.txt" }, event.data);
                        if (extracted && extracted.fullData) {
                            data = extracted.fullData;
                        }
                    }

                    if (data) {
                        setHasReceivedData(true);

                        // Update Redux Metrics
                        dispatch(Settings("liveSync", {
                            status: 'connected',
                            lastUpdate: Date.now(),
                            updateCount: (stateRef.current.liveSync?.updateCount || 0) + 1
                        }));

                        applyData(data, true);
                    }
                } catch (err) {
                    console.error("❌ Error parsing live sync data:", err);
                }
            };

            eventSource.onerror = (err) => {
                console.warn("⚠️ Live Sync connection error. Current state:", eventSource.readyState);
                if (eventSource.readyState === 2) {
                }
                setSyncStatus('error');
                dispatch(Settings("liveSync", {
                    ...optimizerState.liveSync,
                    status: 'error'
                }));
                if (onSyncStatusChange) onSyncStatusChange('error');
                eventSource.close();
                // Retry after 10 seconds only if still enabled
                if (liveSyncEnabled) {
                    setTimeout(connect, 10000);
                }
            };
        };

        connect();

        return () => {
            if (eventSource) eventSource.close();
        };
    }, [liveSyncEnabled]); // Run when enabled state changes

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
            applyData(latest.fullData);
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
                                        onChange={() => setDisableItems(!disableItems)}
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
                                <Box>
                                    <Typography
                                        component="a"
                                        href="https://github.com/postEntropy/gear-optimizer/raw/master/public/NGULiveSync.dll"
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
                                        Click here to download NGULiveSync.dll
                                    </Typography>.
                                    <br />
                                    Place the file in your <code>BepInEx/plugins</code> folder.
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
