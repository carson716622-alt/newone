# ApplytoBlue Deployment Notes

## Current Status

The ApplytoBlue job board platform is ready for VPS deployment. All core features have been implemented and tested.

## What's Included

### Authentication System
- **Site Admins**: Custom admin login with database authentication
- **Agencies**: Department registration and admin login
- **Candidates**: Candidate signup and login
- **Security**: All passwords hashed with bcryptjs (10 salt rounds)

### Job Management
- **Job Posting**: Agencies can post jobs through dashboard
- **Admin Approval**: Site admins review and approve/reject jobs
- **Browse Jobs**: Public job listing page with approved jobs only
- **Job Applications**: Candidates can apply for positions
- **Notifications**: Email notifications for approvals/rejections

### Database
- **MySQL/TiDB**: 8 tables for complete job board functionality
- **Migrations**: All schema changes tracked in `drizzle/migrations/`
- **Query Helpers**: Comprehensive database functions in `server/db.ts`

### Backend API
- **tRPC**: Type-safe API endpoints for all features
- **Endpoints**: Authentication, jobs, applications, notifications, job views
- **Error Handling**: Proper error messages and status codes

## Build & Deployment

### Production Build
```bash
pnpm build
```

This creates:
- `dist/` - Built backend server
- `client/dist/` - Built frontend assets

### Environment Variables
All required environment variables are documented in `VPS_DEPLOYMENT_GUIDE.md`.

Key variables:
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `NODE_ENV` - Set to "production"

### Database Setup
```bash
pnpm db:push
```

This runs all migrations and creates the database schema.

## Performance Considerations

1. **Database Indexing**: All frequently queried fields are indexed
2. **API Optimization**: tRPC with superjson for efficient serialization
3. **Static Assets**: Images hosted on CDN (not in project)
4. **Caching**: Implement Redis for session caching if needed

## Security Checklist

- [x] Password hashing implemented (bcryptjs)
- [x] Environment variables for secrets
- [x] Database schema with proper constraints
- [x] Input validation on all endpoints
- [x] Error handling without exposing internals
- [ ] Rate limiting (recommended for production)
- [ ] CORS configuration (review in production)
- [ ] SQL injection prevention (using Drizzle ORM)
- [ ] XSS prevention (React escaping)
- [ ] CSRF protection (review session handling)

## Recommended Production Setup

### Server Requirements
- **OS**: Ubuntu 22.04 LTS or similar
- **Node.js**: 22+ (LTS)
- **MySQL**: 8.0+ or TiDB
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB (depends on usage)

### Process Manager
Use PM2 for process management:
```bash
pm2 start dist/index.js --name "applytoblue"
pm2 startup
pm2 save
```

### Reverse Proxy
Use Nginx for reverse proxy and SSL:
- Port 80 → 443 (HTTP to HTTPS redirect)
- Port 443 → 3000 (HTTPS to application)

### SSL Certificate
Use Let's Encrypt for free SSL:
```bash
certbot --nginx -d yourdomain.com
```

## Monitoring & Maintenance

### Health Checks
```bash
curl https://yourdomain.com/api/trpc/auth.me
```

### Database Backups
```bash
mysqldump -u user -p database > backup.sql
```

### Log Monitoring
- Application: `pm2 logs applytoblue`
- Nginx: `/var/log/nginx/`
- MySQL: `/var/log/mysql/`

## Known Limitations & Future Enhancements

### Current Limitations
1. Email notifications use mock service (implement real email provider)
2. File uploads limited to base64 encoding (implement S3 for production)
3. No rate limiting on API endpoints
4. No user activity logging

### Recommended Enhancements
1. **Email Service**: Integrate SendGrid, Mailgun, or AWS SES
2. **File Storage**: Use AWS S3 or similar for logo/document uploads
3. **Search**: Add Elasticsearch for job search functionality
4. **Analytics**: Track job views, applications, conversion rates
5. **Admin Dashboard**: Add analytics and reporting features
6. **Two-Factor Authentication**: Implement 2FA for admin accounts
7. **API Rate Limiting**: Prevent abuse with rate limiting
8. **Caching**: Add Redis for session and data caching

## Troubleshooting

### Application Won't Start
1. Check Node.js version: `node --version`
2. Check dependencies: `pnpm install`
3. Check environment variables: `cat .env.production`
4. Check logs: `pm2 logs applytoblue`

### Database Connection Error
1. Verify MySQL is running: `systemctl status mysql`
2. Test connection: `mysql -u user -p database`
3. Check DATABASE_URL format
4. Verify user permissions

### Port Already in Use
1. Find process: `lsof -i :3000`
2. Kill process: `kill -9 <PID>`
3. Or change port in application

## Support & Documentation

- **Full Guide**: See `VPS_DEPLOYMENT_GUIDE.md`
- **Database Schema**: See `drizzle/schema.ts`
- **API Routes**: See `server/routers.ts`
- **Frontend Pages**: See `client/src/pages/`

## Version Information

- **Project**: ApplytoBlue v1.0.0
- **Node**: 22.13.0
- **React**: 19
- **TypeScript**: 5.9.3
- **Framework**: Express + tRPC + Vite
- **Database**: MySQL/TiDB with Drizzle ORM

---

**Last Updated**: March 25, 2026
**Ready for Deployment**: Yes ✅
