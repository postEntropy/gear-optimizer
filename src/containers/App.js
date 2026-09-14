import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector, useStore, shallowEqual } from 'react-redux';
import { HashRouter } from 'react-router-dom';

import { default as AppLayout } from '../components/AppLayout/AppLayout';
import LiveSyncEngine from '../components/LiveSyncEngine/LiveSyncEngine';

import { AugmentAsync, AugmentSettings } from '../actions/Augment'
import { HackAsync } from '../actions/Hack'
import { WishAsync } from '../actions/Wish'
import { Go2Titan, Settings } from '../actions/Settings'
import { Crement } from '../actions/Crement'
import { DisableItem, DisableZone } from '../actions/DisableItem';
import { ToggleModal } from '../actions/ToggleModal';
import { EditItem } from '../actions/EditItem';
import { EditFactor } from '../actions/EditFactor';
import { EquipItem, EquipItems } from '../actions/EquipItem';
import { HideZone } from '../actions/HideZone'
import { LockItem } from '../actions/LockItem'
import { OptimizeGearAsync } from '../actions/OptimizeGear';
import { OptimizeSavesAsync } from '../actions/OptimizeSaves';
import { Terminate } from '../actions/Terminate'
import { Undo } from '../actions/Undo'
import { UnequipItem } from '../actions/UnequipItem';
import { DeleteSlot } from '../actions/DeleteSlot'
import { LoadFactors, LoadSlot } from '../actions/LoadSlot'
import { SaveName, SaveSlot } from '../actions/SaveSlot'
import { ToggleSaved, ToggleUnused } from '../actions/ToggleSaved'
import { LoadStateLocalStorage } from '../actions/LoadStateLocalStorage';
import { SaveStateLocalStorage } from '../actions/SaveStateLocalStorage';
import { DropEquipItem } from '../actions/DropEquipItem';
import { ClearHistory } from '../actions/History';

import { MassDisable } from '../actions/MassDisable';

import '../stylesheets/App.css';
import { LOCALSTORAGE_NAME } from '../constants';
import { safeStorage } from '../utils/safeStorage';

// Helper to debounce save operations
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Selects everything the page tree needs, except `running`. Optimize buttons
// subscribe to `running` on their own, so starting/stopping an optimization does
// not re-render the whole app shell.
const selectOptimizerProps = (state) => {
    const s = state.optimizer;
    return {
        itemdata: s.itemdata,
        items: s.items,
        offhand: s.offhand,
        equip: s.equip,
        liveEquip: s.liveEquip,
        locked: s.locked,
        lastequip: s.lastequip,
        savedequip: s.savedequip,
        savedidx: s.savedidx,
        maxsavedidx: s.maxsavedidx,
        showsaved: s.showsaved,
        showunused: s.showunused,
        editItem: s.editItem,
        ignoreDisabled: s.ignoreDisabled,
        factors: s.factors,
        maxslots: s.maxslots,
        zone: s.zone,
        titanversion: s.titanversion,
        looty: s.looty,
        pendant: s.pendant,
        hidden: s.hidden,
        hidenotmaxed: s.hidenotmaxed,
        hidedisabled: s.hidedisabled,
        compactbonus: s.compactbonus,
        compactitemlist: s.compactitemlist,
        augstats: s.augstats,
        basestats: s.basestats,
        capstats: s.capstats,
        cubestats: s.cubestats,
        ngustats: s.ngustats,
        hackstats: s.hackstats,
        wishstats: s.wishstats,
        history: s.history,
        highlightBest: s.highlightBest,
        showR3History: s.showR3History,
        historyChartMode: s.historyChartMode,
        version: s.version,
        loaded: s.loaded,
        optimizedEquip: s.optimizedEquip,
        playerName: s.playerName,
        randomLogoFilterOwned: s.randomLogoFilterOwned,
        highlightEquipped: s.highlightEquipped,
        showGraphs: s.showGraphs,
        liveSync: s.liveSync,
        wishesLegacyMode: s.wishesLegacyMode,
    };
};

const App = () => {
    const dispatch = useDispatch();
    const store = useStore();

    // Map state to props-like structure for backward compatibility with AppLayout
    const props = useSelector(selectOptimizerProps, shallowEqual);

    // Actions
    const handlers = useMemo(() => ({
        handleCrement: (...args) => dispatch(Crement(...args)),
        handleDisableItem: (...args) => dispatch(DisableItem(...args)),
        handleToggleModal: (...args) => dispatch(ToggleModal(...args)),
        handleEditItem: (...args) => dispatch(EditItem(...args)),
        handleLockItem: (...args) => dispatch(LockItem(...args)),
        handleEditFactor: (...args) => dispatch(EditFactor(...args)),
        handleEquipItem: (...args) => dispatch(EquipItem(...args)),
        handleEquipItems: (...args) => dispatch(EquipItems(...args)),
        handleDisableZone: (...args) => dispatch(DisableZone(...args)),
        handleHideZone: (...args) => dispatch(HideZone(...args)),
        handleOptimizeGear: (...args) => dispatch(OptimizeGearAsync(...args)),
        handleOptimizeSaves: (...args) => dispatch(OptimizeSavesAsync(...args)),
        handleTerminate: (...args) => dispatch(Terminate(...args)),
        handleUndo: (...args) => dispatch(Undo(...args)),
        handleUnequipItem: (...args) => dispatch(UnequipItem(...args)),
        handleDropEquipItem: (...args) => dispatch(DropEquipItem(...args)),
        handleDeleteSlot: (...args) => dispatch(DeleteSlot(...args)),
        handleLoadFactors: (...args) => dispatch(LoadFactors(...args)),
        handleLoadSlot: (...args) => dispatch(LoadSlot(...args)),
        handleSaveName: (...args) => dispatch(SaveName(...args)),
        handleSaveSlot: (...args) => dispatch(SaveSlot(...args)),
        handleToggleSaved: (...args) => dispatch(ToggleSaved(...args)),
        handleToggleUnused: (...args) => dispatch(ToggleUnused(...args)),
        handleAugmentSettings: (...args) => dispatch(AugmentSettings(...args)),
        handleAugmentAsync: (...args) => dispatch(AugmentAsync(...args)),
        handleHackAsync: (...args) => dispatch(HackAsync(...args)),
        handleWishAsync: (...args) => dispatch(WishAsync(...args)),
        handleSettings: (...args) => dispatch(Settings(...args)),
        handleGo2Titan: (...args) => dispatch(Go2Titan(...args)),
        handleSaveStateLocalStorage: (...args) => dispatch(SaveStateLocalStorage(...args)),
        handleLoadStateLocalStorage: (...args) => dispatch(LoadStateLocalStorage(...args)),
        handleClearHistory: (...args) => dispatch(ClearHistory(...args)),

        handleMassDisable: (...args) => dispatch(MassDisable(...args)),
    }), [dispatch]);

    // Initial load
    useEffect(() => {
        handlers.handleLoadStateLocalStorage();
    }, [handlers]);

    // Expose to window (legacy requirement)
    useEffect(() => {
        window.appHandlers = handlers;
    }, [handlers]);

    // Debounced save
    const debouncedSave = useMemo(
        () => debounce((currentState) => {
            safeStorage.setItem(LOCALSTORAGE_NAME, JSON.stringify({
                ...currentState,
                loaded: false
            }));
        }, 1000),
        []
    );

    useEffect(() => {
        const sync = () => {
            const state = store.getState().optimizer;
            window.appState = state;
            debouncedSave(state);
        };
        sync();
        return store.subscribe(sync);
    }, [store, debouncedSave]);


    return (
        <HashRouter>
            <LiveSyncEngine />
            <AppLayout {...props} {...handlers} />
        </HashRouter>
    );
}

export default App;
