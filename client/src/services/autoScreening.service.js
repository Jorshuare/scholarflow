import api from './api';

export const runScreening     = (projectId)        => api.post(`/projects/${projectId}/screening/run`).then(r => r.data);
export const getStatus        = (projectId)        => api.get(`/projects/${projectId}/screening/status`).then(r => r.data);
export const getResults       = (projectId, queue) => api.get(`/projects/${projectId}/screening/results`, { params: { queue } }).then(r => r.data);
export const confirmDecisions = (projectId, decisions) => api.post(`/projects/${projectId}/screening/confirm`, { decisions }).then(r => r.data);
export const overrideDecision = (projectId, pid, finalDecision, reason) => api.patch(`/projects/${projectId}/screening/${pid}/override`, { finalDecision, reason }).then(r => r.data);
export const getMethodology   = (projectId)        => api.get(`/projects/${projectId}/screening/methodology`, { responseType: 'text' }).then(r => r.data);
