import { all, call, put, race, select, take, takeEvery } from 'redux-saga/effects'
import { eventChannel, END } from 'redux-saga'

import { AUGMENT, AUGMENT_ASYNC } from '../actions/Augment'
import { CLEANING_PROGRESS, CLEANING_REPORT, CLEANING_REPORT_ASYNC } from '../actions/Cleaning'
import { OPTIMIZE_GEAR, OPTIMIZE_GEAR_ASYNC } from '../actions/OptimizeGear'
import { OPTIMIZE_SAVES, OPTIMIZE_SAVES_ASYNC } from '../actions/OptimizeSaves'
import { OPTIMIZING_GEAR } from '../actions/OptimizingGear'
import { TERMINATE, TERMINATE_ASYNC } from '../actions/Terminate'

/* eslint-disable-next-line */
// import Worker from './optimize.worker'

// A single long-lived worker is shared by every optimization request. The worker
// loads the whole optimizer module graph once (items, scoring, reducer helpers),
// so reusing it keeps that cost off the click path instead of paying it again
// for every "Optimize Gear".
let worker = null;

export function getWorker() {
    if (worker === null) {
        // The `new Worker(new URL(...))` shape has to stay inline: bundlers only
        // recognize that exact pattern. Pulling the URL out into a variable makes
        // them treat the file as a plain asset and ship the raw module, which then
        // fails to resolve its imports in a production build.
        const created = new Worker(new URL('./optimize.worker.js', import.meta.url), { type: 'module' });
        created.addEventListener('error', (e) => {
            console.error('Optimizer worker failed:', e.message || e.filename || e);
            // Drop the broken worker so the next request builds a fresh one.
            if (worker === created) {
                worker = null;
            }
        });
        worker = created;
    }
    return worker;
}

export function disposeWorker() {
    if (worker !== null) {
        worker.terminate();
        worker = null;
    }
}

const doOptimize = (command, result, state) => new Promise(function (resolve, reject) {
    const active = getWorker();
    const settle = () => {
        active.onmessage = null;
        active.onerror = null;
    };
    active.onmessage = function (e) {
        settle();
        if (e.data && e.data.error) {
            reject(new Error(e.data.error));
            return;
        }
        resolve(e.data[result]);
    };
    active.onerror = function (e) {
        settle();
        reject(new Error(e.message || 'Optimizer worker error'));
    };
    active.postMessage({ command: command, state: state });
})

/**
 * Runs a command on the shared worker and resets the UI if the worker fails,
 * so a broken request can never leave the app stuck in a "running" state.
 */
function* runWorkerCommand(command, result, state) {
    try {
        return yield call(doOptimize, command, result, state);
    } catch (err) {
        console.error('Optimizer worker failed while running "' + command + '":', err);
        yield put({ type: TERMINATE });
        return undefined;
    }
}

export function* optimizeAsync(action) {
    const active = getWorker();
    yield put({
        type: OPTIMIZING_GEAR,
        payload: {
            worker: active
        }
    });
    const store = yield select();
    const state = store.optimizer;
    const equip = yield call(runWorkerCommand, 'optimize', 'equip', state);
    if (equip === undefined) return;
    yield put({
        type: OPTIMIZE_GEAR,
        payload: {
            equip: equip
        }
    });
}

export function* optimizeSavesAsync(action) {
    const active = getWorker();
    yield put({
        type: OPTIMIZING_GEAR,
        payload: {
            worker: active
        }
    });
    const store = yield select();
    const state = store.optimizer;
    const savedequip = yield call(runWorkerCommand, 'optimizeSaves', 'savedequip', state);
    if (savedequip === undefined) return;
    yield put({
        type: OPTIMIZE_SAVES,
        payload: {
            savedequip: savedequip,
            savedidx: state.savedidx
        }
    });
}

function cleaningChannel(active) {
    return eventChannel((emit) => {
        active.onmessage = (e) => {
            if (e.data && e.data.progress) {
                emit({ progress: e.data.progress });
            } else if (e.data && e.data.report) {
                emit({ report: e.data.report });
            }
        };
        return () => { active.onmessage = null; };
    });
}

function* consumeCleaningChannel(channel) {
    while (true) {
        const message = yield take(channel);
        if (message === END) return;
        if (message.progress) {
            yield put({
                type: CLEANING_PROGRESS,
                payload: {
                    progress: message.progress
                }
            });
        } else if (message.report) {
            yield put({
                type: CLEANING_REPORT,
                payload: {
                    report: message.report
                }
            });
            return;
        }
    }
}

export function* cleaningReportAsync(action) {
    const active = getWorker();
    yield put({
        type: OPTIMIZING_GEAR,
        payload: {
            worker: active
        }
    });
    const store = yield select();
    const state = store.optimizer;
    const channel = yield call(cleaningChannel, active);
    try {
        active.postMessage({ command: 'scanUseless', state: state });
        yield race({
            done: call(consumeCleaningChannel, channel),
            cancelled: take(TERMINATE)
        });
    } finally {
        channel.close();
    }
}

export function* augmentAsync(action) {
    const active = getWorker();
    yield put({
        type: OPTIMIZING_GEAR,
        payload: {
            worker: active
        }
    });
    const store = yield select();
    const state = store.optimizer;
    const vals = yield call(runWorkerCommand, 'augment', 'vals', state);
    if (vals === undefined) return;
    yield put({
        type: AUGMENT,
        payload: {
            vals: vals
        }
    });
}




export function* terminate() {
    disposeWorker();
    // Recreate right away so the next request starts from an already loaded
    // module graph instead of paying the worker startup cost again.
    getWorker();
    yield put({ type: TERMINATE });
}

export function* watchOptimizeAsync() {
    yield takeEvery(OPTIMIZE_GEAR_ASYNC, optimizeAsync)
}

export function* watchOptimizeSavesAsync() {
    yield takeEvery(OPTIMIZE_SAVES_ASYNC, optimizeSavesAsync)
}

export function* watchCleaningReportAsync() {
    yield takeEvery(CLEANING_REPORT_ASYNC, cleaningReportAsync)
}

export function* watchAugmentAsync() {
    yield takeEvery(AUGMENT_ASYNC, augmentAsync)
}

export function* watchTerminate() {
    yield takeEvery(TERMINATE_ASYNC, terminate);
}

export default function* rootSaga() {
    // Warm the shared worker as soon as the app boots so the module graph is
    // already loaded by the time the user clicks Optimize.
    yield call(getWorker);
    yield all([watchOptimizeAsync(), watchOptimizeSavesAsync(), watchCleaningReportAsync(), watchAugmentAsync(), watchTerminate()]);
}
