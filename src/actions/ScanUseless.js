export const SCAN_USELESS = 'Scan useless items.';
export const SCAN_USELESS_ASYNC = 'Scan useless items async.';

export const ScanUseless = (usefulIds) => ({
    type: SCAN_USELESS,
    payload: { usefulIds }
});

export const ScanUselessAsync = () => ({
    type: SCAN_USELESS_ASYNC,
    payload: {}
});
