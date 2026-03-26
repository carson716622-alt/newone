import { nanoid } from 'nanoid';

export interface AgencyProfile {
  id: string;
  departmentName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  numberOfOfficers: number;
  logo?: string; // Base64 or URL
  createdAt: string;
}

export interface AgencyAccount {
  id: string;
  agencyId: string;
  email: string;
  password: string; // In real app, this would be hashed
  name: string;
  role: 'hr' | 'admin';
  createdAt: string;
}

export interface AdminAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface CandidateAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface AuthSession {
  type: 'agency' | 'admin' | 'candidate';
  userId: string;
  agencyId?: string;
  email: string;
  name: string;
  token: string;
  expiresAt: number;
}

const AGENCIES_KEY = 'applytoblue_agencies';
const AGENCY_ACCOUNTS_KEY = 'applytoblue_agency_accounts';
const ADMIN_ACCOUNTS_KEY = 'applytoblue_admin_accounts';
const CANDIDATE_ACCOUNTS_KEY = 'applytoblue_candidate_accounts';
const SESSION_KEY = 'applytoblue_session';

// Default admin accounts
const DEFAULT_ADMINS: AdminAccount[] = [
  {
    id: 'admin-001',
    email: 'admin@applytoblue.com',
    password: 'AdminPassword123!', // In production, use hashed passwords
    name: 'ApplytoBlue Admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'admin-002',
    email: 'carson716622@gmail.com',
    password: 'carson123', // Simple password for testing
    name: 'Carson - Site Admin',
    createdAt: new Date().toISOString()
  }
];

export const authService = {
  // Initialize default data
  initialize: () => {
    if (!localStorage.getItem(AGENCIES_KEY)) {
      localStorage.setItem(AGENCIES_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(AGENCY_ACCOUNTS_KEY)) {
      localStorage.setItem(AGENCY_ACCOUNTS_KEY, JSON.stringify([]));
    }
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(DEFAULT_ADMINS));
    if (!localStorage.getItem(CANDIDATE_ACCOUNTS_KEY)) {
      localStorage.setItem(CANDIDATE_ACCOUNTS_KEY, JSON.stringify([]));
    }
  },

  // Get current session
  getCurrentSession: (): AuthSession | null => {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    
    const parsed = JSON.parse(session);
    // Check if session has expired
    if (parsed.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    return parsed;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // ========== AGENCY REGISTRATION & LOGIN ==========
  registerAgency: (
    departmentName: string,
    address: string,
    phone: string,
    email: string,
    website: string,
    numberOfOfficers: number,
    adminName: string,
    password: string,
    logo?: string
  ): { success: boolean; message: string; agencyId?: string } => {
    // Check if email already exists
    const accounts = JSON.parse(localStorage.getItem(AGENCY_ACCOUNTS_KEY) || '[]') as AgencyAccount[];
    if (accounts.some(acc => acc.email === email)) {
      return { success: false, message: 'Email already registered' };
    }

    // Create agency profile
    const agencyId = nanoid();
    const agency: AgencyProfile = {
      id: agencyId,
      departmentName,
      address,
      phone,
      email,
      website,
      numberOfOfficers,
      logo,
      createdAt: new Date().toISOString()
    };

    // Create agency account
    const account: AgencyAccount = {
      id: nanoid(),
      agencyId,
      email,
      password, // In production, hash this
      name: adminName,
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    // Save to storage
    const agencies = JSON.parse(localStorage.getItem(AGENCIES_KEY) || '[]') as AgencyProfile[];
    agencies.push(agency);
    localStorage.setItem(AGENCIES_KEY, JSON.stringify(agencies));

    accounts.push(account);
    localStorage.setItem(AGENCY_ACCOUNTS_KEY, JSON.stringify(accounts));

    return { success: true, message: 'Agency registered successfully', agencyId };
  },

  loginAgency: (email: string, password: string): { success: boolean; message: string; session?: AuthSession } => {
    const accounts = JSON.parse(localStorage.getItem(AGENCY_ACCOUNTS_KEY) || '[]') as AgencyAccount[];
    const account = accounts.find(acc => acc.email === email && acc.password === password);

    if (!account) {
      return { success: false, message: 'Invalid email or password' };
    }

    const session: AuthSession = {
      type: 'agency',
      userId: account.id,
      agencyId: account.agencyId,
      email: account.email,
      name: account.name,
      token: nanoid(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, message: 'Login successful', session };
  },

  getAgencyProfile: (agencyId: string): AgencyProfile | null => {
    const agencies = JSON.parse(localStorage.getItem(AGENCIES_KEY) || '[]') as AgencyProfile[];
    return agencies.find(a => a.id === agencyId) || null;
  },

  updateAgencyProfile: (agencyId: string, updates: Partial<AgencyProfile>): boolean => {
    const agencies = JSON.parse(localStorage.getItem(AGENCIES_KEY) || '[]') as AgencyProfile[];
    const index = agencies.findIndex(a => a.id === agencyId);
    if (index === -1) return false;

    agencies[index] = { ...agencies[index], ...updates };
    localStorage.setItem(AGENCIES_KEY, JSON.stringify(agencies));
    return true;
  },

  // ========== ADMIN LOGIN ==========
  loginAdmin: (email: string, password: string): { success: boolean; message: string; session?: AuthSession } => {
    const admins = JSON.parse(localStorage.getItem(ADMIN_ACCOUNTS_KEY) || '[]') as AdminAccount[];
    const admin = admins.find(a => a.email === email && a.password === password);

    if (!admin) {
      return { success: false, message: 'Invalid admin credentials' };
    }

    const session: AuthSession = {
      type: 'admin',
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      token: nanoid(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, message: 'Admin login successful', session };
  },

  // ========== CANDIDATE LOGIN & REGISTRATION ==========
  registerCandidate: (
    name: string,
    email: string,
    password: string
  ): { success: boolean; message: string } => {
    const candidates = JSON.parse(localStorage.getItem(CANDIDATE_ACCOUNTS_KEY) || '[]') as CandidateAccount[];
    if (candidates.some(c => c.email === email)) {
      return { success: false, message: 'Email already registered' };
    }

    const candidate: CandidateAccount = {
      id: nanoid(),
      email,
      password,
      name,
      createdAt: new Date().toISOString()
    };

    candidates.push(candidate);
    localStorage.setItem(CANDIDATE_ACCOUNTS_KEY, JSON.stringify(candidates));
    return { success: true, message: 'Candidate account created successfully' };
  },

  loginCandidate: (email: string, password: string): { success: boolean; message: string; session?: AuthSession } => {
    const candidates = JSON.parse(localStorage.getItem(CANDIDATE_ACCOUNTS_KEY) || '[]') as CandidateAccount[];
    const candidate = candidates.find(c => c.email === email && c.password === password);

    if (!candidate) {
      return { success: false, message: 'Invalid email or password' };
    }

    const session: AuthSession = {
      type: 'candidate',
      userId: candidate.id,
      email: candidate.email,
      name: candidate.name,
      token: nanoid(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, message: 'Login successful', session };
  }
};

// Initialize on load
authService.initialize();

// Initialize demo data if needed
if (typeof window !== 'undefined') {
  import('./demoData').then(demoModule => {
    demoModule.initializeDemoAccounts();
  }).catch(() => {
    // Demo data module not available
  });
}
