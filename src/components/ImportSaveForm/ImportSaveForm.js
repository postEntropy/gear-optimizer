
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Tooltip, Switch, FormControlLabel } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Crement } from '../../actions/Crement';
import { MassUpdate } from '../../actions/MassUpdateItems';
import { Settings } from '../../actions/Settings';
import { Deserializer } from './deserializeDotNet'
import { RecordHistory } from '../../actions/History';


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

const ImportSaveForm = ({ hideSwitch = false }) => {
    const dispatch = useDispatch();

    const optimizerState = useSelector(state => state.optimizer);
    const [disableItems, setDisableItems] = useState(false);
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
                console.error("Error parsing save file:", file.name, e, e2);
                return null;
            }
        }

        if (!data) return null;

        // Debug log to help identify property names in user save
        console.log("Extracted save data structure:", data);

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
            hackLevels: (data.hacks?.hacks || []).map(h => h.level || 0),

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

        // Debug: Log extracted metrics
        console.log("📊 Extracted Metrics:", {
            pp: result.pp,
            qp: result.qp,
            challenges: result.challenges,
            beardLevels: result.beardLevels,
            attackMulti: result.attackMulti,
            defenseMulti: result.defenseMulti
        });

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
        dispatch(Settings("augstats", { ...optimizerState.augstats, lsc: lsc, nac: nac, ecap: energyCap }))
    }

    const updateHackTab = (data) => {
        let hacks = data.hacks.hacks;



        // Deep copy hackstats to avoid mutating read-only Redux state
        let newState = JSON.parse(JSON.stringify(optimizerState.hackstats));
        for (let i = 0; i < newState.hacks.length; i++) {
            newState.hacks[i].level = hacks[i].level
        }
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
                // console.trace("Skipping null item in updateItem");
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

        let newState = JSON.parse(JSON.stringify(optimizerState.ngustats));

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

    const applyData = (data) => {

        let newItemData = {};
        Object.keys(optimizerState.itemdata).forEach(key => {
            const item = optimizerState.itemdata[key];
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
    }



    const handleFilePick = async (e) => {
        const files = Array.from(e.target.files);
        console.log("🔍 Files selected:", files.length);
        e.target.value = null;

        const results = await Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    console.log("📖 Reading file:", file.name);
                    const processed = handleFileRead(file, event.target.result);
                    console.log("✅ Processed result:", processed ? "Success" : "Failed");
                    resolve(processed);
                };
                reader.readAsText(file);
            });
        }));

        const validResults = results.filter(r => r !== null);
        console.log("✔️ Valid results:", validResults.length, "out of", results.length);
        if (validResults.length === 0) return;

        // Record only Rebirth saves in history
        validResults.forEach(res => {
            const { fullData, isRebirth, ...historyData } = res;
            if (isRebirth) {
                console.log("💾 Recording rebirth history entry:", historyData);
                dispatch(RecordHistory(historyData));
            }
        });

        // Apply only the one with the highest rebirth count (latest)
        const latest = validResults.sort((a, b) => {
            if (a.rebirths !== b.rebirths) return b.rebirths - a.rebirths;
            return b.timestamp - a.timestamp;
        })[0];

        if (latest) {
            console.log("🎯 Applying latest save with", latest.rebirths, "rebirths");
            applyData(latest.fullData);
        }
    }


    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <input ref={inputElem} style={{ display: "none" }} type='file' id='savefileloader'
                multiple onChange={e => handleFilePick(e)} />

            <Tooltip title={
                <React.Fragment>
                    Supported file types are<br />
                    (1) raw NGU save files, and<br />
                    (2) NGUSav.es JSON files.
                    <br /><br />
                    <i>Note: Only files with "Rebirth" in name are added to History.</i>
                </React.Fragment>
            } placement="bottom">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => inputElem.current.click()}
                    startIcon={<UploadFileIcon />}
                    sx={{
                        borderRadius: 3,
                        px: 3,
                        fontWeight: 600,
                        boxShadow: 2,
                        '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease'
                    }}
                >
                    Import Save
                </Button>
            </Tooltip>
            {!hideSwitch && (
                <FormControlLabel
                    control={
                        <Switch
                            checked={disableItems}
                            onChange={() => setDisableItems(!disableItems)}
                        />
                    }
                    label="Disable unowned"
                />
            )}
        </Box>

    )
}

ImportSaveForm.propTypes = {}
export default ImportSaveForm;
