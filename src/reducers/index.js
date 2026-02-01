import { combineReducers } from 'redux';

import optimizerReducer from './optimizerSlice';

const AppReducer = combineReducers({ optimizer: optimizerReducer });

export default AppReducer;
