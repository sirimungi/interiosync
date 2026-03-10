import { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, MenuItem, Alert, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { signup } from '../api';

export default function Signup({ onSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password, role);
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 2 }}>
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>Signup successful. Please log in.</Alert>
            <Button component={RouterLink} to="/login" variant="contained" fullWidth>Go to Login</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', p: 2 }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontFamily: 'Playfair Display, serif' }}>
            Create account
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Interior Designer Platform
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
            <TextField select label="Role" value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
              <MenuItem value="designer">Designer</MenuItem>
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="client">Client</MenuItem>
            </TextField>
            <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
              {loading ? 'Signing up…' : 'Sign up'}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Already have an account? <Link component={RouterLink} to="/login">Log in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
