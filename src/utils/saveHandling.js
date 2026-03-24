import { Settings } from '../actions/Settings';
import { MassUpdate } from '../actions/MassUpdateItems';
import { ItemNameContainer, Hacks, NGUs, Wishes } from '../assets/ItemAux';

// minimal boss for each zone, per difficulty
const sadisticZones = [
    [248, 44], [240, 42], [232, 41], [224, 40], [216, 38], [208, 37], [175, 36], [150, 35], [125, 34],
];
const evilZones = [
    [200, 33], [190, 32], [182, 30], [174, 29], [166, 28], [158, 26], [125, 25], [100, 24], [58, 23],
];
const normalZones = [
    [138, 22], [132, 21], [124, 20], [116, 19], [108, 17], [100, 16], [90, 14], [82, 13], [74, 11], [66, 10], [58, 8], [48, 6], [37, 5], [17, 4], [7, 3],
];

const getZone = (B, eB, sB) => {
    let zones = [sadisticZones, evilZones, normalZones];
    let bosses = [sB, eB, B];
    for (let i = 0; i < 3; i++) {
        if (bosses[i] <= 1) continue;
        for (let j = 0; j < zones[i].length; j++) {
            if (bosses[i] >= zones[i][j][0]) {
                return zones[i][j][1];
            }
        }
    }
    return 2;
}

const updateAugmentTab = (data, optimizerState, dispatch) => {
    let energyCap = Math.max(data.capEnergy, data.curEnergy)
    let augdata = data.challenges
    let nac = augdata.noAugsChallenge.curCompletions
    let lsc = augdata.laserSwordChallenge.curCompletions
    dispatch(Settings("augstats", { ...optimizerState.augstats, lsc: lsc, nac: nac, ecap: energyCap }))
}

const updateHackTab = (data, optimizerState, dispatch) => {
    if (!data || !data.hacks || !data.hacks.hacks) return;
    const currentHackstats = optimizerState.hackstats;
    let newHacks = currentHackstats.hacks.map((h, i) => {
        const importedHacks = Array.isArray(data.hacks?.hacks) ? data.hacks.hacks : (data.hacks?.hacks ? Object.values(data.hacks.hacks) : []);
        const importedHack = importedHacks[i];
        return {
            ...h,
            level: importedHack !== undefined && importedHack !== null ? (typeof importedHack === 'object' ? (importedHack.level || 0) : importedHack) : h.level
        };
    });
    dispatch(Settings("hackstats", { ...currentHackstats, hacks: newHacks }));
}

const updateItemLevels = (data, newData, dispatch) => {
    let equipped = data.inventory
    equipped.accs = equipped.accs.filter(x => x && !isNaN(x.id));
    let foundIds = []
    const lootys = [67, 128, 169, 230, 296, 389, 431, 505]
    const pendants = [53, 76, 94, 142, 170, 229, 295, 388, 430, 504]
    let hL = 0, hP = 0;
    let found = {};

    const updateItem = (item, _) => {
        if (!item) return;
        let id = item.id;
        let level = item.level;
        if (id !== undefined && id in newData && level !== undefined) {
            if (found[id] !== undefined) {
                if (level < newData[id].level) return;
            }
            found[id] = true;
            newData[id].level = level;
            foundIds.push(id);
            if (lootys.includes(id) && id > hL) hL = id;
            if (pendants.includes(id) && id > hP) hP = id;
        }
    };
    for (let i of Object.keys(equipped)) updateItem(equipped[i], i);
    for (let i = 0; i < equipped.accs.length; i++) updateItem(equipped.accs[i], i);
    for (let i of Object.keys(equipped.inventory)) updateItem(equipped.inventory[i], i)

    let lIndex = lootys.indexOf(hL)
    let pIndex = pendants.indexOf(hP)
    dispatch(Settings("accslots", equipped.accs.length))
    dispatch(Settings("looty", lIndex))
    dispatch(Settings("pendant", pIndex))
    return foundIds
}

