# NMS Dashboard - Network Management System

A comprehensive, modern web-based **Network Management System (NMS)** dashboard with advanced security features, real-time monitoring, and firewall simulation capabilities.

## New in 1.1.0 (Jan 8, 2026)
- Network Health view with ping tests, live OpenSpeedTest modal, and in-app CLI terminal for common network commands
- Wireless scanner with sortable/filterable results and optional auto-scan range
- Syslog viewer with severity/device/search filters plus real-time stream
- Config backup/restore history with JSON export, firmware repository upload/download, and maintenance window scheduling
- Device grouping/tags for bulk visibility and a richer user/role manager (add, edit, disable, protect admin)
- Audit log viewer with one-click clear and in-app feedback/report issue entry point

### UI polish (Jan 8, 2026)
- Light-mode network topology now uses high-contrast backgrounds and strokes for readability
- Dropdowns restyled (light/dark) and global scrollbars hidden while keeping scroll behavior
- Device Groups modal and Groups/Policies panels keep the form fixed while lists scroll independently
- Charts enforce a minimum height to avoid zero-dimension Recharts warnings

## 🌟 Features

### 🔐 **Security & Authentication**
- **Multi-Factor Authentication (MFA)** with TOTP (Time-based One-Time Password)
- **HMAC-SHA1 based 2FA** with ±60 second time drift tolerance
- **User-scoped MFA storage** (separate for admin and viewer roles)
- **Brute force protection**: 4-attempt limit with 15-minute lockout
- **Inspect/Tampering Prevention**: Right-click disabled, DevTools blocked, detection enabled
- **Anti-embedding security**: X-Frame-Options and CSP headers
- **Password strength meter** with 5-level validation
- **Secure password reset utility** via console
- **Admin user locking** to prevent race conditions

### 📊 **Dashboard & Monitoring**
- Real-time statistics dashboard with device counts and alerts
- **Network Topology Map** with SVG visualization, animated packets, and device status
- Hover tooltips showing device mapping
- Real-time device synchronization
- **Network Health Suite**: ping tests to 8.8.8.8, live speed test modal, and interactive CLI terminal

### 🖥️ **Device Management**
- Switch Management (ports, VLANs, statistics)
- Router Management (BGP, routing tables)
- Server Management (services, performance metrics)
- Firewall Rule Management
- Wireless AP Monitoring
- DNS Record Management
- Device groups/tags for organizing assets

### 🛡️ **Advanced Access Control (ACL)**
- **Access Rules** - Firewall rules with hit counters
- **Address Reservation** - DHCP IP reservation
- **Blacklist** - Block IP/MAC addresses
- **Whitelist** - Allow-list devices
- **Parental Control** - Website blocking & time limits
- **QoS** - Bandwidth prioritization with preset options

### 🎨 **User Interface**
- Dark/Light theme toggle (moon icon in navbar & login)
- Responsive design (xs/sm/md/lg/xl breakpoints)
- Glass-morphism design with cyan/blue accents
- Welcome modal for first-time users
- Real-time clock with timezone support
- Mobile-optimized layout
- Feedback modal for reporting issues from header or login

### 📈 **Analytics & Health**
- Network Health View with yearly bandwidth trends
- Speed test capability
- Performance graphs using Recharts
- Historical data tracking
- Real-time syslog viewer with filters

### 👥 **Role-Based Access Control**
- Admin: Full access
- Viewer: Read-only mode with "READ-ONLY" badge
- In-app user manager to add/edit/disable users (admin protected)

## 🛠️ **Tech Stack**

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.1.1 | UI Framework |
| Vite | 7.3.0 | Build & Dev Server |
| Tailwind CSS | 3.4.17 | Styling |
| Recharts | 3.6.0 | Data Visualization |
| Web Crypto API | Native | TOTP & Security |

## 📦 **Installation**

### Prerequisites
- Node.js v16+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Development: http://localhost:5173
Production: `dist/` directory

## 🔑 **Default Credentials**

> ⚠️ Change immediately after first login!

