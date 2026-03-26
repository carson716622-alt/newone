import { nanoid } from 'nanoid';

export interface Job {
  id: string;
  title: string;
  department: string;
  city: string;
  state: string;
  zip: string;
  type: string;
  category: string;
  overview: string;
  requirements: string;
  salary: string;
  applyUrl: string;
  website: string;
  postedDate: string;
  expiresDate: string;
  status: 'active' | 'pending' | 'expired' | 'rejected';
  views: number;
  clicks: number;
  rejectionReason?: string;
  isFeatured?: boolean;
}

const STORAGE_KEY = 'applytoblue_jobs';

// Initial dummy data
const INITIAL_JOBS: Job[] = [
  {
    id: '1',
    title: 'Police Officer (Entry-Level)',
    department: 'Chicago Police Department',
    city: 'Chicago',
    state: 'IL',
    zip: '60653',
    type: 'Full-time',
    category: 'Police',
    overview: '<p>Protect and serve the diverse communities of Chicago. Join one of the nation\'s largest police departments with a rich history of public service and community engagement.</p>',
    requirements: '<p>Must be 21 years of age...</p>',
    salary: '$72,000 - $98,000',
    applyUrl: 'https://www.chicago.gov/city/en/depts/cpd.html',
    website: 'https://www.chicago.gov/city/en/depts/cpd.html',
    postedDate: '2025-10-12',
    expiresDate: '2025-11-12',
    status: 'active',
    views: 1245,
    clicks: 342
  },
  {
    id: '2',
    title: 'Lateral Police Officer',
    department: 'Chicago Police Department',
    city: 'Chicago',
    state: 'IL',
    zip: '60653',
    type: 'Full-time',
    category: 'Police',
    overview: '<p>Experienced officers needed...</p>',
    requirements: '<p>Current certification required...</p>',
    salary: '$85,000 - $105,000',
    applyUrl: 'https://www.chicago.gov/city/en/depts/cpd.html',
    website: 'https://www.chicago.gov/city/en/depts/cpd.html',
    postedDate: '2025-10-15',
    expiresDate: '2025-11-15',
    status: 'pending',
    views: 0,
    clicks: 0
  },
  {
    id: '3',
    title: 'Community Service Officer',
    department: 'Chicago Police Department',
    city: 'Chicago',
    state: 'IL',
    zip: '60653',
    type: 'Part-time',
    category: 'Civilian',
    overview: '<p>Support role for the department...</p>',
    requirements: '<p>High school diploma...</p>',
    salary: '$22.50/hr',
    applyUrl: 'https://www.chicago.gov/city/en/depts/cpd.html',
    website: 'https://www.chicago.gov/city/en/depts/cpd.html',
    postedDate: '2025-09-01',
    expiresDate: '2025-10-01',
    status: 'expired',
    views: 890,
    clicks: 156
  }
];

export const jobService = {
  getAllJobs: (): Job[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_JOBS));
      return INITIAL_JOBS;
    }
    return JSON.parse(stored);
  },

  getPublicJobs: (): Job[] => {
    const jobs = jobService.getAllJobs();
    return jobs.filter(job => job.status === 'active');
  },

  getAgencyJobs: (departmentName: string): Job[] => {
    // For demo purposes, we'll return all jobs if department matches or if it's the demo user
    // In a real app, this would filter by agency ID
    return jobService.getAllJobs(); 
  },

  addJob: (jobData: Omit<Job, 'id' | 'status' | 'views' | 'clicks' | 'postedDate'>): Job => {
    const jobs = jobService.getAllJobs();
    const newJob: Job = {
      ...jobData,
      id: nanoid(),
      status: 'pending',
      isFeatured: false,
      views: 0,
      clicks: 0,
      postedDate: new Date().toISOString().split('T')[0]
    };
    
    jobs.unshift(newJob);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return newJob;
  },

  updateJobStatus: (id: string, status: Job['status'], reason?: string): void => {
    const jobs = jobService.getAllJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
      jobs[index].status = status;
      if (reason) {
        jobs[index].rejectionReason = reason;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }
  },

  incrementViews: (id: string): void => {
    const jobs = jobService.getAllJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
      jobs[index].views += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }
  },
  
  incrementClicks: (id: string): void => {
    const jobs = jobService.getAllJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
      jobs[index].clicks += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }
  },

  getJobById: (id: string): Job | undefined => {
    const jobs = jobService.getAllJobs();
    return jobs.find((job) => job.id === id);
  },

  updateJobFeatured: (id: string, isFeatured: boolean): void => {
    const jobs = jobService.getAllJobs();
    const index = jobs.findIndex((j) => j.id === id);
    if (index !== -1) {
      jobs[index].isFeatured = isFeatured;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }
  },

  deleteJob: (id: string): void => {
    const jobs = jobService.getAllJobs();
    const updated = jobs.filter((job) => job.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};
