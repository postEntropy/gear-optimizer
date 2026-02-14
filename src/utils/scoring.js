
import { Slot } from '../assets/ItemAux';
import { cubeBaseItemData } from './items';

export function score_vals(vals, factors) {
    vals = vals.map((val, idx) => val / 100);
    if (factors.length > 2) {
        const exponents = factors[2];
        vals = vals.map((val, idx) => val ** exponents[idx]);
    }
    return vals.reduce((res, val) => res * val, 1);
}

export function get_raw_vals(data, equip, factors, offhand) {
    const stats = factors[1];
    const sorted = Object.getOwnPropertyNames(Slot).reduce((res, slot) => {
        if (equip[Slot[slot][0]] !== undefined) {
            return res.concat(equip[Slot[slot][0]]);
        }
        return res;
    }, []);
    let vals = [];
    for (let idx in stats) {
        const stat = stats[idx];
        if (stat === 'Respawn' || stat === 'Power' || stat === 'Toughness') {
            vals[idx] = 0;
        } else {
            vals[idx] = 100;
        }
        let mainhand = true;
        for (let jdx in sorted) {
            const name = sorted[jdx];
            if (data[name] === undefined) {
                // console.log(name, data[name])
                continue;
            }
            let val = data[name][stat];
            if (data[name].slot[0] === 'weapon') {
                if (mainhand) {
                    mainhand = false;
                } else {
                    val *= offhand / 100
                }
            }
            if (val === undefined || isNaN(val)) {
                continue;
            }
            vals[idx] += val;
        }
    }
    return vals;
}

export const hardcap = (vals, factors, capstats) => {
    //handle hardcap
    return vals.map((val, idx) => {
        const hardcap = capstats[factors[1][idx] + ' Cap'];
        if (hardcap === undefined) {
            return val;
        }
        const total = Math.max(1, capstats['Nude ' + factors[1][idx]]);
        // multiplier is at least 100%
        const maxVal = 100 * Math.max(1, hardcap / total);
        // multiplier is at most `val` and at most `maxVal`
        return Math.min(val, maxVal);
    });
}

export function get_vals(data, equip, factors, offhand, capstats) {
    return hardcap(get_raw_vals(data, equip, factors, offhand), factors, capstats);
}

export function score_raw_equip(data, equip, factors, offhand) {
    return score_vals(get_raw_vals(data, equip, factors, offhand), factors);
}

export function score_equip(data, equip, factors, offhand, capstats) {
    return score_vals(get_vals(data, equip, factors, offhand, capstats), factors);
}

export const speedmodifier = (stats, state, factors, effect, exponent = 1) => {
    if (!stats.modifiers) {
        return 1;
    }
    const currentLoadout = stats.currentLoadout < 0 ? 0 : stats.currentLoadout;
    const dedicatedLoadout = stats.dedicatedLoadout < 0 ? 0 : stats.dedicatedLoadout;
    let itemdata = cubeBaseItemData(state.itemdata, state.cubestats, state.basestats);
    let currentBonus = score_equip(itemdata, state.savedequip[currentLoadout], factors, state.offhand * 5, state.capstats);
    let dedicatedBonus = score_equip(itemdata, state.savedequip[dedicatedLoadout], factors, state.offhand * 5, state.capstats);
    let blueHeart = stats.blueHeart
        ? 1.1
        : 1;
    let speed = dedicatedBonus / currentBonus;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
            for (let k = 0; k < 2; k++) {
                const rawName = ['e', 'm', 'r'][i] + ['Beta', 'Delta'][j] + 'Pot';
                const name = ['e', 'm', 'r'][i] + ['', 'c'][k] + ['Beta', 'Delta'][j] + 'Pot';
                if (stats[name] === true && effect[rawName] !== undefined) {
                    speed *= (effect[rawName] * blueHeart) ** (exponent * [1, -1][k]);
                }
            }
        }
    }
    return speed;
}
