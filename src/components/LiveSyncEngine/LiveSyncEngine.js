import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Settings } from '../../actions/Settings';
import { Deserializer } from '../ImportSaveForm/deserializeDotNet';
import { applySaveData, calculateDiffs, extractSnapshot } from '../../utils/saveHandling';

const LiveSyncEngine = () => {
    const dispatch = useDispatch();
    const optimizerState = useSelector(state => state.optimizer);
    
    const liveSyncEnabled = optimizerState.liveSyncEnabled !== false;
    const RECONNECT_DELAY_MS = 10000;

    const stateRef = useRef(optimizerState);
    useEffect(() => {
        stateRef.current = optimizerState;
    }, [optimizerState]);

    const liveSyncEnabledRef = useRef(liveSyncEnabled);
    const retryTimerRef = useRef(null);
    const eventSourceRef = useRef(null);

    liveSyncEnabledRef.current = liveSyncEnabled;

    const handleFileRead = (file, content) => {
        let data;
        try {
            data = JSON.parse(content);
        } catch (e) {
            try {
                const rawResult = Deserializer.fromFile(content);
                if (!rawResult || !rawResult[1]) {
                    throw new Error("Deserializer returned invalid data structure");
                }
                data = Deserializer.convertData(undefined, rawResult[1]);
            } catch (e2) {
                return null;
            }
        }
        if (!data) return null;
        return { fullData: data };
    }

    useEffect(() => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }

        if (!liveSyncEnabled) {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            dispatch(Settings("liveSync", {
                ...(stateRef.current.liveSync || {}),
                status: 'disconnected'
            }));
            return;
        }

        const connect = () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            dispatch(Settings("liveSync", {
                ...(stateRef.current.liveSync || {}),
                status: 'connecting'
            }));

            const es = new EventSource('http://localhost:3005/events');
            eventSourceRef.current = es;

            es.onopen = () => {
                dispatch(Settings("liveSync", {
                    ...(stateRef.current.liveSync || {}),
                    status: 'connected'
                }));
            };

            es.onmessage = (event) => {
                try {
                    let data;
                    if (event.data.trim().startsWith('{')) {
                        data = JSON.parse(event.data);
                    } else {
                        const extracted = handleFileRead({ name: "LiveSync.txt" }, event.data);
                        if (extracted?.fullData) {
                            data = extracted.fullData;
                        }
                    }

                    if (data) {
                        const newCount = (stateRef.current.liveSync?.updateCount || 0) + 1;
                        const prevLogs = stateRef.current.liveSync?.logs || [];
                        
                        const diffs = calculateDiffs(data, stateRef.current.liveSync?.lastSnapshot);
                        const newSnapshot = extractSnapshot(data);

                        const newLog = {
                            ts: Date.now(),
                            ok: true,
                            label: `Sync #${newCount}`,
                            detail: diffs.length > 0 ? `${diffs.length} progresso(s) detectado(s)` : `Nenhuma alteração de nível`,
                            diffs: diffs
                        };

                        dispatch(Settings("liveSync", {
                            status: 'connected',
                            lastUpdate: Date.now(),
                            updateCount: newCount,
                            logs: [...prevLogs, newLog].slice(-50),
                            lastSnapshot: newSnapshot
                        }));

                        applySaveData(data, stateRef.current, false, dispatch);
                    } else {
                        const prevLogs = stateRef.current.liveSync?.logs || [];
                        const errLog = {
                            ts: Date.now(),
                            ok: false,
                            label: 'Parse Error',
                            detail: 'Received data could not be deserialized'
                        };
                        dispatch(Settings("liveSync", {
                            ...(stateRef.current.liveSync || {}),
                            logs: [...prevLogs, errLog].slice(-50)
                        }));
                    }
                } catch (err) {
                    console.error("LiveSyncEngine Error:", err);
                }
            };

            es.onerror = () => {
                dispatch(Settings("liveSync", {
                    ...(stateRef.current.liveSync || {}),
                    status: 'error'
                }));
                es.close();
                eventSourceRef.current = null;

                if (liveSyncEnabledRef.current) {
                    dispatch(Settings("liveSync", {
                        ...(stateRef.current.liveSync || {}),
                        status: 'reconnecting'
                    }));
                    retryTimerRef.current = setTimeout(() => {
                        retryTimerRef.current = null;
                        if (liveSyncEnabledRef.current) connect();
                    }, RECONNECT_DELAY_MS);
                }
            };
        };

        connect();

        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [liveSyncEnabled, dispatch]);

    return null;
};

export default LiveSyncEngine;
