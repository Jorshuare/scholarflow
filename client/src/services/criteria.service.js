import api from './api';

export const listCriteria   = (projectId)          => api.get(`/projects/${projectId}/criteria`).then(r => r.data);
export const createCriterion = (projectId, data)   => api.post(`/projects/${projectId}/criteria`, data).then(r => r.data);
export const deleteCriterion = (projectId, cid)    => api.delete(`/projects/${projectId}/criteria/${cid}`);
