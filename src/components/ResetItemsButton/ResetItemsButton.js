import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import { MassUpdate } from '../../actions/MassUpdateItems';

const ResetItemsButton = () => {
    const dispatch = useDispatch();
    const itemdata = useSelector(state => state.optimizer.itemdata);
    const onClick = () => {
        let newItemData = { ...itemdata }
        for (let i of Object.keys(newItemData)) {
            newItemData[i].disable = false
            newItemData[i].level = 100
        }

        dispatch(MassUpdate(newItemData))
    }

    return (
        <Button variant="outlined" color="error" size="small" onClick={onClick}>
            Reset Item Data
        </Button>
    )
}

ResetItemsButton.propTypes = {}
export default ResetItemsButton;
