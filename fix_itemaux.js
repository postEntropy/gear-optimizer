
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'assets', 'ItemAux.js');
const rawContent = fs.readFileSync(filePath);

// We know the valid content ends with the closing of the NGUs object.
// The line before the garbage is "    magic: [" ... and ending with "    ]\n};"
// Let's find the last occurrence of "};" before the garbage.
// Since the file might be corrupted at the end, we can convert to string and search.

let contentStr = rawContent.toString('utf8');

// The file was originally valid up to line 1618 (approx).
// The last valid export is `export const NGUs`.
// We can find the end of that object. 
// However, because of the encoding mess, 'utf8' interpretation of the end might be weird.
// But the restart of the file is definitely good UTF8.

// Let's try to just truncate at the known line number if possible, 
// or search for the unique string just before the end.
// The last valid line is: "        ngu('Adventure β', 5.00E+17, 3.00E-04, 1.00E+03, 63.13, 4.00E-01, 1.01E+28, 1.50E-04, 1.00E+03, 177.83, 2.50E-01, 1.00E+38, 1.50E-04, 1.00E+03, 436.53, 1.20E-01)"
// followed by "    ]" and "};"

const lastValidNgu = "ngu('Adventure β', 5.00E+17, 3.00E-04, 1.00E+03, 63.13, 4.00E-01, 1.01E+28, 1.50E-04, 1.00E+03, 177.83, 2.50E-01, 1.00E+38, 1.50E-04, 1.00E+03, 436.53, 1.20E-01)";
const lastIndex = contentStr.lastIndexOf(lastValidNgu);

if (lastIndex === -1) {
    console.error("Could not find the last valid NGU line.");
    process.exit(1);
}

// Find the closure of the array and object after that line
const arrayClose = contentStr.indexOf(']', lastIndex);
const objClose = contentStr.indexOf('};', arrayClose);

if (objClose === -1) {
    console.error("Could not find object closure.");
    process.exit(1);
}

// Slice up to objClose + 2 ("};")
const validContent = contentStr.substring(0, objClose + 2);

const factorGroups = `

export const FactorGroups = [
    {
        label: 'General',
        keys: ['NONE', 'DELETE', 'INSERT']
    },
    {
        label: 'Base Stats',
        keys: ['POWER', 'TOUGHNESS', 'MOVE_COOLDOWN', 'RESPAWN', 'DAYCARE_SPEED']
    },
    {
        label: 'Drops',
        keys: ['GOLD_DROP', 'DROP_CHANCE', 'QUEST_DROP', 'SEED_DROP', 'YGGDRASIL_YIELD']
    },
    {
        label: 'NGU',
        keys: ['ENGU', 'MNGU', 'NGUS']
    },
    {
        label: 'Hacks',
        keys: ['HACK']
    },
    {
        label: 'Wishes',
        keys: ['WISHES']
    },
    {
        label: 'Hybrids',
        keys: ['NGUSHACK', 'NGUWISH', 'WISHHACK']
    },
    {
        label: 'Time Machine',
        keys: ['ETIMEMACHINE', 'MTIMEMACHINE', 'TIMEMACHINE']
    },
    {
        label: 'Blood Magic',
        keys: ['BLOOD']
    },
    {
        label: 'Wandoos',
        keys: ['EWANDOOS', 'MWANDOOS', 'WANDOOS']
    },
    {
        label: 'Augments',
        keys: ['AUGMENTATION']
    },
    {
        label: 'Advanced Training',
        keys: ['AT']
    },
    {
        label: 'Beards',
        keys: ['EBEARD', 'MBEARD', 'BEARD']
    },
    {
        label: 'Cap & Speed',
        keys: ['ECAPSPEED', 'MCAPSPEED', 'XCAPSPEED']
    },
    {
        label: 'Misc / Raw Stats',
        keys: [
            'ENERGY_BARS', 'ENERGY_CAP', 'ENERGY_POWER', 'ENERGY_SPEED',
            'MAGIC_BARS', 'MAGIC_CAP', 'MAGIC_POWER', 'MAGIC_SPEED',
            'RES3_BARS', 'RES3_CAP', 'RES3_POWER',
            'AT_SPEED', 'AUGMENT_SPEED', 'BEARD_SPEED', 'HACK_SPEED',
            'NGU_SPEED', 'WANDOOS_SPEED', 'WISH_SPEED',
            'AP', 'EXPERIENCE', 'COOKING', 'EMPC'
        ]
    }
];
`;

const finalContent = validContent + factorGroups;

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log("Successfully fixed ItemAux.js");
