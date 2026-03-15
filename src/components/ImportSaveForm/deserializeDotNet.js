import { Buffer } from 'buffer';
import { NRBFReader } from './jsBinaryFormatDataStructure/src/BinaryFormatterReader';

export class Deserializer {
    /**
     * @param {string} input
     */
    static fromFile(input) {
        try {
            const content = Buffer.from(input, 'base64')
            // nrbfreader
            const wrapper = NRBFReader.readBuffer(content);
            
            // NGU Idle saves are often a wrapper object with a base64 'playerData' string.
            // But Live Sync sends the PlayerData object directly serialized.
            const playerDataMember = wrapper[1]?.value?._members?.get?.("playerData");
            if (playerDataMember) {
                const wrappedData = Buffer.from(playerDataMember, 'base64');
                return NRBFReader.readBuffer(wrappedData);
            }

            // If no wrapper, assume it's the direct data (Live Sync format)
            return wrapper;
        } catch (error) {
            console.error('Could not parse file', error)
        }
    }

    static isMembersArray(obj) {
        return obj
            && obj.size === 3
            && obj.has("_items")
            && obj.has("_size")
            && obj.has("_version");
    }

    static membersArrayToArray(tag, obj) {
        const arr = obj.get("_items").map((x, i) => Deserializer.convertData(tag + i, x));
        return arr.filter((_, index) => index in arr)
    }

    static convertData(tag, entry) {
        if (typeof entry === "bigint") {
            return Number(entry);
        }
        if (!entry) {
            return entry;
        }
        if (entry.value) {
            return Deserializer.convertData(tag, entry.value);
        }
        if (!entry._members) {
            return entry;
        }
        // convert to array
        if (Deserializer.isMembersArray(entry._members)) {
            return Deserializer.membersArrayToArray(tag, entry._members);
        }
        // convert to dict
        const dict = {};
        entry._members.forEach((value, key) => {
            dict[key] = Deserializer.convertData(key, value);
        });
        return dict;
    }
}
