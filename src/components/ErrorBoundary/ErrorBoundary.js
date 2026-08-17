import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '100vh',
                        p: 3,
                        bgcolor: '#121212',
                        color: '#fff'
                    }}
                >
                    <Paper
                        elevation={6}
                        sx={{
                            p: 4,
                            maxWidth: 600,
                            width: '100%',
                            textAlign: 'center',
                            borderRadius: 3,
                            bgcolor: '#1e1e2d',
                            color: '#fff'
                        }}
                    >
                        <Typography variant="h5" fontWeight="bold" gutterBottom color="error">
                            Ops! Algo deu errado ao carregar a página.
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
                            {this.state.error?.toString() || 'Um erro inesperado ocorreu.'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => window.location.reload()}
                        >
                            Recarregar Página
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