const updateNgus = (data, optimizerState, dispatch) => {
    if (!data?.NGU?.skills || !data?.NGU?.magicSkills) return;
    let ngus = data.NGU.skills.map(skill => ({
        normal: skill.level || 0,
        evil: skill.evilLevel || 0,
        sadistic: skill.sadisticLevel || 0
    }));
    let mngus = data.NGU.magicSkills.map(skill => ({
        normal: skill.level || 0,
        evil: skill.evilLevel || 0,
        sadistic: skill.sadisticLevel || 0
    }));
    let newState = JSON.parse(JSON.stringify(optimizerState.ngustats));
    if (data.beastQuest?.quirkLevel) {
        newState.quirk.e2n = (data.beastQuest.quirkLevel[14] || 0) > 0;
        newState.quirk.s2e = (data.beastQuest.quirkLevel[89] || 0) > 0;
    }
    newState.blueHeart = data.inventory?.itemList?.itemMaxxed?.[195] ?? newState.blueHeart;
    newState.eBetaPot = data.arbitrary?.energyPotion2InUse ?? newState.eBetaPot;
    newState.eDeltaPot = (data.arbitrary?.energyPotion1Time?.totalseconds || 0) > 0;
    newState.energy.cap = Math.max(data.capEnergy || 0, data.curEnergy || 0);
    newState.energy.ngus = ngus;
    newState.mBetaPot = data.arbitrary?.magicPotion2InUse ?? newState.mBetaPot;
    newState.mDeltaPot = (data.arbitrary?.magicPotion1Time?.totalseconds || 0) > 0;
    newState.magic.cap = Math.max(data.magic?.capMagic || 0, data.magic?.curMagic || 0);
    newState.magic.ngus = mngus;
    dispatch(Settings("ngustats", newState));
}

const updateEquipped = (data, optimizerState, dispatch) => {
    if (!optimizerState.syncEquip) return;
    const inv = data.inventory;
    const hasOffhand = inv.weapon2 && inv.weapon2.id > 0;
    // Preserve user's configured offhand %. Only override if offhand presence changed:
    // - no weapon2 → set to 0 (remove slot)
    // - has weapon2 → keep user's value (or default to 1=5% if was 0)
    const offhand = hasOffhand ? Math.max(1, optimizerState.offhand) : 0;
    const accSlots = inv.accs.length;
    let newEquip = ItemNameContainer(accSlots, offhand);
    const setItem = (slot, idx, item) => {
        if (item && item.id > 0) newEquip[slot][idx] = item.id;
    };
    setItem('head', 0, inv.head);
    setItem('armor', 0, inv.chest);
    setItem('pants', 0, inv.legs);
    setItem('boots', 0, inv.boots);
    setItem('weapon', 0, inv.weapon);
    if (offhand) setItem('weapon', 1, inv.weapon2);
    inv.accs.forEach((acc, i) => { if (i < accSlots) setItem('accessory', i, acc); });
    dispatch(Settings("offhand", offhand));
    dispatch(Settings("equip", newEquip));
}

const disableUnownedItems = (foundIds, newData) => {
    for (let i of Object.keys(newData)) {
        if (!foundIds.includes(newData[i].id)) newData[i].disable = true
    }
}

const resetItems = (newdata) => {
    for (let i of Object.keys(newdata)) {
        newdata[i].disable = false
        newdata[i].level = 100
    }
}

const updatePerkTab = (data, dispatch) => {
    if (data?.adventure?.itopod?.perkLevel) {
        dispatch(Settings("adventure", { itopod: { perkLevel: data.adventure.itopod.perkLevel } }));
    } else if (data?.itopod?.perkLevel) {
        dispatch(Settings("adventure", { itopod: { perkLevel: data.itopod.perkLevel } }));
    }
}

