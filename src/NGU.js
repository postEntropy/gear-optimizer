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

        let ticks = mins * 60 * 50;
        const bbtill = cap * speed / factor / base;

        if (500 * bbtill > level) {
            // handle bar fills up to 0.1s
            for (let i = 1; i < 501; i++) {
                if (i * bbtill >= level + Math.floor(ticks / i)) {
                    return Math.min(1e9, level + Math.floor(ticks / i));
                } else if (Math.floor(i * bbtill) > level) {
                    ticks -= i * (Math.floor(i * bbtill) - level);
                    level = Math.floor(i * bbtill);
                }
            }
        }

        // Optimized handle slow bar fills
        const unitCostFactor = (base * factor) / (cap * speed);

        while (ticks > 0 && level < 1e9) {
            const cost = Math.ceil((level + 1) * unitCostFactor);

            // If cost is 1, we can skip many levels
            if (cost === 1) {
                // How many levels until cost becomes 2?
                // (level + k + 1) * unitCostFactor > 1.000001
                // level + k + 1 > 1 / unitCostFactor
                // k > 1 / unitCostFactor - level - 1
                const nextLevelAtCost2 = Math.ceil(1 / unitCostFactor);
                const levelsPossible = Math.min(ticks, nextLevelAtCost2 - level - 1);

                if (levelsPossible > 1) {
                    level += levelsPossible;
                    ticks -= levelsPossible;
                    continue;
                }
            }

            // If cost is large, or we are near the end, just do one by one
            if (ticks < cost) break;

            ticks -= cost;
            level++;

            // If we have a lot of ticks, try a larger jump based on average cost
            if (ticks > 1000 && level < 1e8) {
                const jump = Math.min(1000, Math.floor(ticks / (cost * 2)));
                if (jump > 10) {
                    const avgCost = Math.ceil((level + jump / 2) * unitCostFactor);
                    const totalJumpCost = avgCost * jump;
                    if (ticks >= totalJumpCost) {
                        ticks -= totalJumpCost;
                        level += jump;
                    }
                }
            }
        }

        return Math.min(1e9, level);
    }
}
