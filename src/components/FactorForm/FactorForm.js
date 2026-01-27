import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import ListSubheader from '@mui/material/ListSubheader';
import { Factors, FactorGroups } from '../../assets/ItemAux';
import { default as Crement } from '../Crement/Crement';

const FactorForm = (props) => {
    const { factors, idx, handleEditFactor, equip, maxslots, handleCrement } = props;
    const factorKey = factors[idx];

    const handleChange = (event) => {
        handleEditFactor(idx, event.target.value);
    };

    const accslots = equip.accessory.length;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <FormControl size="small" sx={{ width: 200 }}>
                <InputLabel>Factor</InputLabel>
                <Select
                    value={factorKey}
                    label="Factor"
                    onChange={handleChange}
                    MenuProps={{
                        transitionDuration: 0, // Instant close for snappier feel
                        anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'center',
                        },
                        transformOrigin: {
                            vertical: 'top',
                            horizontal: 'center',
                        },
                        PaperProps: {
                            style: {
                                width: 800,
                                maxWidth: 'none',
                                maxHeight: 600,
                            },
                        },
                        MenuListProps: {
                            style: {
                                columnCount: 3,
                                columnGap: '20px',
                                padding: '10px',
                            },
                        },
                    }}
                >
                    {FactorGroups.map((group) => {
                        const groupItems = group.keys
                            .filter(key => Factors[key]) // Ensure key exists
                            .map(key => (
                                <MenuItem key={key} value={key} style={{ breakInside: 'avoid' }}>
                                    {Factors[key][0]}
                                </MenuItem>
                            ));

                        if (groupItems.length === 0) return null;

                        return [
                            <ListSubheader
                                key={group.label}
                                disableSticky
                                sx={{
                                    fontWeight: 'bold',
                                    color: 'primary.main',
                                    backgroundColor: 'transparent',
                                    breakInside: 'avoid',
                                    breakAfter: 'avoid',
                                    fontSize: '0.9rem',
                                    lineHeight: '2rem',
                                    borderBottom: 'none',
                                    textDecoration: 'none'
                                }}
                            >
                                {group.label}
                            </ListSubheader>,
                            ...groupItems
                        ];
                    })}
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