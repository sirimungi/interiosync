import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Chip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const designerName = project.designer?.name || 'Designer';
  const clientName = project.client?.name || 'Client';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate(`/project/${project.id}`)}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {project.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description || 'No description'}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {designerName} → {clientName}
        </Typography>
        <Chip label={project.status} size="small" color="primary" variant="outlined" />
        <Button startIcon={<VisibilityIcon />} size="small" sx={{ mt: 1, display: 'block' }} onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}`); }}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
