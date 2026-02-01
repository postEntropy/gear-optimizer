import './polyfill';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';

import AppReducer from './reducers';
import rootSaga from './sagas';

import './stylesheets/index.css';

import App from './containers/App';

import * as serviceWorker from './serviceWorker';

const sagaMiddleware = createSagaMiddleware();
const store = configureStore({
    reducer: AppReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
        }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

const container = document.getElementById('app');
const root = createRoot(container);

root.render(
    <Provider store={store}>
        <App />
    </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

