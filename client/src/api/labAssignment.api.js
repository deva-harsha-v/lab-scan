import { apiClient } from './client';

export const labAssignmentApi = {
  getMyAssignments: () => apiClient.get('/lab-assignments/my'),
  getDetail: (id) => apiClient.get(`/lab-assignments/${id}`),
  upsertSlot: (assignmentId, data) => apiClient.post(`/lab-assignments/${assignmentId}/slots`, data),
  deleteSlot: (assignmentId, slotId) => apiClient.delete(`/lab-assignments/${assignmentId}/slots/${slotId}`),
  getRecords: (assignmentId) => apiClient.get(`/lab-assignments/${assignmentId}/records`),
  reviewRecord: (assignmentId, recordId, data) => apiClient.put(`/lab-assignments/${assignmentId}/records/${recordId}`, data),
};
