import { ItemNameContainer, Factors, Slot, EmptySlotId } from '../assets/ItemAux'
import { Optimizer } from '../Optimizer'
import { Augment } from '../Augment'
import { Wish } from '../Wish'
import { cleanState } from '../reducers/Items'
import { allowed_zone, get_limits } from '../util'

// eslint-disable-next-line
self.addEventListener("message", choose);

function choose(e) {
    if (e.data.command === 'optimize') {
        optimize.call(this, e);
    } else if (e.data.command === 'optimizeSaves') {
        optimizeSaves.call(this, e);
    } else if (e.data.command === 'augment') {
        augment.call(this, e);
    } else if (e.data.command === 'wishes') {
        augment.call(this, e);
    } else if (e.data.command === 'scanUseless') {
        scanUseless.call(this, e);
    } else {
        console.log('Error: invalid web worker command: ' + e.data.command + '.')
    }
}

function optimize(e) {
    let start_time = Date.now();
    let state = e.data.state;
    let optimizer = new Optimizer(state);
    // construct base layout from locks
    let base_layout = optimizer.construct_base(state.locked, state.equip);
    // optimize the priorities
    for (let idx = 0; idx < state.factors.length; idx++) {
        base_layout = optimizer.compute_optimal(base_layout, idx);
    }
    // select random remaining layout
    base_layout = base_layout[Math.floor(Math.random() * base_layout.length)];
    let equip = optimizer.sort_locks(state.locked, state.equip, base_layout);
    this.postMessage({ equip: equip });
    this.close();
}

function optimizeSaves(e) {
    let start_time = Date.now();
    const savedequip = e.data.state.savedequip.map(save => {
        if (save.factors === undefined || save.factors.length === 0) {
            return save;
        }
        let state = e.data.state;
        const hasNoFactors = save.factors === undefined && save.maxslots === undefined;
        let equip = ItemNameContainer(state.equip.accessory.length, state.offhand);
        let locked = {};
        if (save.locked === undefined) {
            save.locked = {};
        }
        Object.getOwnPropertyNames(save.locked).forEach(slot => {
            equip[slot] = save.locked[slot].concat(equip[slot].slice(save.locked[slot].length));
            locked[slot] = save.locked[slot].map((_, idx) => idx);
        });
        // overwrite state
        const tmp = {
            equip: equip,
            locked: locked,
            factors: hasNoFactors
                ? state.factors
                : save.factors,
            maxslots: hasNoFactors
                ? state.maxslots
                : save.maxslots
        };
        Object.getOwnPropertyNames(tmp).forEach(property => {
            state[property] = tmp[property];
        });
        state = cleanState(state, true);
        let optimizer = new Optimizer(state);
        // construct base layout from locks
        let base_layout = optimizer.construct_base(state.locked, state.equip);
        // optimize the priorities
        for (let idx = 0; idx < state.factors.length; idx++) {
            base_layout = optimizer.compute_optimal(base_layout, idx);
        }
        // select random remaining layout
        base_layout = base_layout[Math.floor(Math.random() * base_layout.length)];
        // merge and return base_layout with save
        Object.getOwnPropertyNames(base_layout).forEach(property => {
            save[property] = base_layout[property];
        });
        return save;
    });
    this.postMessage({ savedequip: savedequip });
    this.close();
}

function augment(e) {
    const start_time = Date.now();
    const state = e.data.state;
    const augment = new Augment(state.augment.lsc, state.augment.time);
    let vals = augment.optimize();
    this.postMessage({ vals: vals });
    console.log(Math.floor((Date.now() - start_time) / 10) / 100 + ' seconds');
    this.close();
}

function wish(e) {
    const base = [1]
    const start_time = Date.now();
    const state = e.data.state;
    const wish = new Wish(state);
    let vals = wish.optimize();
    this.postMessage({ vals: vals });
    console.log(Math.floor((Date.now() - start_time) / 10) / 100 + ' seconds');
    this.close();
}

function scanUseless(e) {
    const start_time = Date.now();
    const state = e.data.state;
    const optimizer = new Optimizer(state);
    const usefulIds = new Set();

    // 1. All currently equipped items
    Object.keys(state.equip).forEach(slotName => {
        state.equip[slotName].forEach(id => {
            if (id < 10000) usefulIds.add(id);
        });
    });

    // 2. All items in saved loadouts
    state.savedequip.forEach(save => {
        Object.keys(save).forEach(prop => {
            if (Array.isArray(save[prop])) {
                save[prop].forEach(id => {
                    if (typeof id === 'number' && id < 10000) {
                        usefulIds.add(id);
                    }
                });
            }
        });
    });

    // 3. Pareto frontier for EVERY possible priority
    const limits = get_limits(state);
    const accslots = state.equip.accessory.length;

    Object.keys(Factors).forEach(factorName => {
        if (factorName === 'NONE' || factorName === 'DELETE' || factorName === 'INSERT') return;

        const factors = Factors[factorName];
        if (!factors[1] || factors[1].length === 0) return;

        optimizer.factors = factors;

        Object.keys(Slot).forEach(slotKey => {
            const slot = Slot[slotKey];
            const slotName = slot[0];
            if (slotName === 'other') return;

            // Get all items for this slot
            const itemsInSlot = state.items.filter(id => {
                const item = state.itemdata[id];
                return item && !item.disable && item.slot[0] === slotName && allowed_zone(state.itemdata, limits, id);
            }).map(id => state.itemdata[id]);

            if (itemsInSlot.length === 0) return;

            // For accessories, we might want to keep the top N items
            // For others, usually just the top 1 is enough for a single priority, 
            // but multiple items might be on the Pareto frontier.
            const cutoff = slotName === 'accessory' ? accslots : 1;
            const paretoFrontier = optimizer.pareto(itemsInSlot, cutoff);

            paretoFrontier.forEach(item => {
                if (!item.empty && item.id < 10000) {
                    usefulIds.add(item.id);
                }
            });
        });
    });

    const result = Array.from(usefulIds);
    this.postMessage({ usefulIds: result });
    this.close();
}

