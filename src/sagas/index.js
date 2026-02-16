import { all, put, select, takeEvery } from 'redux-saga/effects'

import { AUGMENT, AUGMENT_ASYNC } from '../actions/Augment'
import { OPTIMIZE_GEAR, OPTIMIZE_GEAR_ASYNC } from '../actions/OptimizeGear'
import { OPTIMIZE_SAVES, OPTIMIZE_SAVES_ASYNC } from '../actions/OptimizeSaves'
import { OPTIMIZING_GEAR } from '../actions/OptimizingGear'
import { TERMINATE, TERMINATE_ASYNC } from '../actions/Terminate'
import { SCAN_USELESS, SCAN_USELESS_ASYNC } from '../actions/ScanUseless'
/* eslint-disable-next-line */
// import Worker from './optimize.worker'

let worker;

const doOptimize = (command, result, state, worker) => new Promise(async function (resolve, reject) {
    let output = await new Promise(function (resolve, reject) {
        worker.onmessage = function (e) {
            resolve(e.data);
        };
        worker.postMessage({ command: command, state: state });
    });
    await resolve(output[result]);
})

export function* optimizeAsync(action) {
    worker = new Worker(new URL('./optimize.worker.js', import.meta.url), { type: 'module' });
    yield put({
        type: OPTIMIZING_GEAR,
        payload: {
            worker: worker
        }
    });
    const store = yield select();
    const state = store.optimizer;
    let equip = yield doOptimize('optimize', 'equip', state, worker);
    yield put({
        type: OPTIMIZE_GEAR,
        payload: {
            equip: equip
        }
    });
}

export function* optimizeSavesAsync(action) {
    worker = new Worker(new URL('./optimize.worker.js', import.meta.url), { type: 'module' });
    yield put({
        type: OPTIMIZING_GEAR,
        payload: {
            worker: worker
        }
    });
    const store = yield select();
    const state = store.optimizer;
    let savedequip = yield doOptimize('optimizeSaves', 'savedequip', state, worker);
    yield put({
        type: OPTIMIZE_SAVES,
        payload: {
            savedequip: savedequip,
            savedidx: state.savedidx
        }
    });
}

export function* augmentAsync(action) {
    worker = new Worker(new URL('./optimize.worker.js', import.meta.url), { type: 'module' });
    yield put({
        type: OPTIMIZING_GEAR,
        payload: {
            worker: worker
        }
    });
    const store = yield select();
    const state = store.optimizer;
    let vals = yield doOptimize('augment', 'vals', state, worker);
    yield put({
        type: AUGMENT,
        payload: {
            vals: vals
        }
    });
}

export function* scanUselessAsync(action) {
    worker = new Worker(new URL('./optimize.worker.js', import.meta.url), { type: 'module' });
    yield put({
        type: OPTIMIZING_GEAR,
        payload: {
            worker: worker
        }
    });
    const store = yield select();
    const state = store.optimizer;
    let usefulIds = yield doOptimize('scanUseless', 'usefulIds', state, worker);
    yield put({
        type: SCAN_USELESS,
        payload: {
            usefulIds: usefulIds
        }
    });
}


export function* terminate() {
    if (worker) {
        worker.terminate();
    }
    yield put({ type: TERMINATE });
}

export function* watchOptimizeAsync() {
    yield takeEvery(OPTIMIZE_GEAR_ASYNC, optimizeAsync)
}

export function* watchOptimizeSavesAsync() {
    yield takeEvery(OPTIMIZE_SAVES_ASYNC, optimizeSavesAsync)
}

export function* watchAugmentAsync() {
    yield takeEvery(AUGMENT_ASYNC, augmentAsync)
}

export function* watchTerminate() {
    yield takeEvery(TERMINATE_ASYNC, terminate);
}

export function* watchScanUselessAsync() {
    yield takeEvery(SCAN_USELESS_ASYNC, scanUselessAsync)
}


export default function* rootSaga() {
    yield all([watchOptimizeAsync(), watchOptimizeSavesAsync(), watchAugmentAsync(), watchTerminate(), watchScanUselessAsync()]);
}
