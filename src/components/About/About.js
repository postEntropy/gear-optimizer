import React, { Component } from 'react';
import ReactGA from 'react-ga';
import { Button, Dialog, DialogContent, Typography, Link, Box } from '@mui/material';

import GitCommit from '../../_git_commit';
import GOVersion from '../../_version';
import { default as PortForm } from '../PortForm/PortForm'
import DarkModeContext from '../AppLayout/DarkModeContext';

class AboutComponent extends Component {
    static contextType = DarkModeContext;

    constructor(props) {
        super(props);
        this.state = {
            open: false,
            latest: null
        };
        this.fresh = true;
    }

    getLatestVersionNumber() {
        var xhr = new XMLHttpRequest()
        xhr.addEventListener('load', () => {
            let result = null;
            try {
                result = JSON.parse(xhr.responseText)[0].name;
            } catch (e) {
                result = null;
            }
            if (result !== null) {
                this.setState({ latest: result })
            }
        })
        xhr.open('GET', 'https://api.github.com/repos/gmiclotte/gear-optimizer/tags')
        xhr.send()
    }

    render() {
        ReactGA.pageview('/about');
        if (this.fresh) {
            try {
                this.getLatestVersionNumber();
            } catch (e) {
                this.setState({ latest: null });
            }
            this.fresh = false;
        }
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1" paragraph>
                    {'NGU Idle Gear Optimizer v' + GOVersion.version}
                    <br />
                    {'Latest version: ' + (
                        this.state.latest === null
                            ? 'loading...'
                            : ('v' + this.state.latest))
                    }
                    <br />
                    {
                        this.state.latest !== null && GOVersion.version !== this.state.latest
                            ? 'Update by closing and reopening the optimizer once or twice.'
                            : ''
                    }
                    <br /> {'Git hash: ' + (GitCommit.logMessage ? GitCommit.logMessage.slice(0, 8) : 'Unknown')}
                </Typography>
                <Typography variant="body1" paragraph>
                    <Link href="https://github.com/gmiclotte/gear-optimizer/issues/new" target="_blank" rel="noopener noreferrer">
                        Report an issue.
                    </Link>
                </Typography>
                <Typography variant="body1" paragraph>
                    {'Not affiliated with '}
                    <Link href="https://www.kongregate.com/games/somethingggg/ngu-idle" target="_blank" rel="noopener noreferrer">
                        NGU Idle
                    </Link>{'.'}
                </Typography>
                <Typography variant="body1" paragraph>
                    {'All art copyright by '}
                    <Link href="https://www.kongregate.com/accounts/somethingggg" target="_blank" rel="noopener noreferrer">
                        4G
                    </Link>{'.'}
                </Typography>
                <Button variant="contained" onClick={() => this.setState({ open: true })}>
                    Import/Export local storage
                </Button>
                <Dialog open={this.state.open} onClose={() => this.setState({ open: false })}>
                    <DialogContent>
                        <PortForm {...this.props} closePortModal={() => (this.setState({ open: false }))} />
                    </DialogContent>
                </Dialog>
            </Box>
        );
    };
}

export default AboutComponent;
