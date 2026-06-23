import client from './client';

export const sessionsApi = {
  getAll: () => client.get('/sessions'),
  getById: (id) => client.get(`/sessions/${id}`),
  getByCode: (code) => client.get(`/sessions/code/${code}`),
  create: (data) => client.post('/sessions', data),
  update: (id, data) => client.put(`/sessions/${id}`, data),
  activate: (id) => client.post(`/sessions/${id}/activate`),
  close: (id) => client.post(`/sessions/${id}/close`),
  delete: (id) => client.delete(`/sessions/${id}`),
};
