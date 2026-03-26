import { authService } from './authService';

export function initializeDemoAccounts() {
  // Register demo agencies
  const agencies = [
    {
      departmentName: 'Chicago Police Department',
      address: '3510 S. Michigan Ave, Chicago, IL 60653',
      phone: '(312) 555-0100',
      email: 'hr@cpd.chicago.gov',
      website: 'https://www.chicago.gov/city/en/depts/cpd.html',
      numberOfOfficers: 13500,
      adminName: 'Commander James Mitchell',
      password: 'Demo@1234'
    },

    {
      departmentName: 'Cook County Sheriff\'s Office',
      address: '69 W. Washington St, Chicago, IL 60602',
      phone: '(312) 555-0789',
      email: 'hr@cookcountysheriff.gov',
      website: 'https://cookcountysheriff.gov',
      numberOfOfficers: 6200,
      adminName: 'Jennifer Martinez',
      password: 'Demo@1234'
    }
  ];

  // Check if demo data already exists
  const existingAccounts = JSON.parse(localStorage.getItem('applytoblue_agency_accounts') || '[]');
  if (existingAccounts.length > 0) {
    return; // Demo data already initialized
  }

  // Register each agency
  agencies.forEach(agency => {
    authService.registerAgency(
      agency.departmentName,
      agency.address,
      agency.phone,
      agency.email,
      agency.website,
      agency.numberOfOfficers,
      agency.adminName,
      agency.password
    );
  });

  // Register demo candidates (carson716622@gmail.com is reserved for admin)
  const candidates = [
    { name: 'John Smith', email: 'john.smith@email.com', password: 'Candidate@123' },
    { name: 'Maria Garcia', email: 'maria.garcia@email.com', password: 'Candidate@123' },
    { name: 'David Lee', email: 'david.lee@email.com', password: 'Candidate@123' }
  ];

  candidates.forEach(candidate => {
    authService.registerCandidate(candidate.name, candidate.email, candidate.password);
  });

  // Prevent carson716622@gmail.com from being registered as candidate
  // It's reserved for admin use only
  const candidateAccounts = JSON.parse(localStorage.getItem('applytoblue_candidate_accounts') || '[]');
  const filtered = candidateAccounts.filter((c: any) => c.email !== 'carson716622@gmail.com');
  localStorage.setItem('applytoblue_candidate_accounts', JSON.stringify(filtered));

}
