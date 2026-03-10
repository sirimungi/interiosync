import React, { useEffect, useState } from 'react';
import { Button, List, ListItem, ListItemText, Typography, Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useSocket } from '../../context/SocketContext';
import { fetchFiles, uploadFile } from '../../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function FileUploader({ projectId, canEdit }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { lastMessage } = useSocket();

  const load = () => {
    fetchFiles(projectId)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [projectId]);

  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'file' || lastMessage.project_id !== projectId || lastMessage.event !== 'created') return;
    setFiles((prev) => [lastMessage.payload, ...prev]);
  }, [lastMessage, projectId]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;
    setUploading(true);
    setError('');
    uploadFile(projectId, file)
      .then(load)
      .catch((err) => setError(err.response?.data?.detail || 'Upload failed'))
      .finally(() => { setUploading(false); e.target.value = ''; });
  };

  if (loading) return <Typography color="text.secondary">Loading files…</Typography>;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {canEdit && (
        <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ mb: 2 }} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload file'}
          <input type="file" hidden onChange={handleFile} />
        </Button>
      )}
      {error && <Typography color="error" variant="body2" sx={{ mb: 1 }}>{error}</Typography>}
      <List dense>
        {files.map((f) => (
          <ListItem key={f.id} component="a" href={f.url.startsWith('http') ? f.url : `${API_URL}${f.url}`} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none', color: 'primary.main' }}>
            <ListItemText primary={f.filename} />
          </ListItem>
        ))}
      </List>
      {files.length === 0 && !canEdit && <Typography color="text.secondary">No files yet.</Typography>}
    </Paper>
  );
}
