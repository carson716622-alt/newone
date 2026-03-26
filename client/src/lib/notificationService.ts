export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed';
  timestamp: string;
  type: 'approval' | 'rejection';
}

class NotificationService {
  private logs: EmailLog[] = [];
  private listeners: ((logs: EmailLog[]) => void)[] = [];

  // Simulate sending an approval email
  async sendApprovalEmail(agencyEmail: string, jobTitle: string): Promise<boolean> {
    const subject = `Job Posting Approved: ${jobTitle}`;
    const body = `
      Dear Agency Partner,

      Great news! Your job posting for "${jobTitle}" has been approved by the ApplytoBlue team.
      
      It is now live on our platform and visible to thousands of qualified candidates.
      
      You can view and manage your listing in the Agency Portal.

      Best regards,
      The ApplytoBlue Team
    `;

    return this.simulateSend(agencyEmail, subject, body, 'approval');
  }

  // Simulate sending a rejection email
  async sendRejectionEmail(agencyEmail: string, jobTitle: string, reason: string): Promise<boolean> {
    const subject = `Action Required: Job Posting for ${jobTitle}`;
    const body = `
      Dear Agency Partner,

      Thank you for submitting your job posting for "${jobTitle}".
      
      Unfortunately, we are unable to approve it at this time due to the following reason:
      
      "${reason}"
      
      Please log in to the Agency Portal to update your submission or contact our support team for assistance.

      Best regards,
      The ApplytoBlue Team
    `;

    return this.simulateSend(agencyEmail, subject, body, 'rejection');
  }

  private async simulateSend(to: string, subject: string, body: string, type: 'approval' | 'rejection'): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const newLog: EmailLog = {
      id: Math.random().toString(36).substr(2, 9),
      to,
      subject,
      body: body.trim(),
      status: 'sent',
      timestamp: new Date().toLocaleString(),
      type
    };

    this.logs = [newLog, ...this.logs];
    this.notifyListeners();
    
    console.log(`[Email Service] Sent ${type} email to ${to}`);
    return true;
  }

  getLogs(): EmailLog[] {
    return this.logs;
  }

  subscribe(listener: (logs: EmailLog[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs));
  }
}

export const notificationService = new NotificationService();
