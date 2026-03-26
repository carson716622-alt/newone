# ApplytoBlue VPS Deployment Guide

This guide provides step-by-step instructions for deploying ApplytoBlue to a VPS (Virtual Private Server).

## Pre-Deployment Checklist

### Environment & Dependencies
- [ ] Node.js 22+ installed on VPS
- [ ] MySQL/MariaDB database server running
- [ ] pnpm package manager installed
- [ ] Git installed for version control
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] Nginx or Apache web server configured

### Application Configuration
- [ ] All environment variables defined in `.env.production`
- [ ] Database migrations run successfully (`pnpm db:push`)
- [ ] Build tested locally (`pnpm build`)
- [ ] All tests passing (`pnpm test`)

## Environment Variables Required

Create a `.env.production` file with the following variables:

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/applytoblue

# Authentication
JWT_SECRET=your-secure-random-secret-key-here

# OAuth (if using Manus OAuth)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Owner Information
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# Application
VITE_APP_TITLE=ApplytoBlue
VITE_APP_LOGO=https://your-domain.com/logo.png

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

## VPS Setup Steps

### 1. Connect to VPS
```bash
ssh root@your-vps-ip
```

### 2. Update System
```bash
apt update && apt upgrade -y
```

### 3. Install Node.js and pnpm
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs
npm install -g pnpm
```

### 4. Install MySQL
```bash
apt install -y mysql-server
mysql_secure_installation
```

### 5. Create Database
```bash
mysql -u root -p
CREATE DATABASE applytoblue;
CREATE USER 'applytoblue'@'localhost' IDENTIFIED BY 'strong-password-here';
GRANT ALL PRIVILEGES ON applytoblue.* TO 'applytoblue'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 6. Clone Repository
```bash
cd /var/www
git clone https://github.com/your-repo/applytoblue-website.git
cd applytoblue-website
```

### 7. Install Dependencies
```bash
pnpm install
```

### 8. Configure Environment
```bash
cp .env.example .env.production
nano .env.production
# Edit with your production values
```

### 9. Run Database Migrations
```bash
pnpm db:push
```

### 10. Build Application
```bash
pnpm build
```

### 11. Setup PM2 for Process Management
```bash
npm install -g pm2
pm2 start dist/index.js --name "applytoblue"
pm2 startup
pm2 save
```

### 12. Configure Nginx Reverse Proxy
```bash
nano /etc/nginx/sites-available/applytoblue
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/applytoblue /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 13. Setup SSL with Let's Encrypt
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 14. Setup Firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Post-Deployment Verification

### Check Application Status
```bash
pm2 status
pm2 logs applytoblue
```

### Test Database Connection
```bash
mysql -u applytoblue -p applytoblue -e "SELECT 1;"
```

### Test API Endpoints
```bash
curl https://your-domain.com/api/trpc/auth.me
```

### Monitor Performance
```bash
pm2 monit
```

## Maintenance

### Regular Backups
```bash
# Database backup
mysqldump -u applytoblue -p applytoblue > backup-$(date +%Y%m%d).sql

# Application backup
tar -czf applytoblue-backup-$(date +%Y%m%d).tar.gz /var/www/applytoblue-website
```

### Update Application
```bash
cd /var/www/applytoblue-website
git pull origin main
pnpm install
pnpm build
pm2 restart applytoblue
```

### Monitor Logs
```bash
# Application logs
pm2 logs applytoblue

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# MySQL logs
tail -f /var/log/mysql/error.log
```

## Security Best Practices

1. **Keep System Updated**: Run `apt update && apt upgrade` regularly
2. **Use Strong Passwords**: All database and admin passwords should be strong
3. **Enable Firewall**: Only allow necessary ports (22, 80, 443)
4. **Use HTTPS**: Always use SSL/TLS certificates
5. **Regular Backups**: Backup database and application regularly
6. **Monitor Logs**: Check logs regularly for suspicious activity
7. **Update Dependencies**: Keep npm packages updated with `pnpm update`
8. **Limit API Access**: Implement rate limiting for API endpoints
9. **Use Environment Variables**: Never commit secrets to version control
10. **Enable 2FA**: For admin accounts, consider enabling 2FA

## Troubleshooting

### Application Won't Start
```bash
pm2 logs applytoblue
# Check for errors in logs
```

### Database Connection Error
```bash
# Test connection
mysql -u applytoblue -p applytoblue -e "SELECT 1;"
# Check DATABASE_URL in .env.production
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill process if needed
kill -9 <PID>
```

### SSL Certificate Issues
```bash
# Renew certificate
certbot renew --dry-run
certbot renew
```

## Support & Resources

- **Documentation**: See README.md for feature documentation
- **Issues**: Report bugs on GitHub
- **Community**: Join our Discord community for support
- **Database**: MySQL documentation at https://dev.mysql.com/doc/

## Rollback Procedure

If deployment fails:

1. Stop the application: `pm2 stop applytoblue`
2. Restore from backup: `git checkout previous-commit`
3. Restore database: `mysql applytoblue < backup-file.sql`
4. Rebuild: `pnpm install && pnpm build`
5. Restart: `pm2 restart applytoblue`

---

**Last Updated**: March 25, 2026
**Version**: 1.0.0
