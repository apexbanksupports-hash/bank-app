const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export async function uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

export const auth = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    apiRequest<{ token: string; user: any; emailVerificationToken?: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiRequest<{ token?: string; user?: any; requiresTwoFactor?: boolean; userId?: string; email?: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  setup2FA: () =>
    apiRequest<{ secret: string; qrCode: string; otpauth_url: string }>('/auth/2fa/setup', { method: 'POST' }),

  verify2FA: (userId: string, token: string) =>
    apiRequest<{ token: string; user: any }>('/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ userId, token }) }),

  disable2FA: (token: string) =>
    apiRequest<{ message: string }>('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ token }) }),

  verify2FALogin: (userId: string, token: string) =>
    apiRequest<{ token: string; user: any }>('/auth/2fa/login', { method: 'POST', body: JSON.stringify({ userId, token }) }),

  verifyEmail: (token: string) =>
    apiRequest<{ message: string }>(`/auth/verify-email/${token}`, { method: 'POST' }),

  resendVerification: () =>
    apiRequest<{ message: string; emailVerificationToken?: string }>('/auth/resend-verification', { method: 'POST' }),

  getProfile: () =>
    apiRequest<any>('/auth/profile'),
};

export const accounts = {
  create: (accountType: string = 'checking') =>
    apiRequest<any>('/accounts', { method: 'POST', body: JSON.stringify({ accountType }) }),

  list: () =>
    apiRequest<any[]>('/accounts'),

  get: (id: string) =>
    apiRequest<any>(`/accounts/${id}`),

  getByNumber: (number: string) =>
    apiRequest<any>(`/accounts/number/${number}`),

  search: (query: string) =>
    apiRequest<any[]>(`/accounts/search/query?q=${encodeURIComponent(query)}`),

  close: (id: string) =>
    apiRequest<any>(`/accounts/${id}`, { method: 'DELETE' }),
};

export const transfers = {
  send: (data: { recipientAccountNumber: string; amount: number; description?: string; senderAccountId: string; categoryId?: string | null; transactionPin: string }) =>
    apiRequest<any>('/transfers', { method: 'POST', body: JSON.stringify(data) }),

  reverse: (id: string) =>
    apiRequest<any>(`/transfers/${id}/reverse`, { method: 'POST' }),

  list: (page: number = 1, limit: number = 20) =>
    apiRequest<{ transfers: any[]; total: number; page: number; pages: number }>(`/transfers?page=${page}&limit=${limit}`),

  getByReference: (ref: string) =>
    apiRequest<any>(`/transfers/reference/${ref}`),

  getByAccount: (accountId: string, page: number = 1, limit: number = 20) =>
    apiRequest<any>(`/transfers/account/${accountId}?page=${page}&limit=${limit}`),

  getLimits: () =>
    apiRequest<{ dailyLimit: number; dailyUsed: number; dailyRemaining: number }>('/transfers/limits'),
};

export const kyc = {
  upload: (formData: FormData) =>
    uploadFile<any>('/kyc/upload', formData),

  status: () =>
    apiRequest<{ kycStatus: string }>('/kyc/status'),

  documents: () =>
    apiRequest<any[]>('/kyc/documents'),

  updateProfile: (data: any) =>
    apiRequest<any>('/kyc/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const password = {
  change: (currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>('/password/change', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),

  forgot: (email: string) =>
    apiRequest<{ message: string; resetToken?: string }>('/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }),

  reset: (token: string, newPassword: string) =>
    apiRequest<{ message: string }>('/password/reset', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
};

export const notifications = {
  list: () =>
    apiRequest<any[]>('/notifications'),

  unreadCount: () =>
    apiRequest<{ count: number }>('/notifications/unread-count'),

  markRead: (id: string) =>
    apiRequest<any>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllRead: () =>
    apiRequest<any>('/notifications/read-all', { method: 'PUT' }),
};

export const schedule = {
  create: (data: any) =>
    apiRequest<any>('/schedule', { method: 'POST', body: JSON.stringify(data) }),

  list: () =>
    apiRequest<any[]>('/schedule'),

  update: (id: string, data: any) =>
    apiRequest<any>(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  cancel: (id: string) =>
    apiRequest<any>(`/schedule/${id}`, { method: 'DELETE' }),
};

export const categories = {
  list: () =>
    apiRequest<any[]>('/categories'),

  create: (data: { name: string; icon?: string; color?: string }) =>
    apiRequest<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest<any>(`/categories/${id}`, { method: 'DELETE' }),

  categorizeTransfer: (transferId: string, categoryId: string | null) =>
    apiRequest<any>(`/categories/transfer/${transferId}/category`, { method: 'PUT', body: JSON.stringify({ categoryId }) }),
};

export const statements = {
  current: () =>
    apiRequest<any>('/statements'),

  range: (start: string, end: string) =>
    apiRequest<any>(`/statements/range?start=${start}&end=${end}`),
};

export const safebox = {
  list: () =>
    apiRequest<any[]>('/safebox'),

  create: (data: { name?: string; targetAmount?: number }) =>
    apiRequest<any>('/safebox', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiRequest<any>(`/safebox/${id}`),

  deposit: (id: string, amount: number, senderAccountId: string, transactionPin: string) =>
    apiRequest<any>(`/safebox/${id}/deposit`, { method: 'POST', body: JSON.stringify({ amount, senderAccountId, transactionPin }) }),

  withdraw: (id: string, amount: number, recipientAccountId: string, transactionPin: string) =>
    apiRequest<any>(`/safebox/${id}/withdraw`, { method: 'POST', body: JSON.stringify({ amount, recipientAccountId, transactionPin }) }),
};

export const entertainment = {
  spin: () =>
    apiRequest<{ prize: number; basePrize: number; multiplier: string }>('/entertainment/spin', { method: 'POST' }),

  spinStatus: () =>
    apiRequest<{ hasSpun: boolean }>('/entertainment/spin/status'),

  dailyReward: () =>
    apiRequest<{ reward: number; streak: number }>('/entertainment/daily-reward', { method: 'POST' }),

  dailyRewardStatus: () =>
    apiRequest<{ canClaim: boolean; currentStreak: number; lastClaimed: string | null }>('/entertainment/daily-reward/status'),
};

export const admin = {
  stats: () =>
    apiRequest<{ userCount: number; accountCount: number; transferCount: number; pendingKycCount: number; totalVolume: number }>('/admin/stats'),

  users: () =>
    apiRequest<any[]>('/admin/users'),

  getUser: (id: string) =>
    apiRequest<any>(`/admin/users/${id}`),

  setRole: (userId: string, role: string) =>
    apiRequest<any>(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  toggleActive: (userId: string) =>
    apiRequest<any>(`/admin/users/${userId}/toggle-active`, { method: 'PUT' }),

  kycPending: () =>
    apiRequest<any[]>('/admin/kyc-pending'),

  reviewKyc: (docId: string, status: string, reviewNote?: string) =>
    apiRequest<any>(`/admin/kyc/${docId}/review`, { method: 'PUT', body: JSON.stringify({ status, reviewNote }) }),

  listAccounts: () =>
    apiRequest<any[]>('/admin/accounts'),

  adjustBalance: (accountId: string, amount: number, type: 'add' | 'subtract') =>
    apiRequest<any>(`/admin/accounts/${accountId}/balance`, { method: 'PUT', body: JSON.stringify({ amount, type }) }),

  transactions: (page: number = 1, limit: number = 20) =>
    apiRequest<any>(`/admin/transactions?page=${page}&limit=${limit}`),
};

export const wire = {
  send: (data: {
    senderAccountId: string;
    beneficiaryId?: string;
    beneficiaryName: string;
    beneficiaryAccountNumber: string;
    beneficiaryEmail?: string;
    bankName: string;
    bankCountry?: string;
    bankCountryCode: string;
    swiftCode: string;
    amount: number;
    currency?: string;
    receiveCurrency?: string;
    description?: string;
    purposeOfTransfer?: string;
    correspondentBank?: string;
    correspondentSwift?: string;
    transactionPin: string;
  }) =>
    apiRequest<any>('/wire', { method: 'POST', body: JSON.stringify(data) }),

  list: (page: number = 1, limit: number = 20, status?: string) =>
    apiRequest<{ transfers: any[]; total: number; page: number; pages: number }>(
      `/wire?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`
    ),

  get: (id: string) =>
    apiRequest<any>(`/wire/${id}`),

  getByReference: (ref: string) =>
    apiRequest<any>(`/wire/reference/${ref}`),

  track: (trackingNumber: string) =>
    apiRequest<any>(`/wire/track/${trackingNumber}`),

  cancel: (id: string) =>
    apiRequest<any>(`/wire/${id}/cancel`, { method: 'PUT' }),

  currencies: () =>
    apiRequest<{ code: string; name: string; rate: number }[]>('/wire/currencies/list'),

  quote: (data: { amount: number; fromCurrency: string; toCurrency: string; countryCode?: string }) =>
    apiRequest<any>('/wire/quote', { method: 'POST', body: JSON.stringify(data) }),
};

export const banks = {
  search: (q: string, country?: string) =>
    apiRequest<any[]>(`/banks/search?q=${encodeURIComponent(q)}${country ? `&country=${country}` : ''}`),

  countries: () =>
    apiRequest<{ country: string; code: string; currency: string; currencyCode: string; flag: string }[]>('/banks/countries'),

  byCountry: (code: string) =>
    apiRequest<any[]>(`/banks/country/${code}`),
};

export const beneficiaries = {
  list: () =>
    apiRequest<any[]>('/beneficiaries'),

  get: (id: string) =>
    apiRequest<any>(`/beneficiaries/${id}`),

  create: (data: {
    name: string;
    email?: string;
    bankName: string;
    bankCountry: string;
    bankCountryCode: string;
    swiftCode: string;
    accountNumber: string;
    currency?: string;
  }) =>
    apiRequest<any>('/beneficiaries', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiRequest<any>(`/beneficiaries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest<any>(`/beneficiaries/${id}`, { method: 'DELETE' }),

  toggleFavorite: (id: string) =>
    apiRequest<any>(`/beneficiaries/${id}/favorite`, { method: 'PUT' }),
};

export const pin = {
  status: () =>
    apiRequest<{ pinSet: boolean }>('/auth/pin/status'),

  set: (password: string, pinCode: string) =>
    apiRequest<{ message: string }>('/auth/pin/set', { method: 'POST', body: JSON.stringify({ password, pin: pinCode }) }),

  verify: (pinCode: string) =>
    apiRequest<{ valid: boolean }>('/auth/pin/verify', { method: 'POST', body: JSON.stringify({ pin: pinCode }) }),

  change: (currentPin: string, newPin: string) =>
    apiRequest<{ message: string }>('/auth/pin/change', { method: 'POST', body: JSON.stringify({ currentPin, newPin }) }),
};

export async function logout() {
  try { await apiRequest('/logout', { method: 'POST' }); } catch {}
  localStorage.removeItem('token');
}
