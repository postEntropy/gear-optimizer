import React from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

const SaveForm = (props) => {
    const { saveIdx, savedequip, loc, handleSettings } = props;

    // Use derived state from props effectively. 
    // In MUI TextField select, we pass value prop.
    const handleChange = (event) => {
        let val = Number(event.target.value);
        let stats;
        if (loc.length === 1) {
            stats = val;
        } else if (loc.length === 2) {
            stats = {
                ...props[loc[0]],
                [loc[1]]: val
            }
        } else {
            console.log('not implemented SaveForm loc: ', loc);
        }
        handleSettings(loc[0], stats);
    };

    return (
        <TextField
            select

            value={saveIdx}
            onChange={handleChange}
            sx={{ m: 1, minWidth: 120 }}
            size="small"
            hiddenLabel
        >
            {(savedequip || []).map((save, idx) => {
                let tmpname = save.name === undefined
                    ? 'Slot with no name'
                    : save.name;
                return (<MenuItem value={idx} key={idx}>{idx + ': ' + tmpname}</MenuItem>);
            })}
        </TextField>
    );
};

export default SaveForm;
