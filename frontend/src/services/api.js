import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('paycircle_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle unauthorized response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('paycircle_token');
        localStorage.removeItem('paycircle_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/me', data),
  searchUsers: (query) => api.get(`/users/search?query=${encodeURIComponent(query)}`),
};

export const groupAPI = {
  getGroups: () => api.get('/groups'),
  getGroupById: (id) => api.get(`/groups/${id}`),
  createGroup: (data) => api.post('/groups', data),
  updateGroup: (id, data) => api.put(`/groups/${id}`, data),
  addMember: (groupId, data) => api.post(`/groups/${groupId}/members`, data),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
};

export const expenseAPI = {
  getGroupExpenses: (groupId) => api.get(`/expenses/group/${groupId}`),
  getUserExpenses: () => api.get('/expenses/my'),
  getExpenseById: (id) => api.get(`/expenses/${id}`),
  createExpense: (data) => api.post('/expenses', data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
};

export const settlementAPI = {
  getGroupBalances: (groupId) => api.get(`/settlements/group/${groupId}/balances`),
  getOverallBalances: () => api.get('/settlements/overall'),
  recordSettlement: (data) => api.post('/settlements', data),
  getGroupSettlements: (groupId) => api.get(`/settlements/group/${groupId}`),
  getUserSettlements: () => api.get('/settlements/my'),
};

export const paymentRequestAPI = {
  getRequests: () => api.get('/payment-requests/my'),
  createRequest: (data) => api.post('/payment-requests', data),
  respondRequest: (id, action, transactionRef) =>
    api.post(`/payment-requests/${id}/respond?action=${action}${transactionRef ? `&transactionRef=${encodeURIComponent(transactionRef)}` : ''}`),
  getUpiDetails: (id) => api.get(`/payment-requests/${id}/upi-details`),
};

export const budgetAPI = {
  getGroupBudgets: (groupId, month, year) =>
    api.get(`/budgets/group/${groupId}${month && year ? `?month=${month}&year=${year}` : ''}`),
  getUserBudgets: (month, year) =>
    api.get(`/budgets/my${month && year ? `?month=${month}&year=${year}` : ''}`),
  createBudget: (data) => api.post('/budgets', data),
};

export const recurringAPI = {
  getGroupRecurring: (groupId) => api.get(`/recurring-expenses/group/${groupId}`),
  createRecurring: (data) => api.post('/recurring-expenses', data),
  toggleStatus: (id) => api.patch(`/recurring-expenses/${id}/toggle`),
  triggerExpense: (id) => api.post(`/recurring-expenses/${id}/trigger`),
};

export const activityAPI = {
  getGroupActivity: (groupId, limit = 30) => api.get(`/activity/group/${groupId}?limit=${limit}`),
  getFeed: (limit = 30) => api.get(`/activity/feed?limit=${limit}`),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const analyticsAPI = {
  getGroupAnalytics: (groupId) => api.get(`/analytics/group/${groupId}`),
  getPersonalAnalytics: () => api.get('/analytics/personal'),
};

export default api;
