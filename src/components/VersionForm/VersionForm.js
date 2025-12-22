import React from 'react';
import { TextField, MenuItem } from '@mui/material';

export default class VersionForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.version
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
        this.props.handleChange(event, 'version');
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    render() {
        //HACK: this sets the dropdown to the correct value after loading
        if (this.state.value !== this.props.augstats.version) {
            /* eslint-disable-next-line react/no-direct-mutation-state */
            this.state.value = this.props.augstats.version;
        }
        const version_names = ['normal', 'evil', 'sadistic'];
        return (
            <TextField
                select
                label="Difficulty"
                value={this.state.value}
                onChange={this.handleChange}

                size="small"
                sx={{ width: 120, m: 1 }}
            >
                {version_names.map((name, idx) => (
                    <MenuItem value={idx} key={idx}>{name}</MenuItem>
                ))}
            </TextField>
        );
    }
}
