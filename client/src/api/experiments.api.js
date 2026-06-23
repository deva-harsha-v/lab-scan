import client from './client';

export const experimentsApi = {
  // Fetch all experiments list
  getAll: () => client.get('/experiments'),
  
  // Fetch a single experiment with all its text, pdf, and sample table contents
  getById: (id) => client.get(`/experiments/${id}`),
  
  // Create a new master experiment record
  create: (data) => client.post('/experiments', data),
  
  // Update a master experiment record description/meta
  update: (id, data) => client.put(`/experiments/${id}`, data),
  
  // Remove an experiment completely
  delete: (id) => client.delete(`/experiments/${id}`),
  
  // Add a raw manual text component or structured table array data
  addContent: (id, data) => client.post(`/experiments/${id}/contents`, data),
  
  // Modify an existing experimental subsection or sequence order
  updateContent: (id, contentId, data) =>
    client.put(`/experiments/${id}/contents/${contentId}`, data),
  
  // Delete specific sub-content from an experiment
  deleteContent: (id, contentId) =>
    client.delete(`/experiments/${id}/contents/${contentId}`),
    
  // Secure multipart file upload directly stream-routed to Cloudinary
  uploadFile: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post(`/experiments/${id}/contents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Physical lab hardware scanning integration (QR/Aruco hardware tags)
  lookupByAruco: (arucoId) => client.get(`/aruco/lookup/${arucoId}`),
};