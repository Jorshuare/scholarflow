import api from './api';

export const uploadPdf       = (projectId, paperId, file) => {
  const form = new FormData();
  form.append('pdf', file);
  return api.post(`/projects/${projectId}/papers/${paperId}/upload-pdf`, form).then(r => r.data);
};

export const getExtraction   = (projectId, paperId)        => api.get(`/projects/${projectId}/papers/${paperId}/extraction`).then(r => r.data);
export const patchExtraction = (projectId, paperId, patch) => api.patch(`/projects/${projectId}/papers/${paperId}/extraction`, patch).then(r => r.data);
export const getMatrix       = (projectId)                 => api.get(`/projects/${projectId}/matrix`).then(r => r.data);