- **Username**: admin
- **Password**: admin
- **MFA**: Generated on first login

## 🚀 **Usage**

### Login Flow
1. Enter credentials (admin/admin)
2. Complete MFA verification
3. Access dashboard

### Navigation
- **Sidebar**: Switch views
- **Header**: Access alerts, feedback, profile, theme
- **Mobile**: Hamburger menu for sidebar

### Managing Devices
- Dashboard: Statistics & topology
- Switches: Ports, VLANs, statistics
- Routers: BGP neighbors, routing
- Servers: Services, performance
- Wireless: APs, connected devices
- Firewalls: Rules & policies
- DNS: Records management

### ACL Management
1. Go to **Access Control & Network Management**
2. Select feature tab
3. **Add**: Create new entry
4. **Edit**: Modify entry
5. **Delete**: Remove entry
6. **Toggle**: Enable/disable

### Password Management
- **Change**: Profile → Change Password
- **Reset** (console):
  ```javascript
  resetAdminPassword('newPassword123')
  ```

## 🎯 **Key Features**

### TOTP Authentication
- 6-digit codes (30-second refresh)
- ±60 second time drift tolerance
- User-scoped secrets
- HMAC-SHA1 implementation

### Network Topology
- 8 network nodes
- Status colors: 🟢 Online, 🟡 Warning, 🔴 Offline
- Device mapping on hover
- Real-time sync

### Security Headers
- X-Frame-Options: Allow only `https://adityaraj3136.github.io/`
- Content-Security-Policy: Restrict frame ancestors
- Protection against unauthorized embedding

## 📱 **Responsive Design**

| Breakpoint | Width | Device |
|-----------|-------|--------|
| xs | 0px | Mobile |
| sm | 640px | Tablet |
| md | 768px | Tablet+ |
| lg | 1024px | Desktop |
| xl | 1280px | Large Desktop |

## 🔒 **Security**

### Best Practices
1. Change default credentials immediately
2. Enable MFA for all accounts
3. Use HTTPS in production
4. Backup configuration regularly
5. Monitor failed login attempts
6. Update passwords periodically

### Features
- ✅ Right-click prevention
- ✅ DevTools blocking
- ✅ Window size detection
- ✅ Secure localStorage
- ✅ User-scoped data isolation
- ✅ Maintenance mode scheduling to prevent conflicts during changes

## 🎨 **Theme System**

- **Dark Mode** (default): Low-light environments
- **Light Mode**: Bright environments
- Toggle via moon icon in navbar or login
- Persisted in localStorage

## 📊 **Data Storage**

Client-side localStorage stores:
- User credentials & sessions
- MFA secrets
- Theme preference
- Audit logs
- ACL rules

> Integrate with backend database for production

## 🛠️ **Operations & Maintenance**
- Configuration backup/restore history with JSON export per device
- Firmware repository (upload/download/delete) with metadata
- Maintenance window scheduler per device
- Device grouping/tagging for bulk visibility
- Network CLI terminal for quick checks

## 🐛 **Troubleshooting**

### MFA Issues
- Clear cache & localStorage
- Sync system time
- Verify TOTP secret saved

### DevTools Blocked
- Intentional security feature
- Use `resetAdminPassword()` in console
- Contact admin for access

### Theme Not Saving
- Enable localStorage
- Avoid clearing on exit
- Test in normal (non-private) mode

## 📝 **Audit Logs**

Events logged:
- Login attempts
- MFA verification
- Password resets
- ACL modifications
- Device changes
- Settings updates
- Syslog stream events (viewed in in-app syslog modal)

## 🤝 **Support**

- **Feedback**: https://adityaraj3136.github.io/contact/
- **GitHub**: @adityaraj3136
- **Email**: info.adityaraj3136@gmail.com

## 📄 **License**

Created by **Aditya Raj** for network management simulation.

## ✨ **Made with ❤️**

Built with modern web technologies and security best practices.

---

**Version**: 1.1.0 | **Updated**: January 8, 2026
