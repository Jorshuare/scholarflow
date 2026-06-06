import api from './api.js';

export const listTags   = (projectId)           => api.get(`/projects/${projectId}/tags`).then(r => r.data);
export const createTag  = (projectId, data)     => api.post(`/projects/${projectId}/tags`, data).then(r => r.data);
export const deleteTag  = (projectId, tid)      => api.delete(`/projects/${projectId}/tags/${tid}`);
export const applyTag   = (projectId, pid, tid) => api.post(`/projects/${projectId}/papers/${pid}/tags/${tid}`).then(r => r.data);
export const removeTag  = (projectId, pid, tid) => api.delete(`/projects/${projectId}/papers/${pid}/tags/${tid}`);
