import React from 'react';
import { TextField, Button, Box, Stack } from '@mui/material';
import { LOCALSTORAGE_NAME } from '../../constants';
import { safeStorage } from '../../utils/safeStorage';

export default class PortForm extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            save: btoa(null)
        };
        this.fresh = true;
    }

    handleSubmit(event) {
        event.preventDefault();
        this.handleClose();
    }

    handleChange(event, save) {
        if (save === undefined) {
            save = null;
            try {
                save = atob(this.state.save);
            } catch (e) {
                console.log('Error: invalid local storage imported.');
                this.handleClose();
                return;
            }
        }
        safeStorage.setItem(LOCALSTORAGE_NAME, save);
        this.props.handleLoadStateLocalStorage();

    }

    handleFocus(event) {
        event.target.select();
    }

    handleClose() {
        this.fresh = true;
        this.props.closePortModal();
    }

    render() {
        const rawSave = safeStorage.getItem(LOCALSTORAGE_NAME);
        const save = btoa(rawSave !== null ? rawSave : '');
        if (this.fresh) {
            //HACK: this sets the import field to the current value when opening the modal
            /* eslint-disable-next-line react/no-direct-mutation-state */
            this.state.save = save;
            this.fresh = false;
        }
        return (
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Local storage"
                    value={this.state.save}
                    onChange={(e) => this.setState({ save: e.target.value })}
                    onFocus={this.handleFocus}
                    fullWidth
                    variant="outlined"
                    autoFocus
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="contained" onClick={(e) => this.handleChange(e)}>Import</Button>
                    <Button variant="outlined" color="error" onClick={(e) => this.handleChange(e, null)}>Clear local storage</Button>
                    <Button variant="text" onClick={this.props.closePortModal}>Cancel</Button>
                </Stack>
            </Box>
        );
    }
}
