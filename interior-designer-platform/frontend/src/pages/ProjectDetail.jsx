import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Button, TextField, AppBar, Toolbar } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import LogoutIcon from '@mui/icons-material/Logout';
import { fetchProject, createTask } from '../../api';
import TaskList from '../components/TaskList';
import FileUploader from '../components/FileUploader';
import ChatBox from '../components/ChatBox';

function TabPanel({ children, value, index, ...rest }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`project-tabpanel-${index}`} aria-labelledby={`project-tab-${index}`} {...rest}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ProjectDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const canEdit = user?.role === 'designer' || user?.role === 'employee';

  useEffect(() => {
    fetchProject(id)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !project) return;
    createTask({ project_id: project.id, title: newTaskTitle.trim() }).then(() => setNewTaskTitle(''));
  };

  if (loading) return <Typography sx={{ p: 2 }}>Loading…</Typography>;
  if (!project) return <Typography color="error" sx={{ p: 2 }}>Project not found.</Typography>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => navigate('/')} sx={{ mr: 2 }}>Back</Button>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>{project.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>{user?.name}</Typography>
          <Button startIcon={<LogoutIcon />} onClick={onLogout}>Log out</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          {project.description || 'No description'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Designer: {project.designer?.name} · Client: {project.client?.name}
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tab label="Tasks" id="project-tab-0" />
          <Tab label="Files" id="project-tab-1" />
          <Tab label="Chat" id="project-tab-2" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Typography variant="h6" gutterBottom>Tasks</Typography>
          {canEdit && (
            <Box component="form" onSubmit={handleAddTask} sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField size="small" label="New task" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task title" sx={{ flex: 1 }} />
              <Button type="submit" variant="contained">Add task</Button>
            </Box>
          )}
          <TaskList projectId={project.id} canEdit={canEdit} />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>Files</Typography>
          <FileUploader projectId={project.id} canEdit={canEdit} />
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>Messages</Typography>
          <ChatBox projectId={project.id} />
        </TabPanel>
      </Box>
    </Box>
  );
}
