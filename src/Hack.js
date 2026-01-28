import { Factors, Hacks } from './assets/ItemAux';
import { speedmodifier } from './util';

export class Hack {
    constructor(state) {
        this.hackstats = state.hackstats;
        this.state = state;
    }

    speed() {
        let speed = this.hackstats.hackspeed;
        speed *= speedmodifier(this.hackstats, this.state, Factors.HACK, {
            rBetaPot: 2,
            rDeltaPot: 3
        });
        return speed;
    }

    bonus(level, idx) {
        const hack = Hacks[idx];
        return (level * hack[2] + 100) * hack[3] ** this.milestones(level, idx);
    }

    milestones(level, idx) {
        const hack = Hacks[idx];
        const step = Math.max(1, hack[4] - (this.hackstats.hacks[idx].reducer || 0));
        return Math.floor(level / step);
    }

    milestoneLevel(level, idx) {
        const hack = Hacks[idx];
        const step = Math.max(1, hack[4] - (this.hackstats.hacks[idx].reducer || 0));
        return Math.floor(level / step) * step;
    }

    reachable(level, mins, idx) {
        const cap = Number(this.hackstats.rcap);
        const pow = Number(this.hackstats.rpow);
        let speed = this.speed();
        if (isNaN(cap) || cap <= 0 || isNaN(pow) || pow <= 0 || isNaN(speed) || speed <= 0) return level;

        let ticks = Math.floor(mins * 60 * 50);
        if (ticks <= 0) return level;

        const base = Hacks[idx][1];
        const softcapFactor = 1.0078;

        while (ticks > 0) {
            let sf = (idx === 13) ? this.bonus(level, idx) / 100 : 1;
            const cost = Math.ceil((base * (level + 1) * (softcapFactor ** level)) / (cap * pow * speed * sf));

            if (ticks < cost) break;

            // Performance jump: if cost is small and we have many ticks
            if (ticks > 100 * cost && level < 100000) {
                const jump = Math.min(1000, Math.floor(ticks / (cost * 1.5)));
                if (jump > 10) {
                    // Conservative cost estimation for jump: cost(L) * jump * softcapFactor^jump
                    const jumpCost = Math.ceil(cost * jump * (softcapFactor ** jump));
                    if (ticks >= jumpCost) {
                        ticks -= jumpCost;
                        level += jump;
                        continue;
                    }
                }
            }

            ticks -= cost;
            level++;
            if (level > 1e9) break;
        }
        return level;
    }

    time(level, target, idx) {
        const cap = Number(this.hackstats.rcap);
        const pow = Number(this.hackstats.rpow);
        let speed = this.speed();
        if (isNaN(cap) || cap <= 0 || isNaN(pow) || pow <= 0 || isNaN(speed) || speed <= 0) return 0;

        let totalTicks = 0;
        const base = Hacks[idx][1];
        const softcapFactor = 1.0078;

        while (level < target) {
            let sf = (idx === 13) ? this.bonus(level, idx) / 100 : 1;
            const cost = Math.ceil((base * (level + 1) * (softcapFactor ** level)) / (cap * pow * speed * sf));
            totalTicks += cost;
            level++;

            if (totalTicks > 1e15) return totalTicks; // Safety
            if (level > 1e9) break;
        }
        return totalTicks;
    }
}
