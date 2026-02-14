
import { Item, Slot, Stat, SetName, ItemNameContainer } from '../assets/ItemAux';
import { LOOTIES, PENDANTS } from '../assets/Items';

export function getSlot(name, data) {
    return data[name].slot;
}

export function getLock(slot, idx, locked) {
    if (!Object.getOwnPropertyNames(locked).includes(slot)) {
        return false;
    }
    return locked[slot].includes(idx);
}

export function old2newequip(accslots, offhand, base_layout) {
    let equip = ItemNameContainer(accslots, offhand);
    let counts = Object.getOwnPropertyNames(Slot).map((x) => (0));
    for (let idx = 0; idx < base_layout.items.length; idx++) {
        const item = base_layout.items[idx];
        equip[item.slot[0]][counts[item.slot[1]]] = item.id;
        counts[item.slot[1]]++;
    }
    return equip;
}

export function clone(obj) {
    // Basic structured clone wrapper
    // Can be enhanced if needed
    if (typeof structuredClone === 'function') {
        return structuredClone(obj);
    }
    return JSON.parse(JSON.stringify(obj));
}

export function get_limits(state) {
    return {
        zone: state.zone,
        titan: get_max_titan(state.zone),
        titanversion: state.titanversion,
        looty: state.looty,
        pendant: state.pendant
    }
}

export function allowed_zone(itemdata, limits, id) {
    const zone = limits.zone;
    const titan = limits.titan;
    const titanversion = limits.titanversion;
    const looty = limits.looty;
    const pendant = limits.pendant;
    const item = itemdata[id];
    if (item.empty) {
        return false;
    }
    if (item.zone[1] > zone) {
        // zone too high
        return false;
    }
    if (item.zone[1] === titan[1] && item.zone[2] > titanversion) {
        // titan version too high
        return false;
    }
    if (item.zone[0] === SetName.LOOTY[0] && LOOTIES.indexOf(item.name) > looty) {
        return false;
    }
    if (item.zone[0] === SetName.FOREST_PENDANT[0] && PENDANTS.indexOf(item.name) > pendant) {
        return false;
    }
    return true;
}

export function get_zone(zone) {
    return SetName[Object.getOwnPropertyNames(SetName).filter(x => {
        return zone === SetName[x][1];
    })[0]];
}

export function get_max_zone(zone) {
    let maxzone = 1;
    Object.getOwnPropertyNames(SetName).forEach(x => {
        maxzone = SetName[x][1] > maxzone
            ? SetName[x][1]
            : maxzone;
    });
    return maxzone;
}

export function get_max_titan(zone) {
    let maxtitan = SetName.GRB; // Default to first titan if none found, ensuring correct structure
    Object.getOwnPropertyNames(SetName).forEach(x => {
        // Only titans (length === 3) and zone <= current zone
        if (SetName[x].length === 3 && SetName[x][1] <= zone) {
            // Keep the highest titan found so far
            maxtitan = maxtitan[1] > SetName[x][1]
                ? maxtitan
                : SetName[x];
        }
    });
    return maxtitan;
}

export const cubeBaseItemData = (itemdata, cubestats, basestats) => {
    // make cube stats item
    let tier = Number(cubestats.tier);
    let cube = new Item(1000, 'Infinity Cube', Slot.OTHER, undefined, 0, [

        [
            Stat.POWER,
            Number(cubestats.power)
        ],
        [
            Stat.TOUGHNESS,
            Number(cubestats.toughness)
        ],
        [
            Stat.DROP_CHANCE, tier <= 0
                ? 0
                : tier === 1
                    ? 50
                    : 50 + (tier - 1) * 20
        ],
        [
            Stat.GOLD_DROP, tier <= 1
                ? 0
                : tier === 2
                    ? 50
                    : Math.pow(tier - 1, 1.3) * 50
        ],
        [
            Stat.HACK_SPEED, tier <= 7
                ? 0
                : tier < 10
                    ? (tier - 8) * 5 + 10
                    : 20
        ],
        [
            Stat.WISH_SPEED, tier <= 8
                ? 0
                : tier === 9
                    ? 10
                    : 20
        ]
    ]);
    // make base stats item
    let base = new Item(1001, 'Base Stats', Slot.OTHER, undefined, 0, [
        [
            Stat.POWER,
            Number(basestats.power)
        ],
        [
            Stat.TOUGHNESS,
            Number(basestats.toughness)
        ]
    ]);
    return {
        ...itemdata,
        [cube.id]: cube,
        [base.id]: base
    };
}
