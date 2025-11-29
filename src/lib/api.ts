import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tasks API
export const tasksApi = {
  getAll: () => api.get('/tasks'),
  create: (data: { title: string; description: string; due_date: string; priority: number }) =>
    api.post('/tasks', data),
  update: (id: number, data: { title: string; description: string; due_date: string; priority: number }) =>
    api.put(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
  clearAll: () => api.delete('/tasks/clear_all'),
};

// Notes API
export const notesApi = {
  getAll: () => api.get('/notes'),
  create: (data: { content: string }) => api.post('/notes', data),
  update: (id: number, data: { content: string }) => api.put(`/notes/${id}`, data),
  delete: (id: number) => api.delete(`/notes/${id}`),
  clearAll: () => api.delete('/notes/clear_all'),
};

// Reminders API
export const remindersApi = {
  getAll: () => api.get('/reminders'),
  getToday: () => api.get('/reminders/today'),
  create: (data: { content: string; date: string }) => api.post('/reminders', data),
  update: (id: number, data: { content: string; date: string }) => api.put(`/reminders/${id}`, data),
  delete: (id: number) => api.delete(`/reminders/${id}`),
  clearAll: () => api.delete('/reminders/clear_all'),
};

// Weather API
export const weatherApi = {
  getWeather: (city: string) => api.get(`/weather/${city}`),
  getHistory: () => api.get('/weather/history'),
  resetHistory: () => api.delete('/weather/history/reset'),
};
