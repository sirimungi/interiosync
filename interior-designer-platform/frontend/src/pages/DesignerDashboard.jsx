import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, AppBar, Toolbar, Card, CardContent, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import { createProject, fetchProjects, getUsersByRole } from '../../api';
import ProjectCard from '../components/ProjectCard';

export default function DesignerDashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', client_id: '' });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const openForm = () => {
    setOpen(true);
    setForm({ name: '', description: '', client_id: '' });
    getUsersByRole('client').then(setClients).catch(() => setClients([]));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name || !form.client_id) return;
    setLoading(true);
    createProject({
      name: form.name,
      description: form.description || undefined,
      designer_id: user.id,
      client_id: parseInt(form.client_id, 10),
    })
      .then(() => {
        setOpen(false);
        fetchProjects().then(setProjects);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Interior Designer Platform</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>{user?.name} (Designer)</Typography>
          <Button startIcon={<LogoutIcon />} onClick={onLogout}>Log out</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">My Projects</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openForm}>New project</Button>
        </Box>

        <Grid container spacing={3}>
          {projects.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <ProjectCard project={p} />
            </Grid>
          ))}
        </Grid>
        {projects.length === 0 && (
          <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <CardContent>
              <Typography color="text.secondary">No projects yet. Create one to get started.</Typography>
              <Button variant="outlined" sx={{ mt: 2 }} onClick={openForm}>Create project</Button>
            </CardContent>
          </Card>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create project</DialogTitle>
        <form onSubmit={handleCreate}>
          <DialogContent>
            <TextField autoFocus margin="dense" label="Project name" fullWidth required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField margin="dense" label="Description" fullWidth multiline rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <TextField select margin="dense" label="Client" fullWidth required value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}>
              <MenuItem value="">Select client</MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name} ({c.email})</MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Creating…' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
