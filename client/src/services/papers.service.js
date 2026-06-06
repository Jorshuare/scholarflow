import api from './api.js';

export const listPapers   = (projectId, params) => api.get(`/projects/${projectId}/papers`, { params }).then(r => r.data);
export const getPaper     = (projectId, pid)    => api.get(`/projects/${projectId}/papers/${pid}`).then(r => r.data);
export const createPaper  = (projectId, data)   => api.post(`/projects/${projectId}/papers`, data).then(r => r.data);
export const updatePaper  = (projectId, pid, data) => api.put(`/projects/${projectId}/papers/${pid}`, data).then(r => r.data);
export const deletePaper  = (projectId, pid)    => api.delete(`/projects/${projectId}/papers/${pid}`);

export const importBibtex = (projectId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/projects/${projectId}/papers/import/bibtex`, form).then(r => r.data);
};

export const importCsv = (projectId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/projects/${projectId}/papers/import/csv`, form).then(r => r.data);
};
