const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/ImportSaveForm/ImportSaveForm.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add import
content = content.replace(
    /import \{ ItemNameContainer \} from '\.\.\/\.\.\/assets\/ItemAux';/,
    "import { ItemNameContainer } from '../../assets/ItemAux';\nimport { applySaveData } from '../../utils/saveHandling';"
);

// 2. Remove Zone Arrays (sadisticZones, evilZones, normalZones)
content = content.replace(/\/\/ minimal boss for each zone, per difficulty[\s\S]*?const normalZones = \[[\s\S]*?\];/m, '');

// 3. Remove Helper Functions (from getZone up to applyData itself, inclusive) -> ends at `const updatePerkTab = ...;`
// Wait, applying via exact string match:
const helperStart = content.indexOf('const getZone = (B, eB, sB) => {');
const helperEnd = content.indexOf('// Initialize liveSyncEnabled');
if (helperStart !== -1 && helperEnd !== -1) {
    content = content.slice(0, helperStart) + content.slice(helperEnd);
}

// 4. Remove EventSource Logic
const sseStart = content.indexOf('// Live Sync Listener\n    React.useEffect(() => {');
const sseEnd = content.indexOf('const toggleLiveSync');
if (sseStart !== -1 && sseEnd !== -1) {
    let beforeSse = content.slice(0, sseStart);
    beforeSse += `
    // Add stateRef so applySaveData works
    const stateRef = React.useRef(optimizerState);
    React.useEffect(() => {
        stateRef.current = optimizerState;
    }, [optimizerState]);

    // Read live sync status from global redux for the UI
    React.useEffect(() => {
        if (optimizerState.liveSync?.status) {
            setSyncStatus(optimizerState.liveSync.status);
            if (onSyncStatusChange) onSyncStatusChange(optimizerState.liveSync.status);
            if (optimizerState.liveSync.updateCount > 0) setHasReceivedData(true);
        }
    }, [optimizerState.liveSync?.status, optimizerState.liveSync?.updateCount, onSyncStatusChange]);

    `;
    let afterSse = content.slice(sseEnd);
    content = beforeSse + afterSse;
}

// 5. Update handleFilePick apply call
content = content.replace(
    /applyData\((.*?)\);/g, 
    'applySaveData($1, stateRef.current, disableItems, dispatch);'
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Refactored ImportSaveForm.js successfully on master.");
