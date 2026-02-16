import { MASS_DISABLE } from '../reducers/optimizerSlice';

export const MassDisable = (ids) => ({
    type: MASS_DISABLE,
    payload: { ids }
});