const updateWishTab = (data, optimizerState, dispatch) => {
    if (!data?.wishes?.wishes) return;
    const currentWishstats = optimizerState.wishstats;
    if (!currentWishstats?.wishes) return;
    let newWishes = currentWishstats.wishes.map((w, i) => {
        const importedWishes = Array.isArray(data.wishes.wishes) ? data.wishes.wishes : Object.values(data.wishes.wishes);
        const importedWish = importedWishes[i];
        return {
            ...w,
            level: importedWish !== undefined && importedWish !== null ? (typeof importedWish === 'object' ? (importedWish.level || 0) : importedWish) : w.level
        };
    });
    dispatch(Settings("wishstats", { ...currentWishstats, wishes: newWishes }));
}

export const extractSnapshot = (data) => {
    if (!data) return null;
    return {
        hacks: data.hacks?.hacks?.map(h => typeof h === 'object' ? (h?.level || 0) : (h || 0)) || [],
        eNgu: data.NGU?.skills?.map(s => s?.level || 0) || [],
        mNgu: data.NGU?.magicSkills?.map(s => s?.level || 0) || [],
        wishes: data.wishes?.wishes?.map(w => typeof w === 'object' ? (w?.level || 0) : (w || 0)) || [],
        tmSpeed: data.timeMachine?.speedLevel || 0,
        tmMulti: data.timeMachine?.multiLevel || 0,
        wandoos: data.wandoos?.wandoosLevel || 0,
        wandoosOS: data.wandoos?.osLevel || 0,
        at: data.advancedTraining?.skills?.map(s => s?.level || 0) || [],
        augments: data.augments?.augments?.map(a => a?.augLevel || 0) || [],
        upgrades: data.augments?.augments?.map(a => a?.upgradeLevel || 0) || [],
        rituals: data.bloodMagic?.rituals?.map(r => r?.level || 0) || [],
        macGuffins: data.macGuffin?.macGuffins?.map(m => m?.level || 0) || []
    };
};

export const calculateDiffs = (newData, oldSnapshot) => {
    let diffs = [];
    if (!oldSnapshot) return diffs; // Do not calculate diffs on the absolute first sync of the session

    const currentSnapshot = extractSnapshot(newData);

    // Hacks
    currentSnapshot.hacks.forEach((newLvl, i) => {
        const oldLvl = oldSnapshot.hacks[i] || 0;
        if (newLvl > oldLvl) {
            const name = Hacks[i]?.[0] || `Hack ${i+1}`;
            diffs.push(`Hack: ${name} +${newLvl - oldLvl}`);
        }
    });

    // NGU
    currentSnapshot.eNgu.forEach((newLvl, i) => {
        const oldLvl = oldSnapshot.eNgu[i] || 0;
        if (newLvl > oldLvl) {
            const name = NGUs.energy[i]?.name || `E-NGU ${i+1}`;
            diffs.push(`NGU: ${name} +${newLvl - oldLvl}`);
        }
    });
    currentSnapshot.mNgu.forEach((newLvl, i) => {
        const oldLvl = oldSnapshot.mNgu[i] || 0;
        if (newLvl > oldLvl) {
            const name = NGUs.magic[i]?.name || `M-NGU ${i+1}`;
            diffs.push(`NGU: ${name} +${newLvl - oldLvl}`);
        }
    });

    // Wishes
    currentSnapshot.wishes.forEach((newLvl, i) => {
        const oldLvl = oldSnapshot.wishes[i] || 0;
        if (newLvl > oldLvl) {
            const name = Wishes[i]?.[0] || `Wish ${i+1}`;
            diffs.push(`Wish: ${name} +${newLvl - oldLvl}`);
        }
    });

    // Time Machine
    if (currentSnapshot.tmSpeed > oldSnapshot.tmSpeed) diffs.push(`TM: Speed +${currentSnapshot.tmSpeed - oldSnapshot.tmSpeed}`);
    if (currentSnapshot.tmMulti > oldSnapshot.tmMulti) diffs.push(`TM: Multiplier +${currentSnapshot.tmMulti - oldSnapshot.tmMulti}`);

    // Wandoos
    if (currentSnapshot.wandoos > oldSnapshot.wandoos) diffs.push(`Wandoos: Level +${currentSnapshot.wandoos - oldSnapshot.wandoos}`);
    if (currentSnapshot.wandoosOS > oldSnapshot.wandoosOS) diffs.push(`Wandoos: OS Level +${currentSnapshot.wandoosOS - oldSnapshot.wandoosOS}`);

    // Advanced Training
    currentSnapshot.at.forEach((newLvl, i) => {
        const oldLvl = oldSnapshot.at[i] || 0;
        if (newLvl > oldLvl) {
            const names = ["Toughness", "Power", "Block", "Wandoos E", "Wandoos M", "Blood"];
            diffs.push(`AT: ${names[i] || ('Skill ' + (i+1))} +${newLvl - oldLvl}`);
        }
    });

    // Augments / Upgrades
    currentSnapshot.augments.forEach((newLvl, i) => {
        const oldLvl = oldSnapshot.augments[i] || 0;
        if (newLvl > oldLvl) {
            const names = ["Scissors", "Milk", "Cannon", "Laser Sword", "G.A.B.", "W.C."];
            diffs.push(`Augment: ${names[i] || ('Aug ' + (i+1))} +${newLvl - oldLvl}`);
        }
    });
    currentSnapshot.upgrades.forEach((newLvl, i) => {
        const oldLvl = oldSnapshot.upgrades[i] || 0;
        if (newLvl > oldLvl) {
            const names = ["Scissors Upg", "Milk Upg", "Cannon Upg", "Laser Sword Upg", "G.A.B. Upg", "W.C. Upg"];
            diffs.push(`Augment: ${names[i] || ('Upg ' + (i+1))} +${newLvl - oldLvl}`);
        }
    });

    // Blood Rituals
    currentSnapshot.rituals.forEach((newLvl, i) => {
        const oldLvl = oldSnapshot.rituals[i] || 0;
        if (newLvl > oldLvl) {
            diffs.push(`Blood: Ritual ${i+1} +${newLvl - oldLvl}`);
        }
    });

    // MacGuffins
    currentSnapshot.macGuffins.forEach((newLvl, i) => {
        const oldLvl = oldSnapshot.macGuffins[i] || 0;
        if (newLvl > oldLvl) {
            diffs.push(`MacGuffin: Slot ${i+1} +${newLvl - oldLvl}`);
        }
    });

    return diffs;
};


export const applySaveData = (data, optimizerState, disableItems, dispatch) => {
    let newItemData = {};
    Object.keys(optimizerState.itemdata).forEach(key => {
        const item = optimizerState.itemdata[key];
        newItemData[key] = Object.assign(Object.create(Object.getPrototypeOf(item)), item);
    });

    let zone = getZone(data.highestBoss, data.highestHardBoss, data.highestSadisticBoss);
    dispatch(Settings("zone", zone));
    resetItems(newItemData);
    let found = updateItemLevels(data, newItemData, dispatch);
    
    if (disableItems) disableUnownedItems(found, newItemData);
    
    dispatch(MassUpdate(newItemData));

    try { updateNgus(data, optimizerState, dispatch); } catch(e) {}
    try { updateAugmentTab(data, optimizerState, dispatch); } catch(e) {}
    try { updateHackTab(data, optimizerState, dispatch); } catch(e) {}
    try { updateWishTab(data, optimizerState, dispatch); } catch(e) {}
    try { updatePerkTab(data, dispatch); } catch(e) {}
    try { updateEquipped(data, optimizerState, dispatch); } catch(e) {}

    dispatch(Settings("resourceStats", {
        energyPower: data.energyPower || 0,
        energyCap:   data.capEnergy   || data.energyPurchasedCap || 0,
        energyBars:  data.energyBars  || 0,
        magicPower:  data.magic?.magicPower  || 0,
        magicCap:    data.magic?.capMagic    || data.magic?.purchasedMagicCap || 0,
        magicBars:   data.magic?.magicPerBar || 0,
        res3Power:   data.res3?.res3Power    || 0,
        res3Cap:     data.res3?.capRes3      || data.res3?.purchasedRes3Cap   || 0,
        res3Bars:    data.res3?.res3PerBar   || 0,
    }));
};
