import React from 'react';
import { Table, TableBody, TableCell, TableRow, Checkbox, FormControlLabel, Box, Paper } from '@mui/material';
import SaveForm from '../SaveForm/SaveForm';

const PotionInput = (props) => {
    const { name, piType, plShort, handleSettings } = props;
    const settings = props[name];
    const key = plShort + piType + 'Pot';
    const checked = settings[key];

    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={checked}
                    onChange={() => handleSettings(name, {
                        ...settings,
                        [key]: !checked
                    })}
                    size="small"
                />
            }
            label={piType}
        />
    );
};

const PotionLine = (props) => {
    if (props.plHide) return null;
    return (
        <TableRow>
            <TableCell>{props.plName}</TableCell>
            <TableCell>
                <PotionInput {...props} plShort={props.plShort + 'c'} piType={'Beta'} />
                <PotionInput {...props} plShort={props.plShort + 'c'} piType={'Delta'} />
            </TableCell>
            <TableCell>
                <PotionInput {...props} piType={'Beta'} />
                <PotionInput {...props} piType={'Delta'} />
            </TableCell>
        </TableRow>
    );
};

const ModifierForm = (props) => {
    const { name, handleSettings } = props;
    const settings = props[name];

    return (
        <Paper variant="outlined" sx={{ p: 1, my: 1, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={settings.modifiers}
                            onChange={() => handleSettings(name, {
                                ...settings,
                                modifiers: !settings.modifiers
                            })}
                        />
                    }
                    label="Advanced modifiers"
                />
            </Box>

            {settings.modifiers && (
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell>Current loadout</TableCell>
                            <TableCell colSpan={2}>
                                <SaveForm {...props} loc={[name, 'currentLoadout']} saveIdx={settings.currentLoadout} />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Dedicated loadout</TableCell>
                            <TableCell colSpan={2}>
                                <SaveForm {...props} loc={[name, 'dedicatedLoadout']} saveIdx={settings.dedicatedLoadout} />
                            </TableCell>
                        </TableRow>
                        {(props.e || props.m || props.r) && (
                            <TableRow>
                                <TableCell>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={settings.blueHeart}
                                                onChange={() => handleSettings(name, {
                                                    ...settings,
                                                    blueHeart: !settings.blueHeart
                                                })}
                                                size="small"
                                            />
                                        }
                                        label="Blue Heart Maxxed"
                                    />
                                </TableCell>
                                <TableCell>{'Current'}</TableCell>
                                <TableCell>{'Dedicated'}</TableCell>
                            </TableRow>
                        )}
                        <PotionLine {...props} plName={'Energy Potion'} plShort={'e'} plHide={!props.e} />
                        <PotionLine {...props} plName={'Magic Potion'} plShort={'m'} plHide={!props.m} />
                        <PotionLine {...props} plName={'R3 Potion'} plShort={'r'} plHide={!props.r} />
                    </TableBody>
                </Table>
            )}
        </Paper>
    );
};

export default ModifierForm;
