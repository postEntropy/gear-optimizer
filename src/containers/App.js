import React, { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactGA from 'react-ga';
import { HashRouter } from 'react-router-dom';

import { default as AppLayout } from '../components/AppLayout/AppLayout';

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
import { ScanUselessAsync } from '../actions/ScanUseless';
import { MassDisable } from '../actions/MassDisable';

import '../stylesheets/App.css';
import { LOCALSTORAGE_NAME } from '../constants';

ReactGA.initialize('UA-141463995-1');

// Helper to debounce save operations
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

const App = () => {
    const dispatch = useDispatch();
    const state = useSelector(state => state.optimizer);

    // Map state to props-like structure for backward compatibility with AppLayout
    const props = useMemo(() => ({
        itemdata: state.itemdata,
        items: state.items,
        offhand: state.offhand,
        equip: state.equip,
        locked: state.locked,
        lastequip: state.lastequip,
        savedequip: state.savedequip,
        savedidx: state.savedidx,
        maxsavedidx: state.maxsavedidx,
        showsaved: state.showsaved,
        showunused: state.showunused,
        editItem: state.editItem,
        ignoreDisabled: state.ignoreDisabled,
        factors: state.factors,
        maxslots: state.maxslots,
        running: state.running,
        zone: state.zone,
        titanversion: state.titanversion,
        looty: state.looty,
        pendant: state.pendant,
        hidden: state.hidden,
        hidenotmaxed: state.hidenotmaxed,
        hidedisabled: state.hidedisabled,
        compactbonus: state.compactbonus,
        compactitemlist: state.compactitemlist,
        augstats: state.augstats,
        basestats: state.basestats,
        capstats: state.capstats,
        cubestats: state.cubestats,
        ngustats: state.ngustats,
        hackstats: state.hackstats,
        wishstats: state.wishstats,
        history: state.history,
        highlightBest: state.highlightBest,
        showR3History: state.showR3History,
        historyChartMode: state.historyChartMode,
        version: state.version,
        loaded: state.loaded,
        optimizedEquip: state.optimizedEquip,
        playerName: state.playerName,
        randomLogoFilterOwned: state.randomLogoFilterOwned,
        highlightEquipped: state.highlightEquipped,
        showGraphs: state.showGraphs,
        usefulItemIds: state.usefulItemIds,
    }), [state]);

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
        handleScanUseless: (...args) => dispatch(ScanUselessAsync(...args)),
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

    useEffect(() => {
        window.appState = state;
    }, [state]);

    // Debounced save
    const saveState = (currentState) => {
        if (currentState) {
            window.localStorage.setItem(LOCALSTORAGE_NAME, JSON.stringify({
                ...currentState,
                loaded: false
            }));
        }
    };

    const debouncedSave = useMemo(
        () => debounce((currentState) => saveState(currentState), 1000),
        []
    );

    useEffect(() => {
        debouncedSave(state);
    }, [state, debouncedSave]);


    return (
        <HashRouter>
            <AppLayout {...props} {...handlers} />
        </HashRouter>
    );
}

export default App;
