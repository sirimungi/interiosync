import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, AppBar, Toolbar, Button, Card, CardContent } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { fetchProjects } from '../../api';
import ProjectCard from '../components/ProjectCard';

export default function ClientDashboard({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([])).finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Interior Designer Platform</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>{user?.name} (Client)</Typography>
          <Button startIcon={<LogoutIcon />} onClick={onLogout}>Log out</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>My Projects</Typography>
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <Grid container spacing={3}>
            {projects.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <ProjectCard project={p} />
              </Grid>
            ))}
          </Grid>
        )}
        {!loading && projects.length === 0 && (
          <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <CardContent>
              <Typography color="text.secondary">No projects yet.</Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
