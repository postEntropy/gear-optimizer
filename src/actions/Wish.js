export const WISH = 'Optimize wishes.';
export const WISH_ASYNC = 'Optimize wishes async.';
export const WISH_FAILED = 'Wish optimization failed.';

export const Wish = (vals) => ({
    type: WISH,
    payload: {
        vals: vals
    }
});

export const WishAsync = () => ({type: WISH_ASYNC, payload: {}});
export const WishFailed = (error) => ({ type: WISH_FAILED, payload: { error } });
