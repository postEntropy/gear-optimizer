import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import { Factors } from '../../assets/ItemAux';
import { default as Crement } from '../Crement/Crement';

const FactorForm = (props) => {
    const { factors, idx, handleEditFactor, equip, maxslots, handleCrement } = props;
    const factorKey = factors[idx];
    const factorName = Factors[factorKey][0];

    const handleChange = (event) => {
        const selectedValue = event.target.value;
        const newFactorKey = Object.getOwnPropertyNames(Factors).find(key => Factors[key][0] === selectedValue);
        handleEditFactor(idx, newFactorKey);
    };

    const options = Object.getOwnPropertyNames(Factors).map(key => ({
        value: Factors[key][0],
        label: Factors[key][0]
    }));

    const accslots = equip.accessory.length;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <FormControl size="small" sx={{ width: 200 }}>
                <InputLabel>Factor</InputLabel>
                <Select
                    value={factorName}
                    label="Factor"
                    onChange={handleChange}
                >
                    {options.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Box>
                <Crement
                    header='slots'
                    value={maxslots[idx]}
                    name={['maxslots', idx]}
                    handleClick={handleCrement}
                    min={0}
                    max={accslots}
                />
            </Box>
        </Box>
    );
};

export default FactorForm;