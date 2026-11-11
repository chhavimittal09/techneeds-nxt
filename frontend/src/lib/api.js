const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tnx_token');
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('tnx_token', token);
  else localStorage.removeItem('tnx_token');
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('tnx_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem('tnx_user', JSON.stringify(user));
  else localStorage.removeItem('tnx_user');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, config);

  if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
    setToken(null);
    setStoredUser(null);
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/shared')) {
      window.location.href = '/login';
    }
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : 'An error occurred');
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/api/auth/me'),
  changePassword: (data) => request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getAdminOverview: () => request('/api/admin/overview'),
  getAdminPrograms: () => request('/api/admin/programs'),
  createProgram: (data) => request('/api/admin/programs', { method: 'POST', body: JSON.stringify(data) }),
  updateProgram: (id, data) => request(`/api/admin/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getAdminCohorts: () => request('/api/admin/cohorts'),
  createCohort: (data) => request('/api/admin/cohorts', { method: 'POST', body: JSON.stringify(data) }),
  updateCohort: (id, data) => request(`/api/admin/cohorts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getAdminMentors: () => request('/api/admin/mentors'),
  createMentor: (data) => request('/api/admin/mentors', { method: 'POST', body: JSON.stringify(data) }),
  resetMentorCredentials: (id) => request(`/api/admin/mentors/${id}/credentials`, { method: 'PUT' }),
  updateMentorStatus: (id, active) => request(`/api/admin/mentors/${id}/status`, { method: 'PUT', body: JSON.stringify({ active }) }),
  
  getAdminMentees: (params = '') => request(`/api/admin/mentees${params ? `?${params}` : ''}`),
  updateMenteeStatus: (id, active) => request(`/api/admin/mentees/${id}/status`, { method: 'PUT', body: JSON.stringify({ active }) }),
  
  allocateMentor: (cohortId, mentorId) => request('/api/admin/allocations', { method: 'POST', body: JSON.stringify({ cohortId, mentorId }) }),
  removeMentorAllocation: (cohortId, mentorId) => request('/api/admin/allocations', { method: 'DELETE', body: JSON.stringify({ cohortId, mentorId }) }),
  getCohortStats: (id) => request(`/api/admin/cohorts/${id}/stats`),
  getAdminAnalytics: () => request('/api/admin/analytics'),

  // Mentor
  getMentorDashboard: () => request('/api/mentor/dashboard'),
  getMentorCohorts: () => request('/api/mentor/cohorts'),
  getMentorMentees: (cohortId, search) => {
    const q = new URLSearchParams();
    if (cohortId) q.append('cohort', cohortId);
    if (search) q.append('q', search);
    const qs = q.toString();
    return request(`/api/mentor/mentees${qs ? `?${qs}` : ''}`);
  },
  createMentee: (data) => request('/api/mentor/mentees', { method: 'POST', body: JSON.stringify(data) }),
  getMenteeDetail: (id) => request(`/api/mentor/mentees/${id}`),
  
  getMentorResources: (cohortId) => {
    const qs = cohortId ? `?cohort=${cohortId}` : '';
    return request(`/api/mentor/resources${qs}`);
  },
  getMentorResource: (id) => request(`/api/mentor/resources/${id}`),
  createResource: (data) => request('/api/mentor/resources', { method: 'POST', body: JSON.stringify(data) }),
  updateResource: (id, data) => request(`/api/mentor/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publishResource: (id) => request(`/api/mentor/resources/${id}/publish`, { method: 'POST' }),
  
  getResourceSubmissions: (id) => request(`/api/mentor/resources/${id}/submissions`),
  evaluateSubmission: (id, data) => request(`/api/mentor/submissions/${id}/evaluate`, { method: 'POST', body: JSON.stringify(data) }),

  // Mentee
  getMenteeDashboard: () => request('/api/mentee/dashboard'),
  getMenteeResources: (params = '') => request(`/api/mentee/resources${params ? `?${params}` : ''}`),
  getMenteeResource: (id) => request(`/api/mentee/resources/${id}`),
  startVideo: (id) => request(`/api/mentee/resources/${id}/video/start`, { method: 'POST' }),
  completeVideo: (id) => request(`/api/mentee/resources/${id}/video/complete`, { method: 'POST' }),
  submitQuiz: (id, answers) => request(`/api/mentee/resources/${id}/quiz`, { method: 'POST', body: JSON.stringify({ answers }) }),
  getQuizResult: (id) => request(`/api/mentee/resources/${id}/result`),
  submitProject: (id, data) => request(`/api/mentee/resources/${id}/project`, { method: 'POST', body: JSON.stringify(data) }),
  getMenteeFeedback: () => request('/api/mentee/feedback'),

  // Common & Profiles
  getConfig: () => request('/api/meta/config'),
  getLeaderboard: (cohortId) => {
    const qs = cohortId ? `?cohort=${cohortId}` : '';
    return request(`/api/leaderboard${qs}`);
  },
  getNotifications: () => request('/api/notifications'),
  markNotificationsRead: (ids) => request('/api/notifications/read', { method: 'POST', body: JSON.stringify({ ids }) }),
  getActivityFeed: () => request('/api/activity'),
  globalSearch: (q) => request(`/api/search?q=${encodeURIComponent(q)}`),

  // MY NXT AI Profile
  getMyProfile: () => request('/api/profile'),
  updateProfile: (data) => request('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),
  toggleProfileShare: (enabled) => request('/api/profile/share', { method: 'POST', body: JSON.stringify({ enabled }) }),
  requestAiNarrative: () => request('/api/profile/narrative', { method: 'POST' }),
  getPublicSharedProfile: (shareId) => request(`/api/public/profile/${shareId}`),
};
