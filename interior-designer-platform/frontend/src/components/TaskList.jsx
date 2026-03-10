import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, IconButton, FormControl, Typography } from '@mui/material';
import { useSocket } from '../../context/SocketContext';
import { fetchTasks, updateTask, deleteTask } from '../../api';
import DeleteIcon from '@mui/icons-material/Delete';

export default function TaskList({ projectId, canEdit }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useSocket();

  const load = () => {
    fetchTasks(projectId)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [projectId]);

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'task' || lastMessage.project_id !== projectId) return;
    if (lastMessage.event === 'created') {
      setTasks((prev) => [...prev, lastMessage.payload]);
    } else if (lastMessage.event === 'updated') {
      setTasks((prev) => prev.map((t) => (t.id === lastMessage.payload.id ? { ...t, ...lastMessage.payload } : t)));
    } else if (lastMessage.event === 'deleted') {
      setTasks((prev) => prev.filter((t) => t.id !== lastMessage.payload.id));
    }
  }, [lastMessage, projectId]);

  const handleStatusChange = (task, newStatus) => {
    if (!canEdit) return;
    updateTask(task.id, { status: newStatus }).then(load);
  };

  const handleDelete = (id) => {
    if (!canEdit) return;
    if (window.confirm('Delete this task?')) deleteTask(id).then(load);
  };

  if (loading) return <Typography color="text.secondary">Loading tasks…</Typography>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Status</TableCell>
            {canEdit && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.title}</TableCell>
              <TableCell>{t.description || '—'}</TableCell>
              <TableCell>
                {canEdit ? (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t, e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="todo">To do</MenuItem>
                      <MenuItem value="in_progress">In progress</MenuItem>
                      <MenuItem value="done">Done</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Typography variant="body2" color="text.secondary">{t.status}</Typography>
                )}
              </TableCell>
              {canEdit && (
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => handleDelete(t.id)} aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {tasks.length === 0 && <Typography sx={{ p: 2 }} color="text.secondary">No tasks yet.</Typography>}
    </TableContainer>
  );
}
