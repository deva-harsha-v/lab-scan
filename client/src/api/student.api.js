import { apiClient } from './client';

export const studentApi = {
  getDashboard: () => apiClient.get('/student/dashboard'),
  getLabDetail: (assignmentId) => apiClient.get(`/student/labs/${assignmentId}`),
  submitExperiment: (data) => apiClient.post('/student/submit', data),
};
