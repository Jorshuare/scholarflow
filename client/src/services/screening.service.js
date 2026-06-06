import api from './api.js';

export const screenPaper = (projectId, pid, data) =>
  api.patch(`/projects/${projectId}/papers/${pid}/screen`, data).then(r => r.data);
