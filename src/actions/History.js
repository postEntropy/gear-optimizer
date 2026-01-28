export const RECORD_HISTORY = 'RECORD_HISTORY';
export const CLEAR_HISTORY = 'CLEAR_HISTORY';

export const RecordHistory = (data) => ({
    type: RECORD_HISTORY,
    payload: {
        data
    }
});

export const ClearHistory = () => ({
    type: CLEAR_HISTORY
});
