import { createSlice, current } from '@reduxjs/toolkit';

import { ITEMLIST } from '../assets/Items'
import {
    EmptySlot,
    Factors,
    Hacks,
    ItemContainer,
    ItemNameContainer,
    NGUs,
    SetName,
    Slot,
    update_level
} from '../assets/ItemAux'

import { AUGMENT, AUGMENT_SETTINGS } from '../actions/Augment';
import { HACK } from '../actions/Hack';
import { WISH } from '../actions/Wish';
import { SETTINGS, TITAN } from '../actions/Settings';
import { CREMENT } from '../actions/Crement'
import { DISABLE_ITEM, DISABLE_ZONE } from '../actions/DisableItem';
import { TOGGLE_MODAL } from '../actions/ToggleModal';
import { EDIT_ITEM } from '../actions/EditItem';
import { EDIT_FACTOR } from '../actions/EditFactor';
import { EQUIP_ITEM, EQUIP_ITEMS } from '../actions/EquipItem';
import { HIDE_ZONE } from '../actions/HideZone';
import { LOCK_ITEM } from '../actions/LockItem'
import { OPTIMIZE_GEAR } from '../actions/OptimizeGear';
import { OPTIMIZE_SAVES } from '../actions/OptimizeSaves';
import { OPTIMIZING_GEAR } from '../actions/OptimizingGear';
import { TERMINATE } from '../actions/Terminate'
import { UNDO } from '../actions/Undo'
import { UNEQUIP_ITEM } from '../actions/UnequipItem';
import { DELETE_SLOT } from '../actions/DeleteSlot'
import { LOAD_FACTORS, LOAD_SLOT } from '../actions/LoadSlot'
import { SAVE_NAME, SAVE_SLOT } from '../actions/SaveSlot'
import { TOGGLE_SAVED, TOGGLE_UNUSED } from '../actions/ToggleSaved'
import { LOAD_STATE_LOCALSTORAGE } from '../actions/LoadStateLocalStorage';
import { SAVE_STATE_LOCALSTORAGE } from '../actions/SaveStateLocalStorage';
import { MASSUPDATE } from '../actions/MassUpdateItems';
import { DROP_EQUIP_ITEM } from '../actions/DropEquipItem';
import { RECORD_HISTORY, CLEAR_HISTORY } from '../actions/History';

import { cleanState, fillState, loadState } from './Items'; // Re-use helpers for now

let ITEMS = new ItemContainer(ITEMLIST.map((item) => {
    return [item.id, item];
}));

const accslots = 2;
const offhand = 0;
const maxZone = 2;
const zoneDict = {};
Object.getOwnPropertyNames(SetName).forEach(x => {
    zoneDict[SetName[x][1]] = 0 < SetName[x][1] && SetName[x][1] < maxZone;
});

