import { Factors, NGUs } from './assets/ItemAux';
import { speedmodifier } from './util';

export class NGU {
    constructor(state) {
        this.ngustats = state.ngustats;
        this.state = state;
    }

    speed(resource) {
        let speed = this.ngustats[resource].nguspeed;
        if (resource === 'energy') {
            speed *= speedmodifier(this.ngustats, this.state, Factors.ENGU, {
                eBetaPot: 2,
                eDeltaPot: 2
            });
        } else if (resource === 'magic') {
            speed *= speedmodifier(this.ngustats, this.state, Factors.MNGU, {
                mBetaPot: 2,
                mDeltaPot: 2
            });
        }
        return speed;
    }

    bonus(ngu, levels) {
        return this.nbonus(ngu, Number(levels.normal)) * this.ebonus(ngu, Number(levels.evil)) * this.sbonus(ngu, Number(levels.sadistic));
    }

    nbonus(ngu, level) {
        return this.vbonus('normal', ngu, level);
    }

    ebonus(ngu, level) {
        return this.vbonus('evil', ngu, level);
    }

    sbonus(ngu, level) {
        return this.vbonus('sadistic', ngu, level);
    }

    vbonus(version, ngu, level) {
        if (ngu.name === 'Respawn') {
            return this.respawnbonus(version, ngu, level);
        }
        if (level <= 0) {
            return 1;
        }
        if (level > 1e9) {
            return 1e9;
        }
        if (isNaN(level)) {
            return 1;
        }
        const data = ngu[version];
        if (level <= data.softcap) {
            return 1 + level * data.bonus;
        }
        return 1 + level ** data.scexponent * data.scbonus * data.bonus;
    }

    respawnbonus(version, ngu, level) {
        if (level <= 0) {
            return 1;
        }
        if (level > 1e9) {
            return 1e9;
        }
        if (isNaN(level)) {
            return 1;
        }
        const data = ngu[version];
        if (level <= data.softcap) {
            const result = 1 - level * data.bonus;
            const cap = {
                normal: 0.8,
                evil: 0.925,
                sadistic: 0.925
            }[version];
            return Math.max(result, cap);
        }
        const result = 1 - level / (level * data.scbonus + 200000) - data.scexponent;
        const cap = {
            normal: 0.6,
            evil: 0.9,
            sadistic: 0.9
        }[version];
        return Math.max(result, cap);
    }

    reachableBonus(levels, min, idx, isMagic, quirk) {
        const reachable = this.reachable(levels, min, idx, isMagic);
        const resource = isMagic
            ? 'magic'
            : 'energy';
        return {
            level: reachable,
            bonus: {
                normal: this.bonus(NGUs[resource][idx], {
                    ...levels,
                    normal: reachable.normal
                }),
                evil: this.bonus(NGUs[resource][idx], {
                    ...levels,
                    normal: quirk.e2n
                        ? Math.min(1e9, Number(levels.normal) + reachable.evil - Number(levels.evil))
                        : levels.normal,
                    evil: reachable.evil
                }),
                sadistic: this.bonus(NGUs[resource][idx], {
                    ...levels,
                    normal: quirk.s2e && quirk.e2n
                        ? Math.min(1e9, Number(levels.normal) + reachable.sadistic - Number(levels.sadistic))
                        : levels.normal,
                    evil: quirk.s2e
                        ? Math.min(1e9, Number(levels.evil) + reachable.sadistic - Number(levels.sadistic))
                        : levels.evil,
                    sadistic: reachable.sadistic
                })
            }
        };
    }

    reachable(levels, mins, idx, isMagic) {
        const resource = isMagic
            ? 'magic'
            : 'energy';
        return {
            normal: this.vreachable(Number(levels.normal), mins, 1, NGUs[resource][idx].normal.cost, resource),
            evil: this.vreachable(Number(levels.evil), mins, 1, NGUs[resource][idx].evil.cost, resource),
            sadistic: this.vreachable(Number(levels.sadistic), mins, 1e7, NGUs[resource][idx].sadistic.cost, resource)
        };
    }

    bbtill(base, level, factor, cap, speed) {
        return cap * speed / factor / base
    }

    vreachable(level, mins, factor, base, resource) {
        const cap = Number(this.ngustats[resource].cap);
        const speed = this.speed(resource);
        if (isNaN(cap) || cap <= 0 || isNaN(speed) || speed <= 0) return level;

        let ticks = Math.floor(mins * 60 * 50);
        if (ticks <= 0) return level;

        const unitCostFactor = factor / cap / speed * base;

        // Fast skip for levels with cost 1
        const maxLevelAtCost1 = Math.floor(1 / unitCostFactor);
        if (level < maxLevelAtCost1) {
            const canGain = Math.min(ticks, maxLevelAtCost1 - level);
            level += canGain;
            ticks -= canGain;
        }

        while (ticks > 0) {
            const cost = Math.ceil((level + 1) * unitCostFactor);
            if (ticks < cost) break;

            // Safe jump for higher costs when ticks is large
            if (ticks > 100 * cost && level < 1e9) {
                const jump = Math.min(1000, Math.floor(ticks / (cost * 1.5)));
                if (jump > 10) {
                    // Safe upper bound for jump cost: U * sum(L+1...L+jump) + jump
                    const jumpCost = Math.ceil(unitCostFactor * (jump * level + (jump * (jump + 1)) / 2) + jump);
                    if (ticks >= jumpCost) {
                        ticks -= jumpCost;
                        level += jump;
                        continue;
                    }
                }
            }

            ticks -= cost;
            level++;
            if (level >= 1e9) break;
        }
        return Math.min(1e9, level);
    }
}
