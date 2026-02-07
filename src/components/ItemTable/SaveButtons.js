import React, { Component } from 'react';
import { Button, Checkbox, FormControlLabel, TextField, Dialog, DialogContent, Box, Stack, Paper } from '@mui/material';

import { default as OptimizeButton } from '../OptimizeButton/OptimizeButton';
import SaveForm from '../SaveForm/SaveForm';
import { default as ExportForm } from '../ExportForm/ExportForm'
import DarkModeContext from '../AppLayout/DarkModeContext';

class SaveButtons extends Component {
    static contextType = DarkModeContext;

    constructor(props) {
        super(props);
        this.state = {
            value: this.props.savedequip[this.props.savedidx].ignore,
            open: false
        };
    }

    handleFocus = (event) => {
        event.target.select();
    }

    handleIgnore = (event) => {
        const checked = event.target.checked;
        this.setState({
            value: checked
        });
        let savedequip = [...this.props.savedequip];
        savedequip[this.props.savedidx] = {
            ...savedequip[this.props.savedidx],
            ignore: !savedequip[this.props.savedidx].ignore
        };
        this.props.handleSettings('savedequip', savedequip);
    }

    render() {
        //HACK: this sets the dropdown to the correct value after loading
        if (this.state.value !== this.props.savedequip[this.props.savedidx].ignore) {
            /* eslint-disable-next-line react/no-direct-mutation-state */
            this.state.value = this.props.savedequip[this.props.savedidx].ignore;
        }
        const name = this.props.savedequip[this.props.savedidx].name === undefined
            ? 'Slot with no name'
            : this.props.savedequip[this.props.savedidx].name;

        return (
            <Paper variant="outlined" sx={{ p: 1, m: 0.5 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center" flexWrap="wrap">
                    <OptimizeButton text={'All Saves'} running={this.props.running} abort={this.props.handleTerminate}
                        optimize={this.props.handleOptimizeSaves} size="small" startIcon={null} />
                    <Button variant="outlined" onClick={this.props.handleToggleUnused} size="small">
                        {this.props.showunused ? 'Unmark unused items' : 'Mark unused items'}
                    </Button>
                    <Button variant="outlined" onClick={() => this.setState({ open: true })} size="small">
                        Export loadout
                    </Button>
                    <Dialog
                        open={this.state.open}
                        onClose={() => this.setState({ open: false })}
                        maxWidth="md"
                        fullWidth
                    >
                        <DialogContent>
                            <ExportForm {...this.props} loadoutURI={this.props.loadoutURI} saveURI={this.props.saveURI}
                                closeExportModal={() => (this.setState({ open: false }))} />
                        </DialogContent>
                    </Dialog>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <SaveForm {...this.props} loc={['savedidx']} saveIdx={this.props.savedidx} />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                    <Button variant="contained" onClick={this.props.handleSaveSlot} size="small">Save Current Equipment</Button>
                    <Button variant="contained" onClick={this.props.handleLoadSlot} size="small">Load</Button>
                    <Button variant="contained" color="error" onClick={() => {
                        if (window.confirm('Are you sure you wish to delete this saved loadout?')) {
                            this.props.handleDeleteSlot()
                        }
                    }} size="small">Delete</Button>
                    <Button variant="outlined" onClick={this.props.handleLoadFactors} size="small" disabled={this.props.savedequip[this.props.savedidx].factors === undefined}>
                        {this.props.savedequip[this.props.savedidx].factors === undefined ? 'No Priorities Saved...' : 'Load Priorities'}
                    </Button>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        label="Slot Name"
                        value={name}
                        onChange={(e) => this.props.handleSaveName(e.target.value)}
                        onFocus={this.handleFocus}

                        size="small"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={this.state.value} onChange={this.handleIgnore} />}
                        label="Ignore used"
                    />
                </Stack>
            </Paper>
        );
    };
}

export default SaveButtons;