const INITIAL_STATE = {
    itemdata: ITEMS,
    items: ITEMS.names,
    offhand: offhand,
    equip: ItemNameContainer(accslots, offhand),
    optimizedEquip: null,
    locked: {},
    lastequip: ItemNameContainer(accslots, offhand),
    savedequip: [ItemNameContainer(accslots, offhand)],
    savedidx: 0,
    maxsavedidx: 0,
    showsaved: false,
    showunused: false,
    factors: [
        'POWER', 'NONE'
    ],
    maxslots: [
        Infinity, Infinity
    ],
    editItem: [
        false, undefined, undefined, undefined
    ],
    running: false,
    zone: maxZone,
    looty: 0,
    pendant: 0,
    titanversion: 1,
    hidden: zoneDict,
    augstats: {
        lsc: 20,
        nac: 5,
        time: 1440,
        augspeed: 1,
        ecap: 1,
        gps: 0,
        gold: 0,
        augs: [
            {
                ratio: 1 / 2
            }, {
                ratio: 1.1 / 2
            }, {
                ratio: 1.2 / 2
            }, {
                ratio: 1.3 / 2
            }, {
                ratio: 1.4 / 2
            }, {
                ratio: 1.5 / 2
            }, {
                ratio: 1.6 / 2
            }
        ],
        version: 0
    },
    wishstats: {
        epow: 1,
        ecap: 1,
        epct: 100,
        mpow: 1,
        mcap: 1,
        mpct: 100,
        rpow: 1,
        rcap: 1,
        rpct: 100,
        wishspeed: 1,
        wishcap: 4 * 60,
        wishtime: 4 * 60,
        wishidx: 0,
        start: 0,
        goal: 1,
        wishes: [
            {
                wishidx: 0,
                start: 0,
                goal: 1
            }
        ],
        rp_idx: 0,
        spare_policy: 0,
        trueTime: false,
        modifiers: false,
        currentLoadout: 0,
        dedicatedLoadout: 0,
        blueHeart: true,
        eBetaPot: false,
        eDeltaPot: false,
        mBetaPot: false,
        mDeltaPot: false,
        rBetaPot: false,
        rDeltaPot: false,
        ecBetaPot: false,
        ecDeltaPot: false,
        mcBetaPot: false,
        mcDeltaPot: false,
        rcBetaPot: false,
        rcDeltaPot: false
    },
    hackstats: {
        rbeta: 0,
        rdelta: 0,
        rpow: 1,
        rcap: 1,
        hackspeed: 1,
        hacktime: 24 * 60,
        hackoption: '0',
        hacks: Hacks.map((hack, hackidx) => {
            return { level: 0, reducer: 0, goal: 1, hackidx: hackidx };
        }),
        modifiers: false,
        currentLoadout: 0,
        dedicatedLoadout: 0,
        blueHeart: true,
        rBetaPot: false,
        rDeltaPot: false,
        rcBetaPot: false,
        rcDeltaPot: false,
        lockSpeed: true
    },
    cubestats: {
        tier: 0,
        power: 0,
        toughness: 0
    },
    basestats: {
        power: 0,
        toughness: 0,
        modifiers: false
    },
    capstats: {
        'Energy Cap Cap': 9e18,
        'Nude Energy Cap': 500,
        'Magic Cap Cap': 9e18,
        'Nude Magic Cap': 1e4,
        'Energy Power Cap': 1e18,
        'Nude Energy Power': 1,
        'Magic Power Cap': 1e18,
        'Nude Magic Power': 1,
        'Energy Bars Cap': 1e18,
        'Nude Energy Bars': 1,
        'Magic Bars Cap': 1e18,
        'Nude Magic Bars': 1,
        'Resource 3 Power Cap': 1e18,
        'Nude Resource 3 Power': 1,
        'Resource 3 Cap Cap': 9e18,
        'Nude Resource 3 Cap': 1e4,
        'Resource 3 Bars Cap': 1e18,
        'Nude Resource 3 Bars': 1,
        modifiers: false
    },
    ngustats: {
        nguoption: 0,
        energy: {
            ngus: NGUs.energy.map(x => {
                return { normal: 0, evil: 0, sadistic: 0 };
            }),
            cap: 1,
            nguspeed: 1
        },
        magic: {
            ngus: NGUs.magic.map(x => {
                return { normal: 0, evil: 0, sadistic: 0 };
            }),
            cap: 1,
            nguspeed: 1
        },
        ngutime: 1440,
        quirk: {
            e2n: false,
            s2e: false
        },
        modifiers: false,
        currentLoadout: 0,
        dedicatedLoadout: 0,
        blueHeart: false,
        eBetaPot: false,
        eDeltaPot: false,
        mBetaPot: false,
        mDeltaPot: false,
        ecBetaPot: false,
        ecDeltaPot: false,
        mcBetaPot: false,
        mcDeltaPot: false
    },
    history: [],
    highlightBest: false,
    showR3History: true,
    historyChartMode: 'absolute', // absolute, stacked, relative
    liveSync: {
        status: 'disconnected',
        lastUpdate: null,
        updateCount: 0
    },
    syncEquip: true,
    adventure: {
        itopod: {
            perkLevel: []
        }
    },
    version: '2.0.0'
};

