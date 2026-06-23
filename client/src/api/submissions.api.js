import client from './client';

export const submissionsApi = {
  create: (formData) =>
    client.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getBySession: (sessionId) => client.get(`/submissions/session/${sessionId}`),
  getById: (id) => client.get(`/submissions/${id}`),
  review: (id, data) => client.patch(`/submissions/${id}/review`, data),
};
