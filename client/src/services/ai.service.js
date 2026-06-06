import api from './api';

export const sendMessage = (projectId, message) =>
  api.post(`/projects/${projectId}/ai/chat`, { message }).then(r => r.data);

export const getChatHistory = (projectId) =>
  api.get(`/projects/${projectId}/ai/history`).then(r => r.data);