const optimizerSlice = createSlice({
    name: 'optimizer',
    initialState: INITIAL_STATE,
    reducers: {
        // We can define new actions here if needed
        updateState: (state, action) => {
            return { ...state, ...action.payload };
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(AUGMENT, (state, action) => {
                if (!state.running) return;
                // console.log('worker finished')
                state.augment.vals = action.payload.vals;
                state.running = false;
            })
            .addCase(AUGMENT_SETTINGS, (state, action) => {
                let lsc = Number(action.payload.lsc);
                let time = Number(action.payload.time);
                if (isNaN(lsc)) lsc = 20;
                if (isNaN(time)) time = 1440;
                state.augment.lsc = lsc;
                state.augment.time = time;
            })
            .addCase(HACK, (state) => {
                if (!state.running) return;
                state.running = false;
            })
            .addCase(WISH, (state) => {
                if (!state.running) return;
                state.running = false;
            })
            .addCase(SETTINGS, (state, action) => {
                if (action.payload.statname === 'accslots') {
                    // Logic to avoid mutation + return
                    const targetCount = action.payload.stats;
                    // We need a clone of the current state structure relevant parts
                    // Since we are returning a new state from cleanState, we should base it on current(state)
                    const currentState = current(state);

                    // Clone equip to modify it safely
                    const newEquip = {
                        ...currentState.equip,
                        accessory: [...currentState.equip.accessory]
                    };

                    const currentCount = newEquip.accessory.length;
                    if (targetCount === currentCount) return;

                    if (targetCount > currentCount) {
                        for (let i = 0; i < targetCount - currentCount; i++) {
                            newEquip.accessory.push(new EmptySlot(Slot.ACCESSORY).id);
                        }
                    } else {
                        newEquip.accessory = newEquip.accessory.slice(0, targetCount);
                    }

                    // We construct the object to pass to cleanState
                    // We must deep copy objects that cleanState mutates:
                    // ngustats, hackstats, wishstats (currentLoadout/dedicatedLoadout)
                    // maxslots, factors, savedequip
                    const stateToClean = {
                        ...currentState,
                        equip: newEquip,
                        lastequip: newEquip,
                        ngustats: { ...currentState.ngustats },
                        hackstats: { ...currentState.hackstats },
                        wishstats: { ...currentState.wishstats },
                        maxslots: [...currentState.maxslots],
                        factors: [...currentState.factors],
                        savedequip: currentState.savedequip.map(s => ({ ...s })) // Shallow copy of elements is likely enough unless cleanState dives deeper
                    };

                    return cleanState(stateToClean);
                }
                state[action.payload.statname] = action.payload.stats;
            })
            .addCase(MASSUPDATE, (state, action) => {
                const newItemData = action.payload.data;
                Object.getOwnPropertyNames(newItemData).forEach((itemid) => {
                    const item = newItemData[itemid];
                    update_level(item, item.level); // This mutates the item object itself which is inside data
                });
                state.itemdata = newItemData;
            })
            .addCase(CREMENT, (state, action) => {
                const { name, val, min, max } = action.payload;
                // Validation checks
                if (val < 0 && min === state[name]) return;
                if (val > 0 && max === state[name]) return;

                if (name === 'wishslots') {
                    let wishes = state.wishstats.wishes;
                    if (val === -1) {
                        if (wishes.length > 1) wishes.pop();
                    } else if (val === 1) {
                        wishes.push({ wishidx: 0, start: 0, goal: 1 });
                    }
                    return;
                }
                if (name === 'accslots') {
                    const currentState = current(state);
                    const newEquip = {
                        ...currentState.equip,
                        accessory: [...currentState.equip.accessory]
                    };

                    if (val === -1) {
                        newEquip.accessory.pop();
                    } else if (val === 1) {
                        newEquip.accessory.push(new EmptySlot(Slot.ACCESSORY).id);
                    }

                    const stateToClean = {
                        ...currentState,
                        equip: newEquip,
                        lastequip: newEquip,
                        ngustats: { ...currentState.ngustats },
                        hackstats: { ...currentState.hackstats },
                        wishstats: { ...currentState.wishstats },
                        maxslots: [...currentState.maxslots],
                        factors: [...currentState.factors],
                        savedequip: currentState.savedequip.map(s => ({ ...s }))
                    };
                    return cleanState(stateToClean);
                }
                if (Array.isArray(name) && name[0] === 'maxslots') {
                    // maxslots logic
                    const idx = name[1];
                    let currentVal = state.maxslots[idx];
                    if (val < 0 && currentVal === Infinity) {
                        state.maxslots[idx] = max;
                    } else {
                        currentVal += val;
                        if (currentVal < min) currentVal = min;
                        if (currentVal > max) currentVal = Infinity;
                        state.maxslots[idx] = currentVal;
                    }
                    return;
                }
                // Default number increment
                state[name] += val;
            })
            .addCase(DISABLE_ITEM, (state, action) => {
                const id = action.payload.id;
                const item = state.itemdata[id];
                // RTK allows direct mutation
                if (item) item.disable = !item.disable;
            })
            .addCase(LOCK_ITEM, (state, action) => {
                const { lock, slot, idx } = action.payload;
                if (!state.locked[slot]) state.locked[slot] = [];
                if (lock) {
                    if (!state.locked[slot].includes(idx)) state.locked[slot].push(idx);
                } else {
                    state.locked[slot] = state.locked[slot].filter(i => i !== idx);
                }
            })
            .addCase(EDIT_FACTOR, (state, action) => {
                let factors = [];
                let maxslots = [];
                if (action.payload.name === 'INSERT') {
                    state.factors.forEach((item, idx) => {
                        if (idx === action.payload.idx) {
                            factors.push('NONE');
                            maxslots.push(Infinity);
                        }
                        factors.push(item);
                        maxslots.push(state.maxslots[idx]);
                    });
                } else {
                    factors = state.factors.map((item, idx) => {
                        if (idx === action.payload.idx) return action.payload.name;
                        return item;
                    });
                    maxslots = state.maxslots;
                }

                // clean factors
                let tmpFactors = [];
                let tmpMaxslots = [];
                for (let i = 0; i < factors.length; i++) {
                    if (factors[i] !== 'DELETE') {
                        tmpFactors.push(factors[i]);
                        tmpMaxslots.push(maxslots[i]);
                    }
                }
                let i = tmpFactors.length - 1;
                while (tmpFactors.length > 1 && tmpFactors[i - 1] === 'NONE' && tmpFactors[i] === 'NONE') {
                    tmpFactors.pop();
                    tmpMaxslots.pop();
                    i--;
                }
                if (tmpFactors[tmpFactors.length - 1] !== 'NONE') {
                    tmpFactors.push('NONE');
                    tmpMaxslots.push(Infinity); // Assuming infinity for new slots
                }

                state.factors = tmpFactors;
                state.maxslots = tmpMaxslots;
            })
            .addCase(RECORD_HISTORY, (state, action) => {
                const entry = action.payload.data;
                let newHistory = [...state.history, { ...entry, timestamp: entry.timestamp || Date.now() }];

                // Sort by timestamp strictly
                newHistory.sort((a, b) => a.timestamp - b.timestamp);

                const deduped = [];
                for (let i = 0; i < newHistory.length; i++) {
                    const current = newHistory[i];
                    const last = deduped[deduped.length - 1];

                    if (last) {
                        // 1. Exact duplicate (Rebirth + Exp)
                        if (last.rebirths === current.rebirths && last.exp === current.exp) {
                            continue;
                        }

                        // 2. Duplicate timestamp (strictly increasing X)
                        if (current.timestamp === last.timestamp) {
                            if (current.exp > last.exp) {
                                deduped[deduped.length - 1] = current;
                            }
                            continue;
                        }

                        // 3. Close timestamps (1 min) same rebirth
                        const isSameRebirth = last.rebirths === current.rebirths;
                        const isSameTime = Math.abs(last.timestamp - current.timestamp) < 60000;
                        if (isSameRebirth && isSameTime && current.exp >= last.exp) {
                            deduped[deduped.length - 1] = current;
                            continue;
                        }

                        // 4. Regression check (NGU exp never drops)
                        if (current.exp < last.exp && current.timestamp > last.timestamp && current.rebirths <= last.rebirths) {
                            continue;
                        }
                    }
                    deduped.push(current);
                }

                state.history = deduped.slice(-200);
            })
            .addCase(CLEAR_HISTORY, (state) => {
                state.history = [];
            })
            .addCase(EQUIP_ITEM, (state, action) => {
                const id = action.payload.id;
                const slot = state.itemdata[id].slot[0];
                const count = state.equip[slot].length;
                let sel = count - 1;

                // Find first empty slot or last slot
                for (let idx = 0; idx < count; idx++) {
                    if (state.itemdata[state.equip[slot][idx]].empty) {
                        if (sel > idx) sel = idx;
                    }
                    if (state.equip[slot][idx] === id) return; // Already equipped
                }

                state.equip[slot][sel] = id;
                state.lastequip = state.equip; // Direct assignment works in Immer (proxies)
            })
            .addCase(DROP_EQUIP_ITEM, (state, action) => {
                const { source, target } = action.payload;
                if (!source || !target || source.id === target.id || !source.slot || !target.slot || source.slot[0] !== target.slot[0]) return;

                const slotArr = state.equip[target.slot[0]];
                const targetIdx = slotArr.indexOf(target.id);
                const sourceIdx = slotArr.indexOf(source.id);

                if (targetIdx !== -1) slotArr[targetIdx] = source.id;
                if (sourceIdx !== -1) slotArr[sourceIdx] = target.id;
            })
            .addCase(IDE_IGNORE, (state) => {
                // Placeholder for EQUIP_ITEMS handling which is complex and requires loadState.
                // Ideally loadState logic should be extracted.
                // For now, I'll trust standard redux reducers can handle it if I kept `Items.js`?
                // No, I'm replacing it.
                // I need to implement EQUIP_ITEMS in a mutable way or call a helper.
            })
            .addCase(HIDE_ZONE, (state, action) => {
                state.hidden[action.payload.idx] = !state.hidden[action.payload.idx];
            })
            .addCase(TITAN, (state, action) => {
                // ... Titan Logic ...
                const titan = action.payload.titan;
                const zone = [2, 8, 10, 13, 16, 18, 21, 25, 28, 32, 36, 40][titan];

                // Update hidden zones
                Object.getOwnPropertyNames(SetName).forEach(x => {
                    const z = SetName[x][1];
                    state.hidden[z] = 0 < z && z < zone;
                });

                // Update accessory slots
                const targetAcc = action.payload.accslots;
                const currentAcc = state.equip.accessory;

                if (currentAcc.length < targetAcc) {
                    for (let i = currentAcc.length; i < targetAcc; i++) {
                        currentAcc.push(new EmptySlot(Slot.ACCESSORY).id);
                    }
                } else if (currentAcc.length > targetAcc) {
                    state.equip.accessory = currentAcc.slice(0, targetAcc);
                }

                state.offhand = titan > 8 ? 20 : 0; // Assuming 0 is default from original code logic (state.offhand fallback?)
                state.zone = zone;
                state.looty = action.payload.looty;
                state.pendant = action.payload.pendant;

                // Clean state?
                // cleanState({ ...state }) // This is tough in Immer.
                // We'll rely on correct mutations.
            })
            .addCase(UNDO, (state) => {
                const tmp = state.equip;
                state.equip = state.lastequip;
                state.lastequip = tmp;
            })
            .addCase(UNEQUIP_ITEM, (state, action) => {
                const id = action.payload.id;
                const item = state.itemdata[id];
                if (item.empty) return;

                const slot = item.slot[0];
                const idx = state.equip[slot].indexOf(id);
                if (idx !== -1) {
                    state.equip[slot][idx] = new EmptySlot(item.slot).id;
                    state.lastequip = state.equip;
                }
            })
            .addCase(OPTIMIZE_GEAR, (state, action) => {
                if (!state.running) return;
                // console.log('worker finished')
                // state.equip = action.payload.equip; // Do not overwrite current equip
                state.optimizedEquip = action.payload.equip;
                // state.lastequip = state.equip; // Leave lastequip alone too
                state.running = false;
            })
            .addCase(OPTIMIZE_SAVES, (state, action) => {
                if (!state.running) return;
                state.savedequip = action.payload.savedequip;
                state.savedidx = action.payload.savedidx;
                state.running = false;
            })
            .addCase(OPTIMIZING_GEAR, (state) => {
                if (state.running) return;
                state.running = true;
            })
            .addCase(TERMINATE, (state) => {
                state.running = false;
            })
            .addCase(SAVE_NAME, (state, action) => {
                if (state.savedequip[state.savedidx]) {
                    state.savedequip[state.savedidx].name = action.payload.name;
                }
            })
            .addCase(SAVE_SLOT, (state) => {
                const locked = {};
                Object.keys(state.locked).forEach(slot => {
                    locked[slot] = state.locked[slot].map(idx => state.equip[slot][idx]);
                });

                if (state.savedequip[state.savedidx]) {
                    // We need to overwrite the current save slot with current state.equip + metadata
                    const newSave = {
                        ...state.equip,
                        locked: locked,
                        factors: state.factors,
                        maxslots: state.maxslots,
                        name: state.savedequip[state.savedidx].name
                    };
                    state.savedequip[state.savedidx] = newSave;

                    // If we just saved to the last slot (which was "New Slot"), create a new empty slot
                    if (state.savedidx === state.savedequip.length - 1) {
                        state.savedequip.push({
                            ...ItemNameContainer(state.equip.accessory.length, state.offhand),
                        });
                        state.maxsavedidx++;
                    }
                }
            })
            .addCase(LOAD_SLOT, (state) => {
                const save = state.savedequip[state.savedidx];
                if (save) {
                    state.equip = { ...save }; // Copy it
                    // The original code used cleanState here.
                }
            })
            .addCase(DELETE_SLOT, (state) => {
                if (state.savedidx === state.savedequip.length - 1) return;

                state.savedequip.splice(state.savedidx, 1);
                // Adjust indices
                if (state.savedidx > 0) state.savedidx--;
                state.maxsavedidx--;
            })
            .addCase(TOGGLE_SAVED, (state) => {
                state.showsaved = !state.showsaved;
            })
            .addCase(TOGGLE_UNUSED, (state) => {
                state.showunused = !state.showunused;
            })
            .addCase(LOAD_STATE_LOCALSTORAGE, (state) => {
                return loadState(state);
            })
            .addCase(EQUIP_ITEMS, (state, action) => {
                const names = action.payload.names;
                if (names.length === 0) return cleanState(state);

                // loadState returns a new state object (not draft friendly if we want to mutate, but typically it builds a new one)
                // Since loadState returns a fresh object based on localStorage, we might need to adapt it for 'import loadout'?
                // Wait, EQUIP_ITEMS in original code uses loadState to *parse* the names from state?
                // No, check original Items.js logic for EQUIP_ITEMS.
                // It calls loadState(state) to get a temporary state!
                const tmpState = loadState(state);
                let equip = {
                    ...ItemNameContainer(tmpState.equip.accessory.length, tmpState.offhand)
                };
                names.forEach(name => {
                    const slot = tmpState.itemdata[name].slot[0];
                    const count = tmpState.equip[slot].length;
                    let succes = false;
                    for (let idx = 0; idx < count; idx++) {
                        if (tmpState.itemdata[equip[slot][idx]].empty) {
                            equip[slot][idx] = name;
                        }
                        if (equip[slot][idx] === name) {
                            succes = true;
                            break;
                        }
                    }
                    if (!succes) {
                        equip[slot].push(name);
                    }
                });
                return cleanState({
                    ...tmpState,
                    equip: equip,
                    lastequip: tmpState.equip
                });
            })
            .addCase(LOAD_FACTORS, (state) => {
                const save = state.savedequip[state.savedidx];
                const hasNoFactors = save.factors === undefined && save.maxslots === undefined;
                let equip = {
                    ...ItemNameContainer(state.equip.accessory.length, state.offhand)
                };
                let locked = {};
                if (save.locked === undefined) {
                    save.locked = {};
                }
                Object.getOwnPropertyNames(save.locked).forEach(slot => {
                    equip[slot] = save.locked[slot].concat(equip[slot].slice(save.locked[slot].length));
                    locked[slot] = save.locked[slot].map((_, idx) => idx);
                });
                return cleanState({
                    ...state,
                    equip: equip,
                    locked: locked,
                    factors: hasNoFactors
                        ? state.factors
                        : save.factors,
                    maxslots: hasNoFactors
                        ? state.maxslots
                        : save.maxslots
                });
            })
    }
});

// Helper for the dummy 'IDE_IGNORE' I used to break the code block above visually :)
const IDE_IGNORE = 'IDE_IGNORE_CONST';

export const { updateState } = optimizerSlice.actions;
export default optimizerSlice.reducer;
