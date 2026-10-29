import { buffers, eventChannel } from 'redux-saga'
import { actionChannel, all, call, put, race, select, take, takeEvery } from 'redux-saga/effects'

import { AUGMENT, AUGMENT_ASYNC } from '../actions/Augment'
import { CLEANING_PROGRESS, CLEANING_REPORT, CLEANING_REPORT_ASYNC } from '../actions/Cleaning'
import { OPTIMIZE_GEAR, OPTIMIZE_GEAR_ASYNC } from '../actions/OptimizeGear'
import { OPTIMIZE_SAVES, OPTIMIZE_SAVES_ASYNC } from '../actions/OptimizeSaves'
import { WISH, WISH_ASYNC, WishFailed } from '../actions/Wish'
import { OPTIMIZING_GEAR } from '../actions/OptimizingGear'
import { TERMINATE, TERMINATE_ASYNC } from '../actions/Terminate'

/* eslint-disable-next-line */
// import Worker from './optimize.worker'

// A single long-lived worker is shared by every optimization request. The worker
// loads the whole optimizer module graph once (items, scoring, reducer helpers),
// so reusing it keeps that cost off the click path instead of paying it again
// for every "Optimize Gear".
let worker = null;
let nextRequestId = 0;
const pendingRequests = new Map();

function rejectPendingRequests(error) {
    pendingRequests.forEach(({ reject }) => reject(error));
    pendingRequests.clear();
}

export function getWorker() {
    if (worker === null) {
        // The `new Worker(new URL(...))` shape has to stay inline: bundlers only
        // recognize that exact pattern. Pulling the URL out into a variable makes
        // them treat the file as a plain asset and ship the raw module, which then
        // fails to resolve its imports in a production build.
        const created = new Worker(new URL('./optimize.worker.js', import.meta.url), { type: 'module' });
        created.addEventListener('message', (event) => {
            const request = pendingRequests.get(event.data?.requestId);
            if (!request) return;

            if (event.data.progress) {
                request.onProgress?.(event.data.progress);
                return;
            }

            pendingRequests.delete(event.data.requestId);
            if (event.data.error) request.reject(new Error(event.data.error));
            else request.resolve(event.data);
        });
        created.addEventListener('error', (e) => {
            console.error('Optimizer worker failed:', e.message || e.filename || e);
            rejectPendingRequests(new Error(e.message || 'Optimizer worker error'));
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
        rejectPendingRequests(new Error('Optimizer worker terminated'));
        worker.terminate();
        worker = null;
    }
}

const requestWorker = (command, state, onProgress) => new Promise(function (resolve, reject) {
    const active = getWorker();
    const requestId = ++nextRequestId;
    pendingRequests.set(requestId, { resolve, reject, onProgress });
    try {
        active.postMessage({ command, state, requestId });
    } catch (error) {
        pendingRequests.delete(requestId);
        reject(error);
    }
})

/**
 * Runs a command on the shared worker and resets the UI if the worker fails,
 * so a broken request can never leave the app stuck in a "running" state.
 */
function* runWorkerCommand(command, result, state, onProgress) {
    try {
        const response = yield call(requestWorker, command, state, onProgress);
        return response[result];
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

function cleaningChannel(state) {
    return eventChannel((emit) => {
        requestWorker('scanUseless', state, (progress) => emit({ progress }))
            .then((response) => emit({ report: response.report }))
            .catch((error) => emit({ error: error.message }));
        return () => {};
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
        } else if (message.error) {
            yield put({ type: TERMINATE });
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
    const channel = yield call(cleaningChannel, state);
    try {
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

export function* wishAsync(action) {
    const active = getWorker();
    yield put({ type: OPTIMIZING_GEAR, payload: { worker: active } });
    const store = yield select();
    try {
        const response = yield call(requestWorker, 'wishes', store.optimizer);
        yield put(WISH(response.vals));
    } catch (error) {
        yield put(WishFailed(error.message || 'Could not calculate wishes'));
        yield put({ type: TERMINATE });
    }
}




export function* terminate() {
    disposeWorker();
    // Recreate right away so the next request starts from an already loaded
    // module graph instead of paying the worker startup cost again.
    getWorker();
    yield put({ type: TERMINATE });
}

export function* watchWorkerCommands() {
    const commands = yield actionChannel([
        OPTIMIZE_GEAR_ASYNC,
        OPTIMIZE_SAVES_ASYNC,
        CLEANING_REPORT_ASYNC,
        AUGMENT_ASYNC,
        WISH_ASYNC
    ], buffers.expanding());
    while (true) {
        const action = yield take(commands);
        switch (action.type) {
            case OPTIMIZE_GEAR_ASYNC: yield call(optimizeAsync, action); break;
            case OPTIMIZE_SAVES_ASYNC: yield call(optimizeSavesAsync, action); break;
            case CLEANING_REPORT_ASYNC: yield call(cleaningReportAsync, action); break;
            case AUGMENT_ASYNC: yield call(augmentAsync, action); break;
            case WISH_ASYNC: yield call(wishAsync, action); break;
            default: break;
        }
    }
}

export function* watchTerminate() {
    yield takeEvery(TERMINATE_ASYNC, terminate);
}

export default function* rootSaga() {
    // Warm the shared worker as soon as the app boots so the module graph is
    // already loaded by the time the user clicks Optimize.
    yield call(getWorker);
    yield all([watchWorkerCommands(), watchTerminate()]);
}
