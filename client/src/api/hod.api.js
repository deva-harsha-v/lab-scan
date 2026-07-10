import { apiClient } from './client';

export const hodApi = {
  getStats: () => apiClient.get('/hod/stats'),
  // Sections
  getSections: () => apiClient.get('/hod/sections'),
  createSection: (data) => apiClient.post('/hod/sections', data),
  getSectionById: (id) => apiClient.get(`/hod/sections/${id}`),
  // Subjects
  getSubjects: () => apiClient.get('/hod/subjects'),
  createSubject: (data) => apiClient.post('/hod/subjects', data),
  updateSubject: (id, data) => apiClient.put(`/hod/subjects/${id}`, data),
  // Assignments
  getAssignments: () => apiClient.get('/hod/assignments'),
  createAssignment: (data) => apiClient.post('/hod/assignments', data),
  bulkCreateAssignments: (data) => apiClient.post('/hod/assignments/bulk', data),
  deleteAssignment: (id) => apiClient.delete(`/hod/assignments/${id}`),
  // Faculty
  getFaculty: () => apiClient.get('/hod/faculty'),
  // Students
  getStudents: () => apiClient.get('/hod/students'),
  enrollStudent: (data) => apiClient.post('/hod/students/enroll', data),
  bulkEnrollStudents: (data) => apiClient.post('/hod/students/bulk-enroll', data),
};