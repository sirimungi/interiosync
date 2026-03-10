import { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { login } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 2 }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontFamily: 'Playfair Display, serif' }}>
            Interior Designer Platform
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Sign in to manage your projects
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            <TextField type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required fullWidth />
            <TextField type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required fullWidth />
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Don&apos;t have an account? <Link component={RouterLink} to="/signup">Sign up</Link>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" align="center" sx={{ mt: 2 }}>
            Demo: designer@example.com / designer123 · client@example.com / client123 · employee@example.com / employee123
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
