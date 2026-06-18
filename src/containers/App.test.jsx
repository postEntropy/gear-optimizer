import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, it } from 'vitest';
import App from './App';
import AppReducer from '../reducers';

vi.mock('react-ga');

it('renders without crashing', () => {
    const store = configureStore({
        reducer: AppReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                immutableCheck: false,
            }),
    });
    const div = document.createElement('div');
    const root = createRoot(div);
    root.render(
        <Provider store={store}>
            <App />
        </Provider>
    );
    root.unmount();
});
