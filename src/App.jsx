import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BarChart, LineChart, PieChart, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

// --- Prevent Inspect/Tampering ---
(() => {
    // Disable right-click context menu
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+Shift+K
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.shiftKey && e.key === 'K')) {
            e.preventDefault();
        }
    });
    
    // Detect DevTools opening via window size
    let devtoolsDetected = false;
    setInterval(() => {
        const threshold = 160;
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtoolsDetected) {
                devtoolsDetected = true;
                // Log warning for admin purposes only
                if (localStorage.getItem('nms_session_active')) {
                    // DevTools access detected
                }
            }
        } else {
            devtoolsDetected = false;
        }
    }, 500);
})();

// --- Password Reset Utility (Console Access) ---
// Usage in browser console: resetAdminPassword('newPassword123')
window.resetAdminPassword = function(newPassword) {
    if (!newPassword || newPassword.length < 6) {
        console.error('❌ Password must be at least 6 characters long');
        return false;
    }
    
    try {
        const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
        const adminIndex = systemUsers.findIndex(u => u.username === 'admin');
        
        if (adminIndex === -1) {
            console.error('❌ Admin user not found');
            return false;
        }
        
        systemUsers[adminIndex].password = newPassword;
        systemUsers[adminIndex].lastLogin = new Date().toISOString();
        localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
        
        console.log('✅ Admin password reset successfully!');
        console.log('Username: admin');
        console.log('New Password: ' + newPassword);
        console.log('Email: adityaraj3136@gmail.com');
        console.log('\n⚠️  Please reload the page and login with new credentials');
        return true;
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        return false;
    }
};

// --- Helper Components & Functions ---

const formatUptime = (bootTime) => {
  if (!bootTime) return 'N/A';
  const diffMs = new Date() - new Date(bootTime);

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const randomBootTime = (maxDaysAgo) => new Date(Date.now() - Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000);

// Icon component from lucide-react (or similar) - Inlined for simplicity
const Icon = ({ name, className }) => {
  const icons = {
    dashboard: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    switch: <path d="M16 3h-2a4 4 0 0 0-8 0H4a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a1 1 0 0 0-1-1zM6 7v10M10 7v10M14 7v10M18 7v10" />,
    router: <path d="M20 10.59V8.5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2.09a2.5 2.5 0 0 1 0 4.82V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.59a2.5 2.5 0 0 1 0-4.82zM6 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm14-1a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />,
    server: <><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6" y1="6" y2="6"/><line x1="6" x2="6" y1="18" y2="18"/></>,
    wifi: <><path d="M5 12.55a8 8 0 0 1 14 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M8.5 16.42a4 4 0 0 1 7 0"/><circle cx="12" cy="20" r="1"/></>,
    dns: <path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.17-6.84-9.5c-.52-.17-.86.42-.64.91c.54 1.21.84 2.53.84 3.91c0 4.42-3.58 8-8 8s-8-3.58-8-8c0-1.38.3-2.7.84-3.91c.22-.49-.12-1.08-.64-.91C6.87 3.83 4 7.58 4 12a8 8 0 0 0 8 8z"/>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>,
    cpu: <><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M20 15h2M9 2v2M9 20v2M2 9h2M20 9h2"/></>,
    alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
    network: <><circle cx="12" cy="12" r="2"/><path d="M12 2a10 10 0 0 0-9.4 14.2"/><path d="M21.4 16.2A10 10 0 0 0 12 2"/><path d="m16.2 21.4a10 10 0 0 0 5.2-5.2"/><path d="M2.6 7.8a10 10 0 0 0 5.2 13.6"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>,
    menu: <><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></>,
    x: <><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    chevronUp: <path d="m18 15-6-6-6 6"/>,
    chevronDown: <path d="m6 9 6 6 6-6"/>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    shieldCheck: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    arrowUp: <><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></>,
    arrowDown: <><path d="m5 7 7 7 7-7"/><path d="M12 5v14"/></>,
    sparkles: <><path d="m12 3-1.9 1.9-1.9-1.9-1.9 1.9-1.9-1.9L3 3l1.9 1.9L3 6.8l1.9-1.9L6.8 6.8l-1.9 1.9L6.8 10l1.9-1.9L10 10l-1.9-1.9L10 6.8l1.9 1.9L12 10l-1.9-1.9L12 3zM21 12l-1.9 1.9-1.9-1.9-1.9 1.9-1.9-1.9-1.9 1.9 1.9 1.9-1.9 1.9 1.9-1.9 1.9 1.9-1.9 1.9 1.9-1.9 1.9-1.9 1.9 1.9-1.9 1.9z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    thermometer: <><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></>,
    fan: <><path d="M10.5 2c.3 0 .6.1.8.3l1.4 1.4c.4.4.4 1 0 1.4-.4.4-1 .4-1.4 0L10 3.8V2.4c0-.2.2-.4.5-.4z"/><path d="M12 6 10 4M12 18l-2 2M6 12l-2-2M18 12l2 2"/><circle cx="12" cy="12" r="3"/></>,
    power: <><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></>,
    gauge: <><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
  };
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icons[name] || <circle cx="12" cy="12" r="10" />}</svg>;
};

const GlassPanel = ({ children, className = '', ...props }) => (
  <div className={`bg-white/60 dark:bg-black/20 backdrop-blur-md border border-cyan-500/20 dark:border-cyan-300/20 rounded-2xl shadow-lg shadow-cyan-500/10 ${className}`} {...props}>
    {children}
  </div>
);

const GlowingBorder = ({ children, className = '', ...props }) => (
  <div className={`relative p-px rounded-2xl group transition-all duration-300 hover:shadow-cyan-500/30 hover:shadow-2xl ${className}`} {...props}>
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
    <div className="relative bg-gray-200/80 dark:bg-gray-900/80 rounded-[15px] h-full">
      {children}
    </div>
  </div>
);

const ToggleSwitch = ({ enabled, onChange }) => (
    <button onClick={onChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-cyan-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

// --- Initial Data ---
const initialBandwidthData = Array.from({ length: 30 }, (_, i) => ({ name: `T-${29 - i}`, ingress: Math.floor(Math.random() * 500) + 100, egress: Math.floor(Math.random() * 400) + 80, }));
const initialYearlyBandwidth = [ { month: 'Nov', usage: 1250 }, { month: 'Dec', usage: 1400 }, { month: 'Jan', usage: 1300 }, { month: 'Feb', usage: 1100 }, { month: 'Mar', usage: 1280 }, { month: 'Apr', usage: 1350 }, { month: 'May', usage: 1450 }, { month: 'Jun', usage: 1500 }, { month: 'Jul', usage: 1480 }, { month: 'Aug', usage: 1600 }, { month: 'Sep', usage: 1550 }, { month: 'Oct', usage: 1620 }, ];
const initialDevices = [ 
    { id: 'Cisco Catalyst 9300-24T', type: 'Switch', ip: '172.16.1.1', status: 'Online', cpu: 15, mem: 45, bootTime: randomBootTime(32), temp: 42, fans: [{ id: 1, rpm: 3400, status: 'normal' }, { id: 2, rpm: 3380, status: 'normal' }], psu: [{ id: 1, status: 'active', voltage: 12.1, current: 8.5 }, { id: 2, status: 'standby', voltage: 12.0, current: 0 }] }, 
    { id: 'NetAdmin Pro Router', type: 'Router', ip: '192.168.1.1', status: 'Online', cpu: 25, mem: 60, bootTime: randomBootTime(120), temp: 38, fans: [{ id: 1, rpm: 2800, status: 'normal' }], psu: [{ id: 1, status: 'active', voltage: 12.2, current: 12.3 }] }, 
    { id: 'Dell PowerEdge R740', type: 'Server', ip: '172.16.10.5', status: 'Online', cpu: 65, mem: 75, bootTime: randomBootTime(5), temp: 58, fans: [{ id: 1, rpm: 5200, status: 'normal' }, { id: 2, rpm: 5180, status: 'normal' }, { id: 3, rpm: 5230, status: 'normal' }], psu: [{ id: 1, status: 'active', voltage: 12.1, current: 28.5 }, { id: 2, status: 'active', voltage: 12.0, current: 27.8 }] }, 
    { id: 'Aruba AP-535', type: 'Access Point', ip: '192.168.2.10', status: 'Online', cpu: 10, mem: 30, bootTime: randomBootTime(18), temp: 35, fans: [], psu: [{ id: 1, status: 'active', voltage: 48.2, current: 0.5 }] }, 
    { id: 'Palo Alto PA-220', type: 'Firewall', ip: '192.168.2.2', status: 'Warning', cpu: 92, mem: 55, bootTime: randomBootTime(120), temp: 72, fans: [{ id: 1, rpm: 6800, status: 'high' }, { id: 2, rpm: 6750, status: 'high' }], psu: [{ id: 1, status: 'active', voltage: 12.3, current: 18.2 }] }, 
    { id: 'HP EliteBook 840 G8', type: 'User Device', ip: '192.168.1.101', status: 'Offline', cpu: 0, mem: 0, bootTime: null, temp: 0, fans: [], psu: [] }, 
    { id: 'Infoblox TE-1415', type: 'DNS Server', ip: '192.168.3.1', status: 'Online', cpu: 5, mem: 20, bootTime: randomBootTime(365), temp: 32, fans: [{ id: 1, rpm: 2200, status: 'low' }], psu: [{ id: 1, status: 'active', voltage: 12.0, current: 3.2 }] }, 
];
const initialAlerts = [ { id: 1, severity: 'Warning', message: 'High CPU on Dell PowerEdge R740 (65%).', timestamp: '1m ago' }, { id: 2, severity: 'Critical', message: 'Palo Alto PA-220 CPU at 92%', timestamp: '2m ago' }, ];
const initialDnsRecords = [ { id: 1, type: 'A', name: 'example.com', value: '192.0.2.1', ttl: 3600 }, { id: 2, type: 'AAAA', name: 'example.com', value: '2001:0db8::1', ttl: 3600 }, { id: 3, type: 'CNAME', name: 'www.example.com', value: 'example.com', ttl: 3600 }, { id: 4, type: 'MX', name: 'example.com', value: '10 mail.example.com', ttl: 7200 }, { id: 5, type: 'TXT', name: 'example.com', value: '"v=spf1 mx -all"', ttl: 3600 }, ];
const initialAclRules = [ { id: 1, action: 'Allow', protocol: 'TCP', source: '192.168.1.0/24', destination: 'any', port: '443', description: 'Allow HTTPS for LAN', enabled: true, hits: 15023 }, { id: 2, action: 'Deny', protocol: 'UDP', source: 'any', destination: 'any', port: '53', description: 'Deny external DNS', enabled: true, hits: 8345 }, { id: 3, action: 'Allow', protocol: 'ICMP', source: '10.0.0.1', destination: '8.8.8.8', port: 'any', description: 'Allow ping from edge router', enabled: false, hits: 101 }, { id: 4, action: 'Deny', protocol: 'Any', source: '0.0.0.0/0', destination: 'any', port: 'any', description: 'Default Deny All', enabled: true, hits: 234897 }, ];
const initialWirelessDevices = [ { id: 'Aruba AP-535', ssid: 'NMS-Guest', mac: '00:1A:2B:3C:4D:5E', ip: '192.168.2.10', signal: -55, status: 'Connected', type: 'Access Point' }, { id: 'SM-G998U1', ssid: 'NMS-Guest', mac: 'A8:F2:78:9A:BC:DE', ip: '192.168.2.115', signal: -62, status: 'Connected', type: 'Phone' }, { id: 'HP-Spectre-X360', ssid: 'NMS-Corp', mac: 'C0:3E:BA:12:34:56', ip: '192.168.3.50', signal: -48, status: 'Connected', type: 'Laptop' }, ];
const initialSwitchDetails = {
    'Cisco Catalyst 9300-24T': {
        model: 'Catalyst 9300',
        firmware: '17.3.4a',
        vlans: [
            { id: 1, name: 'default', status: 'active', ports: '1-48' },
            { id: 10, name: 'Users-General', status: 'active', ports: '1-24' },
            { id: 20, name: 'Servers-Prod', status: 'active', ports: '25-36' },
            { id: 30, name: 'VOIP-Phones', status: 'active', ports: '37-48' },
        ],
        ports: Array.from({ length: 48 }, (_, i) => ({
            id: i + 1,
            status: Math.random() > 0.1 ? 'up' : (Math.random() > 0.5 ? 'down' : 'disabled'),
            speed: '1G',
            vlan: i < 24 ? 10 : (i < 36 ? 20 : 30),
            rxPackets: Math.floor(Math.random() * 10000000),
            txPackets: Math.floor(Math.random() * 10000000),
            rxErrors: Math.floor(Math.random() * 50),
            txErrors: Math.floor(Math.random() * 30),
            rxDrops: Math.floor(Math.random() * 20),
            txDrops: Math.floor(Math.random() * 15),
            crcErrors: Math.floor(Math.random() * 10)
        }))
    }
};
const initialRouterDetails = {
    'NetAdmin Pro Router': {
        model: 'NetAdmin Pro',
        firmware: '16.9.5',
        bgpNeighbors: [
            { neighborIP: '1.1.1.1', asn: 13335, status: 'Established' },
            { neighborIP: '2.2.2.2', asn: 15169, status: 'Established' }
        ],
        routingTable: [
            { prefix: '0.0.0.0/0', nextHop: '1.1.1.1', metric: 0, protocol: 'BGP' },
            { prefix: '10.0.0.0/8', nextHop: '192.168.1.1', metric: 10, protocol: 'OSPF' },
            { prefix: '172.16.0.0/12', nextHop: '192.168.1.2', metric: 10, protocol: 'OSPF' },
        ]
    }
};
const initialServerDetails = {
    'Dell PowerEdge R740': {
        os: 'Windows Server 2022',
        services: [
            { name: 'dns.exe', pid: 1234, status: 'Running' },
            { name: 'lsass.exe', pid: 567, status: 'Running' },
            { name: 'smb.sys', pid: 890, status: 'Running' },
        ],
        performance: {
            cpu: Array.from({length: 10}, () => Math.floor(Math.random() * 30) + 50),
            memory: Array.from({length: 10}, () => Math.floor(Math.random() * 10) + 65),
            disk: Array.from({length: 10}, () => Math.floor(Math.random() * 20) + 5),
        }
    },
    'Infoblox TE-1415': {
        os: 'Ubuntu 22.04 LTS',
        services: [
            { name: 'named', pid: 4321, status: 'Running' },
            { name: 'sshd', pid: 1122, status: 'Running' },
            { name: 'cron', pid: 3344, status: 'Running' },
        ],
        performance: {
            cpu: Array.from({length: 10}, () => Math.floor(Math.random() * 10) + 2),
            memory: Array.from({length: 10}, () => Math.floor(Math.random() * 5) + 18),
            disk: Array.from({length: 10}, () => Math.floor(Math.random() * 5) + 1),
        }
    }
};

// --- TOTP (Time-based One-Time Password) Implementation ---

// Generate TOTP secret (base32 encoded)
const generateTOTPSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
};

// Base32 decode
const base32Decode = (base32) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let hex = '';
    
    for (let i = 0; i < base32.length; i++) {
        const val = alphabet.indexOf(base32.charAt(i).toUpperCase());
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
    }
    
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        const chunk = bits.substr(i, 8);
        hex += parseInt(chunk, 2).toString(16).padStart(2, '0');
    }
    
    return hex;
};

// Generate TOTP code from secret
const generateTOTP = (secret, timeStep = 30) => {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const hexTime = time.toString(16).padStart(16, '0');
    const hexSecret = base32Decode(secret);
    
    // Simple HMAC-SHA1 implementation for TOTP
    const hmac = async (key, message) => {
        const encoder = new TextEncoder();
        const keyData = new Uint8Array(key.match(/.{2}/g).map(byte => parseInt(byte, 16)));
        const messageData = new Uint8Array(message.match(/.{2}/g).map(byte => parseInt(byte, 16)));
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
    };
    
    return hmac(hexSecret, hexTime).then(hash => {
        const offset = parseInt(hash.substring(hash.length - 1), 16);
        const binary = parseInt(hash.substr(offset * 2, 8), 16) & 0x7fffffff;
        const otp = (binary % 1000000).toString().padStart(6, '0');
        return otp;
    });
};

// Verify TOTP code (check current + previous + next time window for clock drift)
const verifyTOTP = async (secret, token, timeStep = 30) => {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    
    // Check current, previous, and next 2 time windows ( +/- 90 seconds tolerance )
    for (let i = -2; i <= 2; i++) {
        const adjustedTime = time + i;
        const hexTime = adjustedTime.toString(16).padStart(16, '0');
        const hexSecret = base32Decode(secret);
        
        try {
            const keyData = new Uint8Array(hexSecret.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            const messageData = new Uint8Array(hexTime.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-1' },
                false,
                ['sign']
            );
            
            const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
            const hash = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
            
            const offset = parseInt(hash.substring(hash.length - 1), 16);
            const binary = parseInt(hash.substr(offset * 2, 8), 16) & 0x7fffffff;
            const otp = (binary % 1000000).toString().padStart(6, '0');
            
            if (otp === token) {
                return true;
            }
        } catch (e) {
            console.error('TOTP verification error:', e);
        }
    }
    
    return false;
};

// --- UI Components ---

const MFAVerificationPanel = ({ onVerify, onCancel, onReset }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [resetKey, setResetKey] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!code || code.length !== 6) {
            setError('Please enter a 6-digit code.');
            return;
        }
        setLoading(true);
        const success = await onVerify(code);
        setLoading(false);
        if (!success) {
            setError('Invalid MFA code. Please try again.');
            setCode('');
        }
    };

    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
    };

    const handleResetSubmit = (e) => {
        e.preventDefault();
        if (resetKey === 'reset123') {
            onReset();
        } else {
            setError('Invalid access key.');
            setResetKey('');
        }
    };

    return (
        <GlassPanel className="w-full max-w-md p-4 sm:p-6 md:p-8 mx-auto">
            <div className="text-center mb-6 sm:mb-8">
                <Icon name="shieldCheck" className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 text-green-500 dark:text-green-400 mx-auto mb-3 sm:mb-4" />
                <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-wider">Verify Identity</h1>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-2">Enter verification code from MFA application</p>
            </div>
            
            {!showReset ? (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                        <label className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Authentication Code</label>
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={code} 
                            onChange={handleCodeChange}
                            maxLength="6"
                            className="w-full p-2 sm:p-3 text-xl sm:text-2xl font-mono tracking-widest bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" 
                            placeholder="000000"
                            disabled={loading}
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs sm:text-sm text-center">{error}</p>}
                    <div className="flex gap-2 sm:gap-3">
                        <button 
                            type="button" 
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 p-2 sm:p-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 font-bold text-sm sm:text-base rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>
                    <div className="text-center pt-2 border-t border-cyan-500/10">
                        <button 
                            type="button" 
                            onClick={() => setShowReset(true)}
                            className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:underline"
                        >
                            Reset MFA
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleResetSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Access Key</label>
                        <input 
                            type="text" 
                            value={resetKey} 
                            onChange={(e) => setResetKey(e.target.value)}
                            className="w-full p-3 text-center bg-gray-200/50 dark:bg-black/30 border border-red-500/20 rounded-lg focus:ring-2 focus:ring-red-400 focus:outline-none transition" 
                            placeholder="Enter access key"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Enter the access key to reset MFA settings</p>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => { setShowReset(false); setError(''); setResetKey(''); }}
                            className="flex-1 p-3 bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 font-bold rounded-lg transition-colors"
                        >
                            Back
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 p-3 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 font-bold rounded-lg transition-colors"
                        >
                            Reset MFA
                        </button>
                    </div>
                </form>
            )}
        </GlassPanel>
    );
};

const LoginPanel = ({ onLogin, isLocked, lockTimeRemaining, onToggleTheme, isDarkMode }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (isLocked) {
            const minutes = Math.ceil(lockTimeRemaining / 60);
            setError(`Too many failed attempts. Try again in ${minutes} minute(s).`);
            return;
        }
        
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        const result = await onLogin(username, password);
        if (!result.success) {
            const attemptsLeft = 4 - result.attempts;
            setError(`Invalid credentials. ${attemptsLeft} attempt(s) remaining.`);
        }
    };

    const handleForgot = () => {
        try {
            const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
            const admin = users.find(u => u.username === 'admin');
            const email = 'adityaraj3136@gmail.com';
            logAudit('password_reset_requested', { user: username || 'unknown', target: 'admin' });
            window.location.href = `mailto:${email}?subject=${encodeURIComponent('NMS Password Reset')}&body=${encodeURIComponent('A password reset was requested. If this was you, please reply to confirm.')}`;
        } catch {}
    };

    return (
        <div className="relative w-full max-w-md mx-auto">
            <GlassPanel className="w-full p-8 relative">
                <button
                    onClick={onToggleTheme}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 hover:shadow-xl"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <Icon name="moon" className="w-5 h-5 text-cyan-500 dark:text-cyan-300 transition-transform hover:scale-110" />
                </button>
                <div className="text-center mb-8">
                    <Icon name="network" className="w-16 h-16 text-cyan-500 dark:text-cyan-400 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-wider">NMS Login</h1>
                    <p className="text-gray-600 dark:text-gray-400">Enter your credentials to access the dashboard.</p>
                </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="e.g., admin" />
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="••••••••" />
                </div>
                <div className="flex justify-between items-center">
                    <button type="button" onClick={handleForgot} className="text-sm text-cyan-600 dark:text-cyan-300 hover:underline">Forgot password?</button>
                </div>
                {error && (
                    <div className="space-y-2">
                        <p className="text-red-500 text-sm text-center">{error}</p>
                        {!isLocked && error.includes('Invalid credentials') && (
                            <div className="flex items-center justify-center gap-2">
                                {[1, 2, 3, 4].map(attempt => (
                                    <div
                                        key={attempt}
                                        className={`h-2 w-12 rounded-full transition-all ${
                                            attempt <= (4 - parseInt(error.match(/\d+/)?.[0] || 0))
                                                ? 'bg-red-500'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <button type="submit" disabled={isLocked} className={`w-full p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg transition-opacity ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                }`}>
                    {isLocked ? `Locked (${Math.ceil(lockTimeRemaining / 60)}m)` : 'Login'}
                </button>
            </form>
            <div className="mt-6 pt-4 border-t border-cyan-500/20 text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Made with <span className="text-red-500">❤️</span> by <span className="font-semibold text-cyan-600 dark:text-cyan-400">Aditya Raj</span>
                </p>
                <a 
                    href="https://adityaraj3136.github.io/contact/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                >
                    <Icon name="help" className="w-3 h-3" />
                    Report Issue / Feedback
                </a>
            </div>
            </GlassPanel>
        </div>
    );
};

const Sidebar = ({ navItems, activeView, setActiveView, isSidebarOpen, setIsSidebarOpen }) => {
    return (
        <>
            <div className={`fixed top-0 left-0 h-full p-2 sm:p-3 md:p-4 z-30 w-56 sm:w-60 md:w-64 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <GlassPanel className="h-full flex flex-col">
                    <div className="flex-shrink-0 flex items-center justify-between gap-3 mb-8 px-2 pt-4">
                        <div className="flex items-center gap-3">
                            <Icon name="network" className="w-10 h-10 text-cyan-500 dark:text-cyan-400" />
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-wider">NMS</h1>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                            <Icon name="x" className="w-6 h-6"/>
                        </button>
                    </div>
                    <nav className="flex-grow flex flex-col gap-2 p-2 overflow-y-auto no-scrollbar">
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => { setActiveView(item.id); setIsSidebarOpen(false); }} className={`flex items-center gap-4 p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all duration-200 ${activeView === item.id ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-semibold' : ''}`}>
                                <Icon name={item.icon} className="w-6 h-6" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="flex-shrink-0 mt-auto p-4 bg-black/5 dark:bg-black/30 rounded-lg border border-cyan-500/10 dark:border-cyan-300/10 m-2">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">System Status</p>
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">All Systems Operational</p>
                    </div>
                </GlassPanel>
            </div>
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-20 md:hidden"></div>}
        </>
    );
};

const WelcomeModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
        <div className="w-full max-w-2xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-cyan-500/30 overflow-hidden animate-[fadeIn_0.5s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 md:p-8 text-center">
                <div className="mb-4 sm:mb-6 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-50 animate-pulse" />
                        <Icon name="network" className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 text-cyan-500 dark:text-cyan-400 relative" />
                    </div>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Welcome to NMS Dashboard
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 font-semibold">
                    Network Management System - Firewall Simulation Web UI
                </p>
                <div className="bg-white/50 dark:bg-black/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-left space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Icon name="shieldCheck" className="w-5 sm:w-6 h-5 sm:h-6 text-cyan-500 flex-shrink-0 mt-0.5 sm:mt-1" />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1 text-sm sm:text-base">Advanced Security Features</h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Multi-factor authentication, role-based access control, and real-time threat monitoring</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Icon name="activity" className="w-5 sm:w-6 h-5 sm:h-6 text-blue-500 flex-shrink-0 mt-0.5 sm:mt-1" />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1 text-sm sm:text-base">Real-Time Monitoring</h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Live device status, bandwidth tracking, and performance analytics dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Icon name="settings" className="w-5 sm:w-6 h-5 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 sm:mt-1" />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1 text-sm sm:text-base">Comprehensive Management</h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Control switches, routers, firewalls, DNS, wireless access points, and ACL rules</p>
                        </div>
                    </div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                        <span className="font-semibold">🔐 Default Credentials:</span> Username: <code className="bg-black/10 dark:bg-white/10 px-2 py-1 rounded text-xs">admin</code> | Password: <code className="bg-black/10 dark:bg-white/10 px-2 py-1 rounded text-xs">admin</code>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Change your password after first login for security</p>
                </div>
                <button 
                    onClick={onClose}
                    className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
                >
                    Get Started →
                </button>
            </div>
        </div>
    </div>
);

const FeedbackModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-4xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-cyan-500/20 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Report Issue / Feedback</h3>
                <button onClick={onClose} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Icon name="x" className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
            </div>
            <iframe 
                src="https://adityaraj3136.github.io/contact/" 
                className="w-full h-[calc(100%-4rem)] border-0"
                title="Contact Form"
                sandbox="allow-same-origin allow-scripts allow-forms"
            />
        </div>
    </div>
);

const Header = ({ activeViewLabel, alertsCount, onLogout, onShowAlerts, onToggleSidebar, onToggleProfile, currentTime, timezone, userRole, onShowFeedback, criticalAlertsCount, onToggleTheme, isDarkMode }) => (
    <GlassPanel className="w-full p-2 sm:p-3 md:p-4 flex justify-between items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button onClick={onToggleSidebar} className="md:hidden p-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white flex-shrink-0">
                <Icon name="menu" className="w-5 md:w-6 h-5 md:h-6" />
            </button>
            <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 capitalize truncate">{activeViewLabel}</h2>
            {userRole === 'viewer' && (
                <span className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full whitespace-nowrap">READ-ONLY</span>
            )}
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1 md:gap-2 text-cyan-600 dark:text-cyan-300">
                <Icon name="clock" className="w-4 md:w-5 lg:w-6 h-4 md:h-5 lg:h-6 flex-shrink-0" />
                <span className="font-mono text-xs md:text-sm">
                    {currentTime.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-cyan-500/10 transition-colors" title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                    <Icon name="moon" className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
                </button>
                <button onClick={onShowFeedback} className="p-2 rounded-full hover:bg-cyan-500/10 transition-colors" title="Report Issue / Feedback">
                    <Icon name="help" className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
                </button>
                <button onClick={onShowAlerts} className="relative p-2 rounded-full hover:bg-cyan-500/10 transition-colors">
                    <Icon name="alert" className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                    {criticalAlertsCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">{criticalAlertsCount}</span>}
                </button>
                <button onClick={onToggleProfile} className="flex items-center gap-3 p-1 rounded-full hover:bg-cyan-500/10 transition-colors">
                    <img src="https://placehold.co/40x40/0A0A0A/31C48D?text=A" alt="Admin" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-cyan-500 dark:border-cyan-400"/>
                    <div className="hidden md:block text-left">
                        <p className="text-gray-900 dark:text-white font-semibold">Admin</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole} Access</p>
                    </div>
                </button>
            </div>
        </div>
    </GlassPanel>
);

const AlertsPanel = ({ alerts, onClose }) => {
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical': return 'border-red-500';
            case 'Warning': return 'border-yellow-500';
            default: return 'border-blue-500';
        }
    };
    return (
        <div className="fixed top-24 right-4 z-40">
            <GlassPanel className="w-80 max-h-[400px] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-cyan-500/20 dark:border-cyan-300/20">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-cyan-500/20">
                        <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                    </button>
                </div>
                <div className="overflow-y-auto p-2">
                    {alerts.length > 0 ? alerts.map(alert => (
                        <div key={alert.id} className={`p-3 border-l-4 ${getSeverityColor(alert.severity)} bg-black/5 dark:bg-black/20 rounded-r-lg mb-2`}>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{alert.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{alert.timestamp}</p>
                        </div>
                    )) : <p className="text-center text-gray-500 dark:text-gray-400 p-4">No new alerts.</p>}
                </div>
            </GlassPanel>
        </div>
    );
};

const ProfileDropdown = ({ onLogout, onShowProfile, onShowChangePassword, onShowMfaSettings, onClose }) => {
    const menuItems = [
        { label: 'User Profile', icon: 'user', action: onShowProfile },
        { label: 'Change Password', icon: 'lock', action: onShowChangePassword },
        { label: 'MFA Settings', icon: 'shieldCheck', action: onShowMfaSettings },
    ];
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.profile-dropdown') && !e.target.closest('button[title="Profile"]')) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    return (
        <div className="fixed top-24 right-4 z-40 profile-dropdown">
            <GlassPanel className="w-64">
                <div className="p-2">
                    {menuItems.map(item => (
                        <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-3 text-left rounded-lg text-gray-600 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors">
                            <Icon name={item.icon} className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <div className="h-px bg-cyan-500/20 dark:bg-cyan-300/10 my-1"></div>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-left rounded-lg text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Icon name="logout" className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </GlassPanel>
        </div>
    );
};

const ChangePasswordModal = ({ onClose }) => {
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    
    const calculatePasswordStrength = (password) => {
        if (!password) return { score: 0, label: '', color: '' };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        
        if (score <= 1) return { score: 20, label: 'Weak', color: 'bg-red-500' };
        if (score === 2) return { score: 40, label: 'Fair', color: 'bg-orange-500' };
        if (score === 3) return { score: 60, label: 'Good', color: 'bg-yellow-500' };
        if (score === 4) return { score: 80, label: 'Strong', color: 'bg-lime-500' };
        return { score: 100, label: 'Very Strong', color: 'bg-green-500' };
    };
    
    const strength = calculatePasswordStrength(passwords.new);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') handleSubmit(e);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            setMessage('All fields are required');
            setMessageType('error');
            return;
        }
        // Check against stored password hash in localStorage
        const storedHash = localStorage.getItem('userPasswordHash');
        const currentHash = await hashSHA256(passwords.current);
        const defaultHash = await hashSHA256('admin');
        const expectedHash = storedHash || defaultHash;
        if (currentHash !== expectedHash) {
            setMessage('Current password is incorrect');
            setMessageType('error');
            return;
        }
        if (passwords.new.length < 8) {
            setMessage('New password must be at least 8 characters');
            setMessageType('error');
            return;
        }
        if (passwords.new !== passwords.confirm) {
            setMessage('Passwords do not match');
            setMessageType('error');
            return;
        }
        // Save new password hash to localStorage
        try {
            const newHash = await hashSHA256(passwords.new);
            localStorage.setItem('userPasswordHash', newHash);
            logAudit('password_changed', { user: 'admin' });
            setMessage('Password changed successfully!');
            setMessageType('success');
            setTimeout(() => {
                setPasswords({ current: '', new: '', confirm: '' });
                onClose();
            }, 2000);
        } catch (error) {
            setMessage('Failed to save password');
            setMessageType('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <GlassPanel className="w-full max-w-md p-0">
                <div className="flex justify-between items-center p-4 border-b border-cyan-500/20 dark:border-cyan-300/20">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Change Password</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-cyan-500/20">
                        <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Current Password</label>
                        <input type="password" name="current" value={passwords.current} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="Enter current password" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">New Password</label>
                        <input type="password" name="new" value={passwords.new} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="Enter new password (min 8 characters)" />
                        {passwords.new && (
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 dark:text-gray-400">Password Strength:</span>
                                    <span className={`font-semibold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.score}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Use 8+ characters with uppercase, lowercase, numbers & symbols
                                </p>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Confirm Password</label>
                        <input type="password" name="confirm" value={passwords.confirm} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="Confirm new password" />
                    </div>
                    {message && (
                        <div className={`p-3 rounded-lg ${messageType === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {message}
                        </div>
                    )}
                    <button type="submit" className="w-full p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                        Update Password
                    </button>
                </form>
            </GlassPanel>
        </div>
    );
};


const UserProfileModal = ({ onClose, userRole, startMfaSetup = false }) => {
    // Current user context
    const [lastLoginStr, setLastLoginStr] = useState('First login');
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [showMfaSetup, setShowMfaSetup] = useState(false);
    const [mfaSecret, setMfaSecret] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [mfaError, setMfaError] = useState('');
    
    useEffect(() => {
        // Last Login Logic
        const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
        const actualUser = users.find(u => u.username === (userRole === 'admin' ? 'admin' : 'viewer'));
        if (actualUser && actualUser.lastLogin) {
            setLastLoginStr(new Date(actualUser.lastLogin).toLocaleString());
        } else {
             setLastLoginStr(new Date().toLocaleString());
        }

        // MFA State Logic - User Scoped
        // Use userRole as the key suffix (admin/viewer)
        const storageKeyMfa = `mfaEnabled_${userRole}`;
        const storageKeySecret = `mfaSecret_${userRole}`;

        const storedMfa = localStorage.getItem(storageKeyMfa) === 'true';
        setMfaEnabled(storedMfa);
        if (storedMfa) {
             const storedSecret = localStorage.getItem(storageKeySecret);
             if (storedSecret) setMfaSecret(storedSecret);
        }

        // If explicitly requested via startMfaSetup prop
        if (startMfaSetup && !storedMfa) {
             // Delay to ensure state update doesn't conflict
             setShowMfaSetup(true);
             if (!mfaSecret) {
                const newSecret = generateSecret();
                setMfaSecret(newSecret);
             }
        }
    }, [userRole, startMfaSetup]); 

    const generateSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 16; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    };

    const handleEnableMfa = () => {
        // Force open setup, generate secret if missing
        if (!mfaSecret) {
            const newSecret = generateSecret();
            setMfaSecret(newSecret);
        }
        setShowMfaSetup(true);
        setOtpInput('');
        setMfaError('');
    };

    const handleDisableMfa = () => {
        if (window.confirm(`Are you sure you want to disable MFA for ${userRole}? This will reduce your account security.`)) {
            const storageKeyMfa = `mfaEnabled_${userRole}`;
            const storageKeySecret = `mfaSecret_${userRole}`;
            
            localStorage.removeItem(storageKeyMfa);
            localStorage.removeItem(storageKeySecret);
            setMfaEnabled(false);
            setShowMfaSetup(false);
            setMfaSecret('');
        }
    };

    const handleConfirmMfa = async () => {
        if (otpInput.length !== 6) {
            setMfaError('Please enter a 6-digit code');
            return;
        }
        const isValid = await verifyTOTP(mfaSecret, otpInput);
        if (isValid) {
            const storageKeyMfa = `mfaEnabled_${userRole}`;
            const storageKeySecret = `mfaSecret_${userRole}`;
            
            localStorage.setItem(storageKeyMfa, 'true');
            localStorage.setItem(storageKeySecret, mfaSecret);
            setMfaEnabled(true);
            setShowMfaSetup(false);
        } else {
            setMfaError('Invalid verification code. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <GlassPanel className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Icon name="user" className="w-6 h-6 text-cyan-500" />
                        User Profile
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <Icon name="x" className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                            {userRole.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 capitalize">{userRole} Account</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{userRole === 'admin' ? 'System Administrator' : 'Read-Only Viewer'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Last Login: {lastLoginStr}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-100 dark:bg-black/30 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="font-semibold text-green-600 dark:text-green-400">Active</span>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-100 dark:bg-black/30 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</span>
                            <p className="font-semibold text-gray-700 dark:text-gray-300 capitalize mt-1">{userRole}</p>
                        </div>
                    </div>

                    <div className="border-t border-cyan-500/10 pt-4">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Security Settings</h4>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded hover:bg-gray-100 dark:hover:bg-black/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Icon name="lock" className="w-5 h-5 text-gray-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">Password</p>
                                        <p className="text-xs text-gray-500">Last changed: Never</p>
                                    </div>
                                </div>
                                <button className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1.5 rounded transition-colors">
                                    Change
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded hover:bg-gray-100 dark:hover:bg-black/40 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Icon name="shield" className="w-5 h-5 text-gray-500" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">Two-Factor Auth</p>
                                        <p className={`text-xs ${mfaEnabled ? 'text-green-500' : 'text-gray-500'}`}>
                                            {mfaEnabled ? 'Enabled' : 'Disabled'}
                                        </p>
                                    </div>
                                </div>
                                {!mfaEnabled ? (
                                    <button onClick={handleEnableMfa} className="text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 px-3 py-1.5 rounded transition-colors border border-cyan-500/20">
                                        Enable
                                    </button>
                                ) : (
                                    <button onClick={handleDisableMfa} className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded transition-colors border border-red-500/20">
                                        Disable
                                    </button>
                                )}
                            </div>

                            {showMfaSetup && (
                                <div className="mt-4 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Setup Authenticator</h5>
                                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                                        <div className="flex-shrink-0 bg-white p-2 rounded">
                                            <img
                                                alt="MFA QR"
                                                className="w-32 h-32"
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`otpauth://totp/NMS%20Dashboard:${userRole}?secret=${mfaSecret}&issuer=NMS%20Dashboard&algorithm=SHA1&digits=6&period=30`)}`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-xs text-gray-500">Secret Key:</p>
                                                <button onClick={() => setMfaSecret(generateSecret())} className="text-[10px] text-cyan-600 hover:underline" title="Generate new secret">
                                                    Reset Key
                                                </button>
                                            </div>
                                            <p className="font-mono font-bold text-gray-800 dark:text-gray-200 text-sm mb-3 tracking-widest break-all">{mfaSecret}</p>
                                            
                                            <label className="block text-xs text-gray-500 mb-1">Verify Code</label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={otpInput}
                                                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0,6))}
                                                    placeholder="000000"
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono tracking-widest text-center"
                                                />
                                                <button onClick={handleConfirmMfa} className="px-3 py-2 bg-green-500 text-white rounded text-sm font-bold hover:bg-green-600 disabled:opacity-50" disabled={otpInput.length !== 6}>
                                                    Verify
                                                </button>
                                            </div>
                                            {mfaError && <p className="mt-2 text-xs text-red-500 font-semibold">{mfaError}</p>}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Scan QR or enter key manually in your authenticator app.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </GlassPanel>
        </div>
    );
};

const StatCard = ({ icon, title, value, change, changeType, onClick }) => (
    <div onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
        <GlowingBorder className={onClick ? 'hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300' : ''}>
            <div className="p-2 sm:p-3 md:p-4 lg:p-5">
                <div className="flex justify-between items-start mb-2 gap-1 sm:gap-2">
                    <h3 className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg flex-1">{title}</h3>
                    <div className="p-1 sm:p-1.5 md:p-2 bg-gray-300/50 dark:bg-gray-800/50 rounded-lg border border-cyan-500/10 dark:border-cyan-300/10 flex-shrink-0">
                        <Icon name={icon} className="w-3.5 sm:w-4 md:w-5 lg:w-6 h-3.5 sm:h-4 md:h-5 lg:h-6 text-cyan-500 dark:text-cyan-400" />
                    </div>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
                <div className={`text-xs sm:text-sm md:text-sm flex items-center ${changeType === 'increase' ? 'text-red-500' : changeType === 'decrease' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {change}
                </div>
            </div>
        </GlowingBorder>
    </div>
);

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-300/50 dark:bg-gray-700/50 rounded ${className}`}></div>
);

const ChartSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full" />
    </div>
);

const ChartCard = ({ title, children, loading = false }) => (
  <GlassPanel className="p-4 flex flex-col min-h-96">
    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
    <div className="flex-1 w-full">
        {loading ? <ChartSkeleton /> : children}
    </div>
  </GlassPanel>
);

const EnvironmentalCard = ({ device }) => {
    const getTempColor = (temp) => {
        if (temp >= 70) return 'text-red-600 dark:text-red-400';
        if (temp >= 50) return 'text-orange-600 dark:text-orange-400';
        return 'text-green-600 dark:text-green-400';
    };
    
    const getTempStatus = (temp) => {
        if (temp >= 70) return 'Critical';
        if (temp >= 50) return 'Warning';
        return 'Normal';
    };
    
    const getFanColor = (status) => {
        if (status === 'high') return 'text-orange-600 dark:text-orange-400';
        if (status === 'low') return 'text-blue-600 dark:text-blue-400';
        return 'text-green-600 dark:text-green-400';
    };
    
    const getPsuColor = (status) => {
        if (status === 'active') return 'text-green-600 dark:text-green-400';
        if (status === 'standby') return 'text-blue-600 dark:text-blue-400';
        return 'text-gray-600 dark:text-gray-400';
    };
    
    return (
        <GlassPanel className="p-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Icon name="gauge" className="w-6 h-6" />
                Environmental Monitoring
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Temperature */}
                <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon name="thermometer" className={`w-5 h-5 ${getTempColor(device.temp)}`} />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Temperature</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${getTempColor(device.temp)}`}>{device.temp}°C</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTempStatus(device.temp) === 'Critical' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : getTempStatus(device.temp) === 'Warning' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                            {getTempStatus(device.temp)}
                        </span>
                    </div>
                </div>
                
                {/* Fans */}
                <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon name="fan" className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Fans ({device.fans.length})</span>
                    </div>
                    {device.fans.length === 0 ? (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">No fans</span>
                    ) : (
                        <div className="space-y-1">
                            {device.fans.map(fan => (
                                <div key={fan.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">Fan {fan.id}</span>
                                    <span className={`font-mono ${getFanColor(fan.status)}`}>{fan.rpm} RPM</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Power Supplies */}
                <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon name="power" className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Power Supplies ({device.psu.length})</span>
                    </div>
                    {device.psu.length === 0 ? (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">No PSU data</span>
                    ) : (
                        <div className="space-y-1">
                            {device.psu.map(psu => (
                                <div key={psu.id} className="text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 dark:text-gray-300">PSU {psu.id}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getPsuColor(psu.status)} ${psu.status === 'active' ? 'bg-green-500/20' : psu.status === 'standby' ? 'bg-blue-500/20' : 'bg-gray-500/20'}`}>
                                            {psu.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                        <span>{psu.voltage}V</span>
                                        <span>{psu.current}A</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </GlassPanel>
    );
};


const NetworkTopologyMap = ({ devices = [] }) => {
    const [hoveredNode, setHoveredNode] = useState(null);
    
    const nodeMapping = {
        'R1-EDGE': 'NetAdmin Pro Router',
        'S1-CORE': 'Cisco Catalyst 9300-24T',
        'S2-CORE': 'Cisco Catalyst 9300-24T',
        'FW-01': 'Palo Alto PA-220',
        'FW-02': 'Palo Alto PA-220',
        'R2-INT': 'NetAdmin Pro Router',
        'SRV-01': 'Dell PowerEdge R740',
        'SRV-02': 'Dell PowerEdge R740'
    };
    
    const getNodeStatus = (label) => {
        const deviceId = nodeMapping[label];
        const device = devices && devices.length > 0 ? devices.find(d => d.id === deviceId) : null;
        
        if (!device) return 'offline';
        return device.status === 'Online' ? 'online' : device.status === 'Warning' ? 'warning' : 'offline';
    };
    
    const getStatusColor = (status) => {
        const colors = { online: '#00ff88', warning: '#ffbb28', offline: '#ff4444' };
        return colors[status] || colors.offline;
    };
    
    const getStatusText = (status) => {
        return status === 'online' ? '🟢 Online' : status === 'warning' ? '🟡 Warning' : '🔴 Offline';
    };
    
    const nodeList = [
        {x: 100, y: 200, label: 'R1-EDGE', type: 'router'}, 
        {x: 250, y: 100, label: 'S1-CORE', type: 'switch'}, 
        {x: 250, y: 300, label: 'S2-CORE', type: 'switch'}, 
        {x: 400, y: 100, label: 'FW-01', type: 'firewall'}, 
        {x: 400, y: 300, label: 'FW-02', type: 'firewall'}, 
        {x: 550, y: 200, label: 'R2-INT', type: 'router'}, 
        {x: 700, y: 100, label: 'SRV-01', type: 'server'}, 
        {x: 700, y: 300, label: 'SRV-02', type: 'server'}
    ];
    
    return (
        <GlassPanel className="p-4 h-[300px] md:h-[500px] overflow-hidden relative">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Network Topology</h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Hover over nodes to see device mapping</div>
            <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 255, 255, 0.05)" strokeWidth="0.5"/></pattern></defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <g className="connections opacity-40">
                    <line x1="100" y1="200" x2="250" y2="100" stroke="#00ffff" strokeWidth="2" /><line x1="100" y1="200" x2="250" y2="300" stroke="#00ffff" strokeWidth="2" /><line x1="250" y1="100" x2="400" y2="100" stroke="#00ffff" strokeWidth="2" /><line x1="250" y1="300" x2="400" y2="300" stroke="#00ffff" strokeWidth="2" /><line x1="400" y1="100" x2="550" y2="200" stroke="#00ffff" strokeWidth="2" /><line x1="400" y1="300" x2="550" y2="200" stroke="#00ffff" strokeWidth="2" /><line x1="550" y1="200" x2="700" y2="100" stroke="#00ffff" strokeWidth="2" /><line x1="550" y1="200" x2="700" y2="300" stroke="#00ffff" strokeWidth="2" />
                </g>
                <circle cx="0" cy="0" r="4" fill="#39ff14"><animateMotion dur="3s" repeatCount="indefinite" path="M100,200 L250,100" /></circle>
                <circle cx="0" cy="0" r="4" fill="#39ff14"><animateMotion dur="4s" repeatCount="indefinite" path="M250,300 L400,300" /></circle>
                <circle cx="0" cy="0" r="4" fill="#ff073a"><animateMotion dur="2.5s" repeatCount="indefinite" path="M550,200 L700,300" /></circle>
                {nodeList.map(node => {
                    const status = getNodeStatus(node.label);
                    const statusColor = getStatusColor(status);
                    const deviceName = nodeMapping[node.label];
                    const isHovered = hoveredNode === node.label;
                    return (
                        <g 
                            key={node.label} 
                            transform={`translate(${node.x}, ${node.y})`} 
                            className="cursor-pointer group"
                            onMouseEnter={() => setHoveredNode(node.label)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            <circle cx="0" cy="0" r="25" fill="#0d1f2d" stroke={statusColor} strokeWidth={isHovered ? "3" : "2"} className="transition-all group-hover:stroke-yellow-400"/>
                            <circle cx="0" cy="0" r={isHovered ? "32" : "28"} fill="transparent" stroke={statusColor} strokeWidth="1" strokeDasharray="4 4" className="opacity-30 group-hover:opacity-70 animate-spin-slow transition-all"/>
                            {isHovered && (
                                <>
                                    <rect x="-60" y="-75" width="120" height="70" rx="8" fill="#1a1a2e" stroke={statusColor} strokeWidth="1.5" opacity="0.95"/>
                                    <text x="0" y="-60" textAnchor="middle" fill={statusColor} fontSize="11" className="font-bold">{node.label}</text>
                                    <text x="0" y="-45" textAnchor="middle" fill="#e0e0e0" fontSize="9">{deviceName}</text>
                                    <text x="0" y="-30" textAnchor="middle" fill={statusColor} fontSize="9">{getStatusText(status)}</text>
                                </>
                            )}
                            <text x="0" y="4" textAnchor="middle" fill="#e0e0e0" fontSize="10" className="font-sans">{node.type.charAt(0).toUpperCase()}</text>
                            <text x="0" y="45" textAnchor="middle" fill="#cccccc" fontSize="12" className="font-semibold tracking-wider group-hover:fill-white">{node.label}</text>
                        </g>
                    );
                })}
            </svg>
        </GlassPanel>
    );
};

const DeviceTable = ({ devices }) => (
    <GlassPanel className="p-3 md:p-4 overflow-x-auto">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 md:mb-4">Device List</h3>
        <div className="overflow-x-auto -mx-3 md:-mx-4 md:mx-0">
            <table className="w-full text-left table-auto">
                <thead>
                    <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                        <th className="p-2 md:p-3 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">Device</th>
                        <th className="p-2 md:p-3 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Type</th>
                        <th className="p-2 md:p-3 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">IP</th>
                        <th className="p-2 md:p-3 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                        <th className="p-2 md:p-3 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">CPU</th>
                        <th className="p-2 md:p-3 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Mem</th>
                        <th className="p-2 md:p-3 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Uptime</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map((device) => (
                        <tr key={device.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 transition-colors">
                            <td className="p-2 md:p-3 text-gray-800 dark:text-gray-200 font-mono text-xs md:text-sm truncate max-w-[100px] md:max-w-none">{device.id}</td>
                            <td className="p-2 md:p-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell text-xs md:text-sm">{device.type}</td>
                            <td className="p-2 md:p-3 text-gray-600 dark:text-gray-300 font-mono text-xs md:text-sm">{device.ip}</td>
                            <td className="p-2 md:p-3"><span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${device.status === 'Online' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : device.status === 'Warning' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>{device.status}</span></td>
                            <td className="p-2 md:p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell text-xs md:text-sm">{device.cpu}%</td>
                            <td className="p-2 md:p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell text-xs md:text-sm">{device.mem}%</td>
                            <td className="p-2 md:p-3 text-gray-600 dark:text-gray-300 hidden lg:table-cell text-xs md:text-sm">{formatUptime(device.bootTime)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </GlassPanel>
);

const DashboardView = ({ stats, bandwidthHistory, devices, loading = false, onShowAlerts }) => {
    const [timeRange, setTimeRange] = useState('1h');
    const categorizeDeviceStatus = (status = '') => {
        const normalized = status.toLowerCase();
        if (['online', 'up', 'healthy'].includes(normalized)) return 'Online';
        if (['warning', 'maintenance', 'degraded', 'rebooting', 'updating'].includes(normalized)) return 'Warning';
        return 'Offline';
    };

    const statusCounts = devices.reduce(
        (acc, device) => {
            const bucket = categorizeDeviceStatus(device.status);
            acc[bucket] += 1;
            return acc;
        },
        { Online: 0, Warning: 0, Offline: 0 }
    );
    const totalDevices = devices.length;
    const deviceStatusData = [
        { name: 'Online', value: statusCounts.Online, color: '#00C49F' },
        { name: 'Warning', value: statusCounts.Warning, color: '#FFBB28' },
        { name: 'Offline', value: statusCounts.Offline, color: '#FF8042' },
    ];

    const timeRanges = [
        { label: '1H', value: '1h', points: 12 },
        { label: '6H', value: '6h', points: 36 },
        { label: '24H', value: '24h', points: 48 },
        { label: '7D', value: '7d', points: 84 },
        { label: '30D', value: '30d', points: 90 }
    ];

    const currentRange = timeRanges.find(r => r.value === timeRange);
    const filteredBandwidthHistory = bandwidthHistory.slice(-currentRange.points);

    const bandwidthChange = stats.currentBandwidth < stats.bandwidthPeak 
        ? `-${((1 - stats.currentBandwidth / stats.bandwidthPeak) * 100).toFixed(0)}% from peak`
        : 'New Peak!';
    const bandwidthChangeType = stats.currentBandwidth < stats.bandwidthPeak ? 'decrease' : 'increase';

    const latencyChange = stats.avgLatency - stats.latencyBase;
    const latencyChangeText = `${latencyChange >= 0 ? '+' : ''}${latencyChange}ms from avg`;
    const latencyChangeType = latencyChange > 0 ? 'increase' : 'decrease';
    
    return (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                <StatCard icon="switch" title="Total Devices" value={totalDevices} change={`${statusCounts.Online} Online`} changeType="neutral" />
                <StatCard icon="activity" title="Bandwidth" value={`${stats.currentBandwidth} Gbps`} change={bandwidthChange} changeType={bandwidthChangeType}/>
                <StatCard icon="alert" title="Latency" value={`${stats.avgLatency} ms`} change={latencyChangeText} changeType={latencyChangeType}/>
                <StatCard icon="shield" title="Critical Alerts" value={stats.criticalAlerts} change="Click to view" changeType="neutral" onClick={onShowAlerts}/>
            </div>
            <NetworkTopologyMap devices={devices} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 auto-rows-max">
                <div className="lg:col-span-2">
                    <ChartCard title="Bandwidth Utilization" loading={loading}>
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {timeRanges.map(range => (
                                <button
                                    key={range.value}
                                    onClick={() => setTimeRange(range.value)}
                                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                                        timeRange === range.value
                                            ? 'bg-cyan-500 text-white'
                                            : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20'
                                    }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                         <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={filteredBandwidthHistory} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.1)" /><XAxis dataKey="name" stroke="#8884d8" fontSize={12} /><YAxis stroke="#8884d8" fontSize={12} unit="Mbps"/><Tooltip contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', border: '1px solid #00ffff' }} /><Legend /><Line type="monotone" dataKey="ingress" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 8 }}/><Line type="monotone" dataKey="egress" stroke="#82ca9d" strokeWidth={2} dot={false}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <div>
                     <ChartCard title="Device Status" loading={loading}>
                        <div className="space-y-3">
                            {deviceStatusData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-100/50 dark:bg-black/20 rounded-lg border border-cyan-500/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-lg text-gray-900 dark:text-white">{item.value}</span>
                                        <span className="text-xs text-gray-500 block">({((item.value / totalDevices) * 100).toFixed(0)}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                </div>
            </div>
            <DeviceTable devices={devices} />
        </div>
    );
}

const DnsRecordForm = ({ onSave, onCancel }) => {
    const [record, setRecord] = useState({ type: 'A', name: '', value: '', ttl: '3600' });
    
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                onSave({ ...record, id: Date.now(), ttl: parseInt(record.ttl) });
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel, record]);
    
    const handleChange = (e) => { const { name, value } = e.target; setRecord(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = (e) => { e.preventDefault(); onSave({ ...record, id: Date.now(), ttl: parseInt(record.ttl) }); };
    return (
        <GlassPanel className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Add DNS Record</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Record Type</label>
                    <select name="type" value={record.type} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition">
                        <option>A</option><option>AAAA</option><option>CNAME</option><option>MX</option><option>TXT</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Name</label>
                    <input name="name" value={record.name} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="e.g., www.example.com" />
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Value</label>
                    <input name="value" value={record.value} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="e.g., 192.0.2.1" />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">TTL</label>
                    <input name="ttl" type="number" value={record.ttl} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="Time to Live (in seconds)" />
                </div>
                <div className="md:col-span-2 flex justify-end gap-4 mt-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity">Save Record</button>
                </div>
            </form>
        </GlassPanel>
    );
};

const DnsView = ({ records, onAddRecord, onDeleteRecord, userRole = 'admin' }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const isReadOnly = userRole === 'viewer';
    const handleSave = (record) => { onAddRecord(record); setShowAddForm(false); };
    return (
        <div className="space-y-6">
            <GlassPanel className="p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">DNS Records</h3>
                {!isReadOnly && (
                    <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity">
                        <Icon name={showAddForm ? 'x' : 'plus'} className="w-5 h-5" />
                        <span>{showAddForm ? 'Cancel' : 'Add Record'}</span>
                    </button>
                )}
            </GlassPanel>
            {showAddForm && <DnsRecordForm onSave={handleSave} onCancel={() => setShowAddForm(false)} />}
            <GlassPanel className="p-4 overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20"><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Value</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">TTL</th>{!isReadOnly && <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>}</tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 transition-colors">
                                <td className="p-3 text-cyan-600 dark:text-cyan-300 font-mono text-sm">{record.type}</td><td className="p-3 text-gray-800 dark:text-gray-200 font-mono text-sm break-all">{record.name}</td><td className="p-3 text-gray-600 dark:text-gray-300 font-mono text-sm break-all">{record.value}</td><td className="p-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{record.ttl}</td>
                                {!isReadOnly && <td className="p-3"><button onClick={() => onDeleteRecord(record.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-full transition-colors"><Icon name="trash" className="w-5 h-5"/></button></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassPanel>
        </div>
    );
};

const AclRuleForm = ({ onSave, onCancel, initialData }) => {
    const isEditing = !!initialData;
    const [rule, setRule] = useState(
        initialData || { action: 'Allow', protocol: 'TCP', source: '', destination: '', port: '', description: '' }
    );

    useEffect(() => {
        if (initialData) {
            setRule(initialData);
        }
    }, [initialData]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') handleSubmit(e);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRule(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(rule);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <GlassPanel className="w-full max-w-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{isEditing ? 'Edit ACL Rule' : 'Add ACL Rule'}</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Action</label>
                        <select name="action" value={rule.action} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"><option>Allow</option><option>Deny</option></select>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Protocol</label>
                        <select name="protocol" value={rule.protocol} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"><option>TCP</option><option>UDP</option><option>ICMP</option><option>Any</option></select>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Source IP / CIDR</label>
                        <input name="source" value={rule.source} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="e.g., 192.168.1.0/24" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Destination IP / CIDR</label>
                        <input name="destination" value={rule.destination} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="e.g., any" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Port</label>
                        <input name="port" value={rule.port} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="e.g., 443 or any" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Description</label>
                        <input name="description" value={rule.description} onChange={handleChange} className="w-full p-3 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" placeholder="Rule description" />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-4 mt-2">
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity">{isEditing ? 'Update Rule' : 'Save Rule'}</button>
                    </div>
                </form>
            </GlassPanel>
        </div>
    );
};

const AclView = ({ rules, onAddRule, onEditRule, onDeleteRule, onToggleRule, onReorderRule, userRole = 'admin' }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [ruleToDelete, setRuleToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('rules');
    const isReadOnly = userRole === 'viewer';

    const [aclFeatures, setAclFeatures] = useState({
        addressReservations: [
            { id: 1, mac: '00:1A:2B:3C:4D:5E', ipAddress: '192.168.1.100', device: 'Printer', enabled: true },
            { id: 2, mac: 'A8:F2:78:9A:BC:DE', ipAddress: '192.168.1.101', device: 'NAS Storage', enabled: true }
        ],
        blacklist: [
            { id: 1, entry: '192.168.1.50', type: 'IP', reason: 'Suspicious activity', enabled: true },
            { id: 2, entry: '00:11:22:33:44:55', type: 'MAC', reason: 'Unauthorized device', enabled: true }
        ],
        whitelist: [
            { id: 1, entry: '192.168.1.1', type: 'IP', device: 'Router', enabled: true },
            { id: 2, entry: '08:00:27:BE:EF:01', type: 'MAC', device: 'Work PC', enabled: true }
        ],
        parentalControls: [
            { id: 1, device: 'Kid-Tablet', blockedCategories: ['Adult', 'Gaming', 'Social Media'], timeLimit: '2 hours', enabled: true },
            { id: 2, device: 'Guest-Device', blockedCategories: ['Adult'], timeLimit: 'Unlimited', enabled: false }
        ],
        qosRules: [
            { id: 1, device: 'Gaming PC', priority: 'High', bandwidth: '100 Mbps', protocol: 'All', enabled: true },
            { id: 2, device: 'Video Streaming', priority: 'Medium', bandwidth: '50 Mbps', protocol: 'TCP', enabled: true }
        ]
    });

    const handleSave = (rule) => {
        if (rule.id) {
            onEditRule(rule);
        } else {
            onAddRule({ ...rule, id: Date.now(), enabled: true, hits: 0, lastModified: new Date().toLocaleString() });
        }
        closeForm();
    };
    
    const openForm = (rule = null) => {
        setEditingRule(rule);
        setShowForm(true);
    };

    const closeForm = () => {
        setEditingRule(null);
        setShowForm(false);
    };

    const handleDeleteClick = (rule) => {
        setRuleToDelete(rule);
    };

    const confirmDelete = () => {
        if (ruleToDelete) {
            onDeleteRule(ruleToDelete.id);
        }
        setRuleToDelete(null);
    };

    const handleAclUpdate = (featureType, action, data) => {
        setAclFeatures(prev => {
            const key = featureType === 'addressReservation' ? 'addressReservations' 
                      : featureType === 'blacklist' ? 'blacklist'
                      : featureType === 'whitelist' ? 'whitelist'
                      : featureType === 'parentalControl' ? 'parentalControls'
                      : 'qosRules';
            
            if (action === 'add') {
                return { ...prev, [key]: [...prev[key], data] };
            } else if (action === 'edit') {
                return { ...prev, [key]: prev[key].map(item => item.id === data.id ? data : item) };
            } else if (action === 'delete') {
                return { ...prev, [key]: prev[key].filter(item => item.id !== data.id) };
            }
            return prev;
        });
    };

    const tabs = [
        { id: 'rules', label: 'Access Rules', icon: 'shield' },
        { id: 'addressReservation', label: 'Address Reservation', icon: 'network' },
        { id: 'blacklist', label: 'Blacklist', icon: 'x' },
        { id: 'whitelist', label: 'Whitelist', icon: 'sparkles' },
        { id: 'parentalControl', label: 'Parental Control', icon: 'lock' },
        { id: 'qos', label: 'QoS (Quality of Service)', icon: 'activity' }
    ];
    
    return (
        <div className="space-y-6">
            <GlassPanel className="p-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Access Control & Network Management</h3>
                <div className="flex flex-wrap gap-1 md:gap-2 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 md:px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'bg-cyan-500 text-white font-semibold'
                                    : 'bg-gray-300/20 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 hover:bg-cyan-500/20'
                            }`}
                        >
                            <Icon name={tab.icon} className="w-4 h-4" />
                            <span className="text-xs md:text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </GlassPanel>

            {activeTab === 'rules' && (
                <>
                    <GlassPanel className="p-4 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Access Control Rules</h3>
                        {!isReadOnly && (
                            <button onClick={() => openForm()} className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity text-sm">
                                <Icon name={'plus'} className="w-5 h-5" />
                                <span>Add Rule</span>
                            </button>
                        )}
                    </GlassPanel>

                    {showForm && <AclRuleForm onSave={handleSave} onCancel={closeForm} initialData={editingRule} />}
                    
                    {ruleToDelete && (
                        <ConfirmationModal
                            title="Delete ACL Rule"
                            message={`Are you sure you want to delete this rule? (Source: ${ruleToDelete.source}, Action: ${ruleToDelete.action})`}
                            onConfirm={confirmDelete}
                            onCancel={() => setRuleToDelete(null)}
                            confirmText="Delete"
                            confirmColor="red"
                        />
                    )}

                    <GlassPanel className="p-4 overflow-x-auto">
                        <table className="w-full text-left table-auto text-sm">
                            <thead>
                                <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                                    <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300 w-24">Order</th>
                                    <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300">Action</th>
                                    <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Protocol</th>
                                    <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300">Source</th>
                                    <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Destination</th>
                                    <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Port</th>
                                    <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300">Hits</th>
                                    {!isReadOnly && <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule, index) => (
                                    <tr key={rule.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 group">
                                        <td className="p-2 md:p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-cyan-600 dark:text-cyan-300 text-xs md:text-sm">{index + 1}</span>
                                                {!isReadOnly && (
                                                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => onReorderRule(index, 'up')} disabled={index === 0} className="disabled:opacity-20"><Icon name="arrowUp" className="w-3 h-3" /></button>
                                                        <button onClick={() => onReorderRule(index, 'down')} disabled={index === rules.length - 1} className="disabled:opacity-20"><Icon name="arrowDown" className="w-3 h-3" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-2 md:p-3"><ToggleSwitch enabled={rule.enabled} onChange={isReadOnly ? () => {} : () => onToggleRule(rule.id)} /></td>
                                        <td className="p-2 md:p-3 font-mono text-xs md:text-sm"><span className={rule.action === 'Allow' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{rule.action}</span></td>
                                        <td className="p-2 md:p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell text-xs">{rule.protocol}</td>
                                        <td className="p-2 md:p-3 text-gray-800 dark:text-gray-200 font-mono text-xs break-all">{rule.source}</td>
                                        <td className="p-2 md:p-3 text-gray-600 dark:text-gray-300 font-mono text-xs hidden sm:table-cell break-all">{rule.destination}</td>
                                        <td className="p-2 md:p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell text-xs">{rule.port}</td>
                                        <td className="p-2 md:p-3 text-yellow-600 dark:text-yellow-300 font-mono text-xs md:text-sm">{rule.hits.toLocaleString()}</td>
                                        {!isReadOnly && (
                                            <td className="p-2 md:p-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openForm(rule)} className="p-1 text-blue-500 dark:text-blue-400 hover:bg-blue-500/20 rounded-full transition-colors"><Icon name="edit" className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteClick(rule)} className="p-1 text-red-500 dark:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"><Icon name="trash" className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassPanel>
                </>
            )}

            {activeTab === 'addressReservation' && (
                <AclFeaturePanel 
                    title="IP Address Reservation" 
                    description="Reserve fixed IP addresses for specific devices"
                    items={aclFeatures.addressReservations} 
                    columns={['mac', 'ipAddress', 'device']}
                    columnLabels={{ mac: 'MAC Address', ipAddress: 'Reserved IP', device: 'Device Name' }}
                    isReadOnly={isReadOnly}
                    featureType="addressReservation"
                    onUpdate={handleAclUpdate}
                />
            )}

            {activeTab === 'blacklist' && (
                <AclFeaturePanel 
                    title="Blacklist" 
                    description="Block specific IP addresses or MAC addresses from accessing the network"
                    items={aclFeatures.blacklist} 
                    columns={['entry', 'type', 'reason']}
                    columnLabels={{ entry: 'IP/MAC', type: 'Type', reason: 'Reason' }}
                    isReadOnly={isReadOnly}
                    featureType="blacklist"
                    onUpdate={handleAclUpdate}
                />
            )}

            {activeTab === 'whitelist' && (
                <AclFeaturePanel 
                    title="Whitelist" 
                    description="Allow only specific devices to access the network"
                    items={aclFeatures.whitelist} 
                    columns={['entry', 'type', 'device']}
                    columnLabels={{ entry: 'IP/MAC', type: 'Type', device: 'Device Name' }}
                    isReadOnly={isReadOnly}
                    featureType="whitelist"
                    onUpdate={handleAclUpdate}
                />
            )}

            {activeTab === 'parentalControl' && (
                <AclFeaturePanel 
                    title="Parental Control" 
                    description="Control access to websites and manage usage time for specific devices"
                    items={aclFeatures.parentalControls} 
                    columns={['device', 'blockedCategories', 'timeLimit']}
                    columnLabels={{ device: 'Device', blockedCategories: 'Blocked Categories', timeLimit: 'Daily Time Limit' }}
                    isReadOnly={isReadOnly}
                    featureType="parentalControl"
                    onUpdate={handleAclUpdate}
                />
            )}

            {activeTab === 'qos' && (
                <AclFeaturePanel 
                    title="Quality of Service (QoS)" 
                    description="Prioritize network traffic and manage bandwidth allocation"
                    items={aclFeatures.qosRules} 
                    columns={['device', 'priority', 'bandwidth', 'protocol']}
                    columnLabels={{ device: 'Device/Service', priority: 'Priority', bandwidth: 'Bandwidth', protocol: 'Protocol' }}
                    isReadOnly={isReadOnly}
                    featureType="qos"
                    onUpdate={handleAclUpdate}
                />
            )}
        </div>
    );
};

const AclFeaturePanel = ({ title, description, items, columns, columnLabels, isReadOnly, featureType, onUpdate }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [itemToDelete, setItemToDelete] = useState(null);

    const openForm = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            setEditingItem(null);
            setFormData({});
        }
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({});
    };

    const handleSave = () => {
        if (!formData.id) formData.id = Date.now();
        onUpdate(featureType, editingItem ? 'edit' : 'add', formData);
        closeForm();
    };

    const handleDelete = (item) => {
        onUpdate(featureType, 'delete', item);
        setItemToDelete(null);
    };

    const renderFormFields = () => {
        switch (featureType) {
            case 'addressReservation':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">MAC Address</label>
                            <input
                                type="text"
                                placeholder="00:1A:2B:3C:4D:5E"
                                value={formData.mac || ''}
                                onChange={(e) => setFormData({ ...formData, mac: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reserved IP Address</label>
                            <input
                                type="text"
                                placeholder="192.168.1.100"
                                value={formData.ipAddress || ''}
                                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Device Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Printer, NAS Storage"
                                value={formData.device || ''}
                                onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </>
                );
            case 'blacklist':
            case 'whitelist':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{featureType === 'blacklist' ? 'IP/MAC to Block' : 'IP/MAC to Allow'}</label>
                            <input
                                type="text"
                                placeholder="192.168.1.50 or 00:11:22:33:44:55"
                                value={formData.entry || ''}
                                onChange={(e) => setFormData({ ...formData, entry: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type</label>
                            <select
                                value={formData.type || 'IP'}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                            >
                                <option>IP</option>
                                <option>MAC</option>
                            </select>
                        </div>
                        {featureType === 'blacklist' ? (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reason</label>
                                <input
                                    type="text"
                                    placeholder="Reason for blocking"
                                    value={formData.reason || ''}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Device Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Work PC"
                                    value={formData.device || ''}
                                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        )}
                    </>
                );
            case 'parentalControl':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Device Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Kid-Tablet"
                                value={formData.device || ''}
                                onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Blocked Categories (comma-separated)</label>
                            <input
                                type="text"
                                placeholder="Adult, Gaming, Social Media"
                                value={Array.isArray(formData.blockedCategories) ? formData.blockedCategories.join(', ') : ''}
                                onChange={(e) => setFormData({ ...formData, blockedCategories: e.target.value.split(',').map(c => c.trim()) })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Daily Time Limit</label>
                            <input
                                type="text"
                                placeholder="e.g., 2 hours or Unlimited"
                                value={formData.timeLimit || ''}
                                onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </>
                );
            case 'qos':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Device/Service Name</label>
                            <input
                                type="text"
                                placeholder="e.g., Gaming PC, Video Streaming"
                                value={formData.device || ''}
                                onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                            <select
                                value={formData.priority || 'Medium'}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                            >
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bandwidth Limit</label>
                            <select
                                value={formData.bandwidth || 'No Limit'}
                                onChange={(e) => setFormData({ ...formData, bandwidth: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                            >
                                <option>No Limit</option>
                                <option>10 Mbps</option>
                                <option>25 Mbps</option>
                                <option>50 Mbps</option>
                                <option>100 Mbps</option>
                                <option>250 Mbps</option>
                                <option>500 Mbps</option>
                                <option>1 Gbps</option>
                                <option>2.5 Gbps</option>
                                <option>5 Gbps</option>
                                <option>10 Gbps</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Protocol</label>
                            <select
                                value={formData.protocol || 'All'}
                                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-700 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                            >
                                <option>All</option>
                                <option>TCP</option>
                                <option>UDP</option>
                                <option>ICMP</option>
                            </select>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <GlassPanel className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
                    </div>
                    {!isReadOnly && (
                        <button onClick={() => openForm()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity text-sm whitespace-nowrap">
                            <Icon name="plus" className="w-4 h-4" />
                            Add
                        </button>
                    )}
                </div>
            </GlassPanel>

            {showForm && (
                <GlassPanel className="p-4 border-2 border-cyan-500/50">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{editingItem ? 'Edit' : 'Add New'}</h4>
                        <button onClick={closeForm} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                            <Icon name="x" className="w-5 h-5" />
                        </button>
                    </div>
                    {renderFormFields()}
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={closeForm}
                            className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-semibold transition-opacity"
                        >
                            Save
                        </button>
                    </div>
                </GlassPanel>
            )}

            {itemToDelete && (
                <ConfirmationModal
                    title="Delete Entry"
                    message={`Are you sure you want to delete this entry?`}
                    onConfirm={() => handleDelete(itemToDelete)}
                    onCancel={() => setItemToDelete(null)}
                    confirmText="Delete"
                    confirmColor="red"
                />
            )}

            <GlassPanel className="p-4 overflow-x-auto">
                <table className="w-full text-left table-auto text-xs md:text-sm">
                    <thead>
                        <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                            <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                            {columns.map(col => (
                                <th key={col} className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300">{columnLabels[col]}</th>
                            ))}
                            {!isReadOnly && <th className="p-2 md:p-3 font-semibold text-gray-700 dark:text-gray-300">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10">
                                <td className="p-2 md:p-3"><ToggleSwitch enabled={item.enabled} onChange={() => {}} /></td>
                                {columns.map(col => (
                                    <td key={col} className="p-2 md:p-3 text-gray-700 dark:text-gray-300 break-words">
                                        {Array.isArray(item[col]) ? item[col].join(', ') : item[col]}
                                    </td>
                                ))}
                                {!isReadOnly && (
                                    <td className="p-2 md:p-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openForm(item)} className="p-1 text-blue-500 dark:text-blue-400 hover:bg-blue-500/20 rounded transition-colors"><Icon name="edit" className="w-4 h-4"/></button>
                                            <button onClick={() => setItemToDelete(item)} className="p-1 text-red-500 dark:text-red-400 hover:bg-red-500/20 rounded transition-colors"><Icon name="trash" className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassPanel>
        </>
    );
};
const SpeedTestModal = ({ onClose }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <GlassPanel className="w-full max-w-4xl h-[80vh] p-0 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-cyan-500/20 dark:border-cyan-300/20">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Live Speed Test</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-cyan-500/20">
                    <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                </button>
            </div>
            <div className="flex-grow p-4">
                <iframe
                    src="https://openspeedtest.com/speedtest"
                    className="w-full h-full border-0 rounded-lg"
                    title="OpenSpeedTest"
                ></iframe>
            </div>
        </GlassPanel>
    </div>
    );
};

const CLITerminal = () => {
    const [commands, setCommands] = useState([]);
    const [input, setInput] = useState('');
    const terminalRef = useRef(null);

    const processCommand = (cmd) => {
        const timestamp = new Date().toLocaleTimeString();
        let response = '';
        const cmdLower = cmd.toLowerCase().trim();

        if (cmdLower.startsWith('ping')) {
            const parts = cmdLower.split(' ');
            const target = parts[1] || '8.8.8.8';
            response = `PING ${target} (${target}): 56 data bytes\n64 bytes from ${target}: icmp_seq=0 ttl=64 time=25.3 ms\n64 bytes from ${target}: icmp_seq=1 ttl=64 time=24.8 ms\n--- ${target} statistics ---\n2 packets transmitted, 2 received, 0% packet loss`;
        } else if (cmdLower === 'telnet') {
            response = 'telnet> Trying 192.168.1.1...\nConnected to network device\nConnected (ESC to disconnect)\nCiscoRouter#';
        } else if (cmdLower.startsWith('update')) {
            response = 'Checking for updates...\n[########## 100%]\nDevice firmware updated successfully.\nPlease reboot to apply changes.\nType "reboot" to restart.';
        } else if (cmdLower === 'reboot') {
            response = 'Rebooting device in 5 seconds...\n4...\n3...\n2...\n1...\nDevice is rebooting...';
        } else if (cmdLower === 'ifconfig' || cmdLower === 'ipconfig') {
            response = 'eth0: 172.16.1.1 netmask 255.255.0.0\neth1: 192.168.1.1 netmask 255.255.255.0\neth2: CONNECTED\nPPP: DOWN';
        } else if (cmdLower === 'route') {
            response = 'Kernel IP routing table\nDestination     Gateway         Genmask\n0.0.0.0         192.168.1.1     0.0.0.0\n172.16.0.0      0.0.0.0         255.255.0.0\n192.168.1.0     0.0.0.0         255.255.255.0';
        } else if (cmdLower === 'show interfaces') {
            response = 'Interface    IP-Address      Status\neth0         172.16.1.1      UP\neth1         192.168.1.1     UP\neth2         unassigned      DOWN';
        } else if (cmdLower === 'help') {
            response = 'Available commands:\n- ping [ip] - Test connectivity\n- telnet - Connect to remote device\n- ifconfig/ipconfig - Show interfaces\n- route - Show routing table\n- update - Check and install updates\n- reboot - Restart device\n- show interfaces - Display interfaces\n- clear - Clear terminal';
        } else if (cmdLower === 'clear') {
            setCommands([]);
            return;
        } else {
            response = `Command not found: ${cmd}\nType "help" for available commands.`;
        }

        setCommands(prev => [...prev, { input: cmd, output: response, timestamp }]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            processCommand(input);
            setInput('');
        }
    };

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [commands]);

    return (
        <div className="bg-black/80 border border-green-500/50 rounded p-4 font-mono text-sm">
            <div ref={terminalRef} className="h-64 overflow-y-auto mb-3 space-y-2">
                <div className="text-green-400">Welcome to Network CLI Terminal</div>
                <div className="text-green-400">Type "help" for available commands</div>
                {commands.map((cmd, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="text-cyan-400">{`$ ${cmd.input}`}</div>
                        <div className="text-green-400 whitespace-pre-wrap">{cmd.output}</div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <span className="text-green-400">$</span>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 bg-transparent text-green-400 outline-none border-none"
                    placeholder="Enter command..."
                    autoFocus
                />
            </form>
        </div>
    );
};

const NetworkHealthView = ({ yearlyBandwidthData, onStartSpeedTest, loading = false }) => {
    const [pingStatus, setPingStatus] = useState({ testing: false, latency: null, status: 'Idle' });
    const [showCLI, setShowCLI] = useState(false);

    const handlePingTest = () => {
        setPingStatus({ testing: true, latency: null, status: 'Pinging...' });
        setTimeout(() => {
            const success = Math.random() > 0.1;
            if (success) {
                const latency = Math.floor(Math.random() * 50) + 10;
                setPingStatus({ testing: false, latency: latency, status: `Success (${latency}ms)` });
            } else {
                setPingStatus({ testing: false, latency: null, status: 'Failed (Timeout)' });
            }
        }, 2000);
    };

    const getStatusColor = (status) => {
        if (status.startsWith('Success')) return 'text-green-600 dark:text-green-400';
        if (status.startsWith('Failed')) return 'text-red-600 dark:text-red-400';
        return 'text-yellow-600 dark:text-yellow-400';
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <GlassPanel className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Internet Connectivity</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Ping to 8.8.8.8</p>
                        </div>
                        <button onClick={handlePingTest} disabled={pingStatus.testing} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                            <Icon name="activity" className={`w-5 h-5 ${pingStatus.testing ? 'animate-pulse' : ''}`} />
                            <span>{pingStatus.testing ? 'Pinging...' : 'Run Test'}</span>
                        </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-cyan-500/10 dark:border-cyan-300/10 flex items-center justify-center text-center">
                        <p className={`text-2xl font-mono font-bold ${getStatusColor(pingStatus.status)}`}>{pingStatus.status}</p>
                    </div>
                </GlassPanel>

                <GlassPanel className="p-6">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Network Speed Test</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Live test via OpenSpeedTest</p>
                        </div>
                        <button onClick={onStartSpeedTest} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:opacity-90 transition-opacity">
                           <Icon name="wifi" className="w-5 h-5" />
                            <span>Start Test</span>
                        </button>
                    </div>
                     <div className="mt-4 pt-4 border-t border-cyan-500/10 dark:border-cyan-300/10 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Click "Start Test" to open the live speed test in a modal window.</p>
                    </div>
                </GlassPanel>
            </div>
            
            <GlassPanel className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Network CLI Terminal</h3>
                    <button onClick={() => setShowCLI(!showCLI)} className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors">
                        {showCLI ? 'Hide' : 'Open'} Terminal
                    </button>
                </div>
                {showCLI && <CLITerminal />}
            </GlassPanel>
            
            <ChartCard title="Yearly Bandwidth Usage" loading={loading}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yearlyBandwidthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.1)" />
                        <XAxis dataKey="month" stroke="#8884d8" fontSize={12} />
                        <YAxis stroke="#8884d8" fontSize={12} unit=" TB" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', border: '1px solid #00ffff' }} cursor={{fill: 'rgba(0, 255, 255, 0.1)'}} />
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                        <Bar dataKey="usage" name="Usage (TB)" fill="url(#colorUv)" />
                         <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
};

const WirelessView = ({ devices, onScan, isScanning, userRole = 'admin' }) => {
    const [scanRange, setScanRange] = useState({ start: '192.168.2.1', end: '192.168.2.254' });
    const [autoScan, setAutoScan] = useState(false);
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState({ key: 'ssid', direction: 'asc' });
    const isReadOnly = userRole === 'viewer';

    const handleSort = (key) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedAndFilteredDevices = devices
        .filter(d => Object.values(d).some(val => String(val).toLowerCase().includes(filter.toLowerCase())))
        .sort((a, b) => {
            const valA = a[sort.key];
            const valB = b[sort.key];
            if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    
    const renderSortArrow = (key) => {
        if (sort.key !== key) return null;
        return sort.direction === 'asc' ? <Icon name="chevronUp" className="w-4 h-4 ml-1" /> : <Icon name="chevronDown" className="w-4 h-4 ml-1" />;
    };

    return (
        <div className="space-y-6">
            <GlassPanel className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Scan Start IP</label>
                        <input value={scanRange.start} onChange={e => setScanRange(p => ({...p, start: e.target.value}))} className="w-full p-2 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Scan End IP</label>
                        <input value={scanRange.end} onChange={e => setScanRange(p => ({...p, end: e.target.value}))} className="w-full p-2 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Auto Scan</label>
                        <ToggleSwitch enabled={autoScan} onChange={isReadOnly ? () => {} : () => setAutoScan(!autoScan)} />
                    </div>
                    {!isReadOnly && (
                        <button onClick={() => onScan(scanRange)} disabled={isScanning} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                            <Icon name={isScanning ? 'activity' : 'search'} className={`w-5 h-5 ${isScanning ? 'animate-pulse' : ''}`} />
                            <span>{isScanning ? 'Scanning...' : 'Scan Network'}</span>
                        </button>
                    )}
                </div>
            </GlassPanel>

            <GlassPanel className="p-4 overflow-x-auto">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Wireless Devices</h3>
                    <div className="relative">
                        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter devices..." className="w-full md:w-64 p-2 pl-8 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition" />
                        <Icon name="search" className="w-5 h-5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                    </div>
                </div>

                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                            {['ssid', 'mac', 'ip', 'signal', 'status', 'type'].map(key => (
                                <th key={key} className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize cursor-pointer hover:text-cyan-500 dark:hover:text-cyan-300" onClick={() => handleSort(key)}>
                                    <div className="flex items-center">{key.replace('_', ' ')} {renderSortArrow(key)}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredDevices.map((device) => (
                            <tr key={device.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 transition-colors">
                                <td className="p-3 text-cyan-600 dark:text-cyan-300 font-mono text-sm">{device.ssid}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-200 font-mono text-sm break-all">{device.mac}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300 font-mono text-sm break-all">{device.ip}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{device.signal} dBm</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${device.status === 'Connected' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'}`}>
                                        {device.status}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-500 dark:text-gray-400 text-sm">{device.type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassPanel>
        </div>
    );
};

const SettingsSection = ({ title, children, isOpen, onToggle }) => (
    <GlassPanel className="p-0">
        <button onClick={onToggle} className="w-full p-4 flex justify-between items-center text-left hover:bg-cyan-500/5 transition-colors">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            <Icon name={isOpen ? "chevronUp" : "chevronDown"} className="w-6 h-6 text-cyan-500 dark:text-cyan-400 transition-transform" />
        </button>
        {isOpen && (
            <div className="p-4 border-t border-cyan-500/20 dark:border-cyan-300/10 space-y-4">
                {children}
            </div>
        )}
    </GlassPanel>
);

const UserAccessControl = () => {
    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('systemUsers');
        return saved ? JSON.parse(saved) : [
            { id: 1, username: 'admin', email: 'adityaraj3136@gmail.com', role: 'admin', status: 'active', lastLogin: new Date().toISOString() },
            { id: 2, username: 'viewer', email: 'viewer@nms.local', role: 'viewer', status: 'active', lastLogin: new Date().toISOString() }
        ];
    });
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', email: '', role: 'viewer', password: '' });

    const saveUsers = (updatedUsers) => {
        setUsers(updatedUsers);
        localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
    };

    const handleAddUser = () => {
        if (!newUser.username || !newUser.email || !newUser.password) return;
        const user = {
            id: Date.now(),
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            status: 'active',
            lastLogin: null
        };
        saveUsers([...users, user]);
        setNewUser({ username: '', email: '', role: 'viewer', password: '' });
        setShowAddUser(false);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
    };

    const handleSaveEdit = () => {
        saveUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setEditingUser(null);
    };

    const handleDeleteUser = (userId) => {
        if (userId === 1) return; // Prevent deleting main admin
        if (confirm('Are you sure you want to delete this user?')) {
            saveUsers(users.filter(u => u.id !== userId));
        }
    };

    const toggleUserStatus = (userId) => {
        saveUsers(users.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'disabled' : 'active' } : u));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <p className="text-gray-700 dark:text-gray-300">Manage system users, roles, and access permissions</p>
                <button onClick={() => setShowAddUser(!showAddUser)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                    <span className="flex items-center gap-2">
                        <Icon name="userPlus" className="w-4 h-4"/>
                        Add User
                    </span>
                </button>
            </div>

            {showAddUser && (
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Add New User</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="p-2 bg-white dark:bg-black/30 border border-cyan-500/20 rounded-lg text-gray-900 dark:text-white"/>
                        <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="p-2 bg-white dark:bg-black/30 border border-cyan-500/20 rounded-lg text-gray-900 dark:text-white"/>
                        <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="p-2 bg-white dark:bg-black/30 border border-cyan-500/20 rounded-lg text-gray-900 dark:text-white"/>
                        <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="p-2 bg-white dark:bg-black/30 border border-cyan-500/20 rounded-lg text-gray-900 dark:text-white">
                            <option value="viewer">Viewer (Read-Only)</option>
                            <option value="admin">Admin (Full Access)</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAddUser} className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:opacity-90">Create User</button>
                        <button onClick={() => setShowAddUser(false)} className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:opacity-90">Cancel</button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                        <tr>
                            <th className="p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Username</th>
                            <th className="p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Email</th>
                            <th className="p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Role</th>
                            <th className="p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Status</th>
                            <th className="p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Last Login</th>
                            <th className="p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/5">
                                {editingUser?.id === user.id ? (
                                    <>
                                        <td className="p-3"><input value={editingUser.username} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className="p-1 bg-white dark:bg-black/30 border border-cyan-500/20 rounded text-gray-900 dark:text-white" disabled={user.id === 1}/></td>
                                        <td className="p-3"><input value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="p-1 bg-white dark:bg-black/30 border border-cyan-500/20 rounded text-gray-900 dark:text-white" disabled={user.id === 1}/></td>
                                        <td className="p-3">
                                            {user.id === 1 ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400">Admin (Locked)</span>
                                            ) : (
                                                <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} className="p-1 bg-white dark:bg-black/30 border border-cyan-500/20 rounded text-gray-900 dark:text-white">
                                                    <option value="viewer">Viewer</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            )}
                                        </td>
                                        <td className="p-3"><span className="capitalize text-gray-700 dark:text-gray-300">{user.status}</span></td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveEdit} className="p-1 hover:bg-green-500/20 rounded"><Icon name="check" className="w-4 h-4 text-green-500"/></button>
                                                <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-red-500/20 rounded"><Icon name="x" className="w-4 h-4 text-red-500"/></button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-3 font-semibold text-gray-900 dark:text-white">{user.username}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{user.email}</td>
                                        <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{user.role === 'admin' ? 'Admin' : 'Viewer'}</span></td>
                                        <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{user.status}</span></td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                {user.id === 1 ? (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">Protected</span>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleEditUser(user)} className="p-1 hover:bg-cyan-500/20 rounded"><Icon name="edit" className="w-4 h-4 text-cyan-500"/></button>
                                                        <button onClick={() => toggleUserStatus(user.id)} className="p-1 hover:bg-yellow-500/20 rounded"><Icon name={user.status === 'active' ? 'lock' : 'unlock'} className="w-4 h-4 text-yellow-500"/></button>
                                                        <button onClick={() => handleDeleteUser(user.id)} className="p-1 hover:bg-red-500/20 rounded"><Icon name="trash" className="w-4 h-4 text-red-500"/></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 p-4 bg-gray-100/50 dark:bg-black/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Role Permissions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-bold text-purple-500 mb-2">Admin Role</p>
                        <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                            <li>✓ Full read/write access</li>
                            <li>✓ Manage users and settings</li>
                            <li>✓ Configure devices</li>
                            <li>✓ Access all features</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-bold text-blue-500 mb-2">Viewer Role</p>
                        <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                            <li>✓ Read-only access</li>
                            <li>✓ View dashboards and reports</li>
                            <li>✗ Cannot modify settings</li>
                            <li>✗ Cannot manage users</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LogsAudit = () => {
    const [logs, setLogs] = useState(() => JSON.parse(localStorage.getItem('auditLogs') || '[]'));
    useEffect(() => {
        const id = setInterval(() => setLogs(JSON.parse(localStorage.getItem('auditLogs') || '[]')), 2000);
        return () => clearInterval(id);
    }, []);
    
    const handleClearLogs = () => {
        if (window.confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
            localStorage.removeItem('auditLogs');
            setLogs([]);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={handleClearLogs} className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors font-semibold text-sm">
                    Clear All Logs
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                        <tr>
                            <th className="p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Time</th>
                            <th className="p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Event</th>
                            <th className="p-3 text-sm font-bold text-gray-700 dark:text-gray-300">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.slice().reverse().map((l, i) => (
                            <tr key={i} className="border-b border-cyan-500/10 dark:border-cyan-300/10">
                                <td className="p-3 text-cyan-600 dark:text-cyan-300 font-mono text-xs">{new Date(l.ts).toLocaleString()}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-200 font-semibold">{l.event}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300 text-sm break-all">{JSON.stringify(l.details)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Syslog Viewer Component
const SyslogViewerModal = ({ onClose, devices }) => {
    const [syslogs, setSyslogs] = useState([]);
    const [filter, setFilter] = useState({ severity: 'all', device: 'all', search: '' });
    const logContainerRef = useRef(null);

    const severities = ['Critical', 'Error', 'Warning', 'Info', 'Debug'];

    useEffect(() => {
        const generateInitialLogs = () => {
            const logs = [];
            const now = Date.now();
            for (let i = 0; i < 50; i++) {
                const device = devices[Math.floor(Math.random() * devices.length)];
                const severity = severities[Math.floor(Math.random() * severities.length)];
                const messages = {
                    'Critical': [`Interface eth0 down on ${device.id}`, `Power supply failure on ${device.id}`, `Temperature critical: 85°C on ${device.id}`],
                    'Error': [`Failed authentication attempt from 192.168.1.${Math.floor(Math.random() * 255)}`, `Port eth${Math.floor(Math.random() * 24)} link down`, `BGP peer ${device.ip} disconnected`],
                    'Warning': [`High CPU usage: ${70 + Math.floor(Math.random() * 25)}% on ${device.id}`, `Memory utilization at ${75 + Math.floor(Math.random() * 15)}%`, `Disk space low: ${15 + Math.floor(Math.random() * 10)}% remaining`],
                    'Info': [`Port eth${Math.floor(Math.random() * 24)} link up`, `Configuration saved on ${device.id}`, `User admin logged in from 10.0.0.${Math.floor(Math.random() * 255)}`],
                    'Debug': [`VLAN ${Math.floor(Math.random() * 100)} updated`, `ARP entry added for 10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, `Keepalive sent to ${device.ip}`]
                };
                logs.push({
                    id: i,
                    timestamp: new Date(now - (50 - i) * 60000),
                    device: device.id,
                    severity,
                    message: messages[severity][Math.floor(Math.random() * messages[severity].length)]
                });
            }
            return logs;
        };
        setSyslogs(generateInitialLogs());

        const interval = setInterval(() => {
            setSyslogs(prev => {
                const device = devices[Math.floor(Math.random() * devices.length)];
                const severity = severities[Math.floor(Math.random() * severities.length)];
                const messages = {
                    'Critical': [`Interface failure on ${device.id}`, `System crash on ${device.id}`],
                    'Error': [`Connection timeout to ${device.ip}`, `Authentication failed`],
                    'Warning': [`High latency detected`, `Buffer overflow warning`],
                    'Info': [`Port status changed`, `Configuration updated`],
                    'Debug': [`Keepalive packet received`, `Cache updated`]
                };
                const newLog = {
                    id: Date.now(),
                    timestamp: new Date(),
                    device: device.id,
                    severity,
                    message: messages[severity][Math.floor(Math.random() * messages[severity].length)]
                };
                return [...prev.slice(-99), newLog];
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [devices]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [syslogs]);

    const filteredLogs = syslogs.filter(log => {
        if (filter.severity !== 'all' && log.severity !== filter.severity) return false;
        if (filter.device !== 'all' && log.device !== filter.device) return false;
        if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
        return true;
    });

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'Critical': return 'text-red-600 dark:text-red-400 bg-red-500/10';
            case 'Error': return 'text-orange-600 dark:text-orange-400 bg-orange-500/10';
            case 'Warning': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10';
            case 'Info': return 'text-blue-600 dark:text-blue-400 bg-blue-500/10';
            case 'Debug': return 'text-gray-600 dark:text-gray-400 bg-gray-500/10';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <GlassPanel className="w-full max-w-6xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">System Logs (Syslog)</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
                </div>
                <div className="p-4 border-b border-cyan-500/20 flex gap-4 flex-wrap">
                    <select
                        value={filter.severity}
                        onChange={e => setFilter(prev => ({ ...prev, severity: e.target.value }))}
                        className="px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                    >
                        <option value="all">All Severities</option>
                        {severities.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        value={filter.device}
                        onChange={e => setFilter(prev => ({ ...prev, device: e.target.value }))}
                        className="px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                    >
                        <option value="all">All Devices</option>
                        {devices.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
                    </select>
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={filter.search}
                        onChange={e => setFilter(prev => ({ ...prev, search: e.target.value }))}
                        className="flex-1 min-w-[200px] px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                    />
                </div>
                <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="flex gap-3 hover:bg-cyan-500/5 p-1 rounded">
                            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {log.timestamp.toLocaleTimeString()}
                            </span>
                            <span className={`px-2 rounded whitespace-nowrap ${getSeverityColor(log.severity)}`}>
                                {log.severity}
                            </span>
                            <span className="text-cyan-600 dark:text-cyan-400 whitespace-nowrap">{log.device}</span>
                            <span className="text-gray-700 dark:text-gray-300 flex-1">{log.message}</span>
                        </div>
                    ))}
                </div>
            </GlassPanel>
        </div>
    );
};

// Config Backup/Restore Component
const ConfigBackupModal = ({ onClose, devices }) => {
    const [configs, setConfigs] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('all');

    useEffect(() => {
        const savedConfigs = JSON.parse(localStorage.getItem('deviceConfigs') || '[]');
        setConfigs(savedConfigs);
    }, []);

    const handleBackup = () => {
        const newBackup = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            device: selectedDevice,
            version: `v${Math.floor(Math.random() * 20) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`,
            size: `${(Math.random() * 500 + 50).toFixed(1)} KB`,
            config: JSON.stringify({ backup: 'data', device: selectedDevice })
        };
        const updatedConfigs = [...configs, newBackup];
        setConfigs(updatedConfigs);
        localStorage.setItem('deviceConfigs', JSON.stringify(updatedConfigs));
    };

    const handleRestore = (config) => {
        if (confirm(`Restore configuration from ${new Date(config.timestamp).toLocaleString()} for ${config.device}?`)) {
            alert(`Configuration restored successfully for ${config.device}`);
        }
    };

    const handleDelete = (id) => {
        const updatedConfigs = configs.filter(c => c.id !== id);
        setConfigs(updatedConfigs);
        localStorage.setItem('deviceConfigs', JSON.stringify(updatedConfigs));
    };

    const handleExport = (config) => {
        const blob = new Blob([config.config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.device}_${new Date(config.timestamp).toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <GlassPanel className="w-full max-w-4xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center sticky top-0 bg-inherit">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Configuration Backup & Restore</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
                </div>
                <div className="p-4 border-b border-cyan-500/20">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Device</label>
                            <select
                                value={selectedDevice}
                                onChange={e => setSelectedDevice(e.target.value)}
                                className="w-full px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                            >
                                <option value="all">All Devices</option>
                                {devices.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
                            </select>
                        </div>
                        <button
                            onClick={handleBackup}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                        >
                            Create Backup
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Backup History</h3>
                    <div className="space-y-2">
                        {configs.length === 0 ? (
                            <p className="text-gray-600 dark:text-gray-400">No backups found. Create your first backup above.</p>
                        ) : (
                            configs.map(config => (
                                <div key={config.id} className="flex items-center justify-between p-3 rounded bg-cyan-500/5 border border-cyan-500/20">
                                    <div>
                                        <div className="font-semibold text-gray-800 dark:text-gray-200">{config.device}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(config.timestamp).toLocaleString()} • {config.version} • {config.size}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRestore(config)}
                                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                                        >
                                            Restore
                                        </button>
                                        <button
                                            onClick={() => handleExport(config)}
                                            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-sm transition-colors"
                                        >
                                            Export
                                        </button>
                                        <button
                                            onClick={() => handleDelete(config.id)}
                                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </GlassPanel>
        </div>
    );
};

// Device Groups/Tags Component
const DeviceGroupsModal = ({ onClose, devices, onUpdateGroups }) => {
    const [groups, setGroups] = useState(() => {
        const saved = localStorage.getItem('deviceGroups');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: 'Core Network', color: 'blue', deviceIds: [] },
            { id: 2, name: 'Edge Routers', color: 'green', deviceIds: [] },
            { id: 3, name: 'Access Switches', color: 'purple', deviceIds: [] },
            { id: 4, name: 'Data Center', color: 'orange', deviceIds: [] }
        ];
    });
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState('blue');

    const colors = ['blue', 'green', 'purple', 'orange', 'red', 'pink', 'indigo', 'teal'];
    const colorMap = {
        blue: '#3b82f6',
        green: '#22c55e',
        purple: '#a855f7',
        orange: '#f97316',
        red: '#ef4444',
        pink: '#ec4899',
        indigo: '#6366f1',
        teal: '#14b8a6'
    };

    const addGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup = {
            id: Date.now(),
            name: newGroupName,
            color: newGroupColor,
            deviceIds: []
        };
        const updated = [...groups, newGroup];
        setGroups(updated);
        localStorage.setItem('deviceGroups', JSON.stringify(updated));
        setNewGroupName('');
    };

    const deleteGroup = (id) => {
        const updated = groups.filter(g => g.id !== id);
        setGroups(updated);
        localStorage.setItem('deviceGroups', JSON.stringify(updated));
    };

    const toggleDeviceInGroup = (groupId, deviceId) => {
        const updated = groups.map(group => {
            if (group.id === groupId) {
                const deviceIds = group.deviceIds.includes(deviceId)
                    ? group.deviceIds.filter(id => id !== deviceId)
                    : [...group.deviceIds, deviceId];
                return { ...group, deviceIds };
            }
            return group;
        });
        setGroups(updated);
        localStorage.setItem('deviceGroups', JSON.stringify(updated));
        if (onUpdateGroups) onUpdateGroups(updated);
    };

    const handleOverlayMouseDown = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onMouseDown={handleOverlayMouseDown}>
            <GlassPanel className="w-full max-w-5xl max-h-[80vh] overflow-y-auto" onMouseDown={e => e.stopPropagation()}>
                <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center sticky top-0 bg-inherit">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Device Groups & Tags</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
                </div>
                <div className="p-4 border-b border-cyan-500/20">
                    <div className="flex gap-3 flex-wrap">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addGroup(); }}
                            placeholder="New group name..."
                            className="flex-1 min-w-[200px] px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                        />
                        <select
                            value={newGroupColor}
                            onChange={e => setNewGroupColor(e.target.value)}
                            className="px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                        >
                            {colors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                            onClick={addGroup}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                        >
                            Add Group
                        </button>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    {groups.map(group => (
                        <div key={group.id} className="border border-cyan-500/20 rounded p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: colorMap[group.color] || '#4b5563' }}
                                    ></div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{group.name}</h3>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">({group.deviceIds.length} devices)</span>
                                </div>
                                <button
                                    onClick={() => deleteGroup(group.id)}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {devices.map(device => (
                                    <label key={device.id} className="flex items-center gap-2 p-2 rounded hover:bg-cyan-500/5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={group.deviceIds.includes(device.id)}
                                            onChange={() => toggleDeviceInGroup(group.id, device.id)}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{device.id}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </GlassPanel>
        </div>
    );
};

// Firmware Repository Component
const FirmwareRepositoryModal = ({ onClose }) => {
    const [firmwares, setFirmwares] = useState(() => {
        const saved = localStorage.getItem('firmwareRepository');
        return saved ? JSON.parse(saved) : [
            { id: 1, version: 'v17.4.1', releaseDate: '2024-01-15', size: '145 MB', deviceType: 'Switch', notes: 'Security patches and bug fixes' },
            { id: 2, version: 'v17.3.2', releaseDate: '2023-12-01', size: '142 MB', deviceType: 'Switch', notes: 'Performance improvements' },
            { id: 3, version: 'v9.8.1', releaseDate: '2024-01-10', size: '89 MB', deviceType: 'Router', notes: 'BGP stability improvements' },
            { id: 4, version: 'v6.2.0', releaseDate: '2023-11-20', size: '256 MB', deviceType: 'Firewall', notes: 'New threat signatures' }
        ];
    });
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const newFirmware = {
                id: Date.now(),
                version: `v${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
                releaseDate: new Date().toISOString().split('T')[0],
                size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                deviceType: ['Switch', 'Router', 'Firewall'][Math.floor(Math.random() * 3)],
                notes: `Uploaded: ${file.name}`,
                fileName: file.name
            };
            const updated = [...firmwares, newFirmware];
            setFirmwares(updated);
            localStorage.setItem('firmwareRepository', JSON.stringify(updated));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDownload = (fw) => {
        const content = `Firmware: ${fw.version}\nDevice Type: ${fw.deviceType}\nRelease Date: ${fw.releaseDate}\nSize: ${fw.size}\nNotes: ${fw.notes}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `firmware_${fw.version.replace(/\./g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDelete = (id) => {
        const updated = firmwares.filter(f => f.id !== id);
        setFirmwares(updated);
        localStorage.setItem('firmwareRepository', JSON.stringify(updated));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <GlassPanel className="w-full max-w-5xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center sticky top-0 bg-inherit">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Firmware Repository</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
                </div>
                <div className="p-4 border-b border-cyan-500/20">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept=".bin,.iso,.img,.hex"
                        className="hidden"
                    />
                    <button
                        onClick={handleUploadClick}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                    >
                        Upload Firmware
                    </button>
                </div>
                <div className="p-4">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-cyan-500/20">
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Version</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Device Type</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Release Date</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Size</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {firmwares.map(fw => (
                                <tr key={fw.id} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                                    <td className="p-3 text-cyan-600 dark:text-cyan-400 font-mono">{fw.version}</td>
                                    <td className="p-3 text-gray-700 dark:text-gray-300">{fw.deviceType}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">{fw.releaseDate}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400">{fw.size}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">{fw.notes}</td>
                                    <td className="p-3 flex gap-2">
                                        <button
                                            onClick={() => handleDownload(fw)}
                                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                                        >
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleDelete(fw.id)}
                                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassPanel>
        </div>
    );
};

// Maintenance Mode Component
const MaintenanceModeModal = ({ onClose, devices }) => {
    const [maintenanceWindows, setMaintenanceWindows] = useState(() => {
        const saved = localStorage.getItem('maintenanceWindows');
        return saved ? JSON.parse(saved) : [];
    });
    const [newWindow, setNewWindow] = useState({
        device: devices[0]?.id || '',
        startTime: '',
        endTime: '',
        reason: ''
    });

    const addMaintenanceWindow = () => {
        if (!newWindow.device || !newWindow.startTime || !newWindow.endTime || !newWindow.reason) {
            alert('Please fill in all fields');
            return;
        }
        const window = {
            id: Date.now(),
            ...newWindow,
            status: 'Scheduled'
        };
        const updated = [...maintenanceWindows, window];
        setMaintenanceWindows(updated);
        localStorage.setItem('maintenanceWindows', JSON.stringify(updated));
        setNewWindow({ device: devices[0]?.id || '', startTime: '', endTime: '', reason: '' });
    };

    const deleteWindow = (id) => {
        const updated = maintenanceWindows.filter(w => w.id !== id);
        setMaintenanceWindows(updated);
        localStorage.setItem('maintenanceWindows', JSON.stringify(updated));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <GlassPanel className="w-full max-w-5xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center sticky top-0 bg-inherit">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Maintenance Mode</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
                </div>
                <div className="p-4 border-b border-cyan-500/20 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Schedule Maintenance Window</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device</label>
                            <select
                                value={newWindow.device}
                                onChange={e => setNewWindow({ ...newWindow, device: e.target.value })}
                                className="w-full px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                            >
                                {devices.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                            <input
                                type="text"
                                value={newWindow.reason}
                                onChange={e => setNewWindow({ ...newWindow, reason: e.target.value })}
                                placeholder="e.g., Firmware update"
                                className="w-full px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                value={newWindow.startTime}
                                onChange={e => setNewWindow({ ...newWindow, startTime: e.target.value })}
                                className="w-full px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                value={newWindow.endTime}
                                onChange={e => setNewWindow({ ...newWindow, endTime: e.target.value })}
                                className="w-full px-3 py-2 rounded bg-white/50 dark:bg-gray-800/50 border border-cyan-500/20 text-gray-800 dark:text-gray-200"
                            />
                        </div>
                    </div>
                    <button
                        onClick={addMaintenanceWindow}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                    >
                        Schedule Maintenance
                    </button>
                </div>
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Scheduled Maintenance</h3>
                    {maintenanceWindows.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-400">No maintenance windows scheduled.</p>
                    ) : (
                        <div className="space-y-2">
                            {maintenanceWindows.map(window => (
                                <div key={window.id} className="flex items-center justify-between p-3 rounded bg-cyan-500/5 border border-cyan-500/20">
                                    <div>
                                        <div className="font-semibold text-gray-800 dark:text-gray-200">{window.device}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(window.startTime).toLocaleString()} - {new Date(window.endTime).toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{window.reason}</div>
                                    </div>
                                    <button
                                        onClick={() => deleteWindow(window.id)}
                                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </GlassPanel>
        </div>
    );
};

// Advanced Networking Modal (LLDP, MAC Table, ARP, STP)
const AdvancedNetworkingModal = ({ onClose, device }) => {
    const [activeTab, setActiveTab] = useState('lldp');

    const lldpNeighbors = [
        { port: 'eth0', neighborDevice: 'S1-CORE-02', neighborPort: 'eth1', chassisId: '00:1A:2B:3C:4D:01' },
        { port: 'eth1', neighborDevice: 'S2-ACCESS-01', neighborPort: 'eth0', chassisId: '00:1A:2B:3C:4D:02' },
        { port: 'eth2', neighborDevice: 'NetAdmin Pro Router', neighborPort: 'eth5', chassisId: '00:1A:2B:3C:4D:03' }
    ];

    const macTable = Array.from({ length: 20 }, (_, i) => ({
        vlan: Math.floor(Math.random() * 50) + 1,
        mac: `00:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
        port: `eth${Math.floor(Math.random() * 24)}`,
        type: Math.random() > 0.5 ? 'Dynamic' : 'Static'
    }));

    const arpTable = Array.from({ length: 15 }, (_, i) => ({
        ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        mac: `00:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
        interface: `vlan${Math.floor(Math.random() * 50) + 1}`,
        age: `${Math.floor(Math.random() * 300)}s`
    }));

    const stpInfo = {
        bridgeId: '8000.001a2b3c4d5e',
        priority: 32768,
        rootBridge: '8000.001a2b3c4d01',
        rootPort: 'eth0',
        rootCost: 4,
        ports: [
            { port: 'eth0', role: 'Root', state: 'Forwarding', cost: 4 },
            { port: 'eth1', role: 'Designated', state: 'Forwarding', cost: 4 },
            { port: 'eth2', role: 'Designated', state: 'Forwarding', cost: 4 },
            { port: 'eth3', role: 'Alternate', state: 'Blocking', cost: 4 }
        ]
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <GlassPanel className="w-full max-w-6xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Advanced Networking - {device?.id}</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
                </div>
                <div className="border-b border-cyan-500/20 flex">
                    {['lldp', 'mac', 'arp', 'stp'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === tab
                                    ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'lldp' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">LLDP Neighbors</h3>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-cyan-500/20">
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Local Port</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Neighbor Device</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Neighbor Port</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Chassis ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lldpNeighbors.map((n, i) => (
                                        <tr key={i} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{n.port}</td>
                                            <td className="p-3 text-cyan-600 dark:text-cyan-400 font-semibold">{n.neighborDevice}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{n.neighborPort}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400 font-mono text-sm">{n.chassisId}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'mac' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">MAC Address Table</h3>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-cyan-500/20">
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">VLAN</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">MAC Address</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Port</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {macTable.map((entry, i) => (
                                        <tr key={i} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{entry.vlan}</td>
                                            <td className="p-3 text-cyan-600 dark:text-cyan-400 font-mono text-sm">{entry.mac}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{entry.port}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">{entry.type}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'arp' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">ARP Table</h3>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-cyan-500/20">
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">IP Address</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">MAC Address</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Interface</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Age</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {arpTable.map((entry, i) => (
                                        <tr key={i} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                                            <td className="p-3 text-cyan-600 dark:text-cyan-400 font-mono">{entry.ip}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300 font-mono text-sm">{entry.mac}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{entry.interface}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">{entry.age}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'stp' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Spanning Tree Protocol</h3>
                            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded p-4 mb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Bridge ID</div>
                                        <div className="text-gray-800 dark:text-gray-200 font-mono">{stpInfo.bridgeId}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Priority</div>
                                        <div className="text-gray-800 dark:text-gray-200">{stpInfo.priority}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Root Bridge</div>
                                        <div className="text-gray-800 dark:text-gray-200 font-mono">{stpInfo.rootBridge}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Root Port</div>
                                        <div className="text-gray-800 dark:text-gray-200">{stpInfo.rootPort} (Cost: {stpInfo.rootCost})</div>
                                    </div>
                                </div>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-cyan-500/20">
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Port</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">State</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stpInfo.ports.map((port, i) => (
                                        <tr key={i} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{port.port}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{port.role}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    port.state === 'Forwarding' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'
                                                }`}>
                                                    {port.state}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">{port.cost}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </GlassPanel>
        </div>
    );
};

const SettingsView = ({ onSave, currentSettings, onThemeChange, userRole = 'admin', devices = [] }) => {
    const [openSections, setOpenSections] = useState({ global: true, users: false, logs: false, tools: true, security: false });
    const [localSettings, setLocalSettings] = useState({
        timezone: currentSettings.timezone,
        ntpServer: currentSettings.ntpServer
    });
    const [saveStatus, setSaveStatus] = useState('');
    // User-scoped MFA State
    const [mfaEnabled, setMfaEnabled] = useState(localStorage.getItem(`mfaEnabled_${userRole}`) === 'true');
    const [showMfaConfirm, setShowMfaConfirm] = useState(false);
    
    // New MFA Setup State
    const [showMfaSetup, setShowMfaSetup] = useState(false);
    const [tempSecret, setTempSecret] = useState('');
    const [setupCode, setSetupCode] = useState('');
    const [setupError, setSetupError] = useState('');
    const [loadingVerify, setLoadingVerify] = useState(false);

    const [mfaConfirmMessage, setMfaConfirmMessage] = useState('');
    const isReadOnly = userRole === 'viewer';
    const [showSyslog, setShowSyslog] = useState(false);
    const [showConfigBackup, setShowConfigBackup] = useState(false);
    const [showDeviceGroups, setShowDeviceGroups] = useState(false);
    const [showFirmwareRepo, setShowFirmwareRepo] = useState(false);
    const [showMaintenance, setShowMaintenance] = useState(false);

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSettingChange = (e) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: value }));
        setSaveStatus('');
    };

    const handleSave = () => {
        onSave(localSettings);
        setSaveStatus('Settings saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const generateLocalSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 16; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    };

    const handleMfaToggle = () => {
        if (mfaEnabled) {
            setMfaConfirmMessage(`Disable MFA for ${userRole}? Login will no longer require multi-factor authentication.`);
            setShowMfaConfirm(true);
        } else {
            // Start MFA Setup Flow
            // Use local generator just in case generateTOTPSecret is missing
            const secret = generateLocalSecret();
            setTempSecret(secret);
            setSetupCode('');
            setSetupError('');
            setShowMfaSetup(true);
        }
    };

    const confirmDisableMfa = () => {
        const storageKeyMfa = `mfaEnabled_${userRole}`;
        const storageKeySecret = `mfaSecret_${userRole}`;
        
        localStorage.removeItem(storageKeySecret);
        localStorage.removeItem(storageKeyMfa);
        setMfaEnabled(false);
        setShowMfaConfirm(false);
        logAudit('mfa_toggled', { enabled: false, user: userRole });
        setSaveStatus('MFA disabled successfully.');
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const verifyAndEnableMfa = async () => {
        setSetupError('');
        if (!setupCode || setupCode.length !== 6) {
            setSetupError('Please enter a 6-digit code.');
            return;
        }

        // Check availability of Web Crypto API
        if (!window.crypto || !window.crypto.subtle) {
             setSetupError('Error: Secure Context (HTTPS or Localhost) is required for MFA verification.');
             return;
        }

        setLoadingVerify(true);
        const isValid = await verifyTOTP(tempSecret, setupCode);
        setLoadingVerify(false);

        if (isValid) {
            const storageKeyMfa = `mfaEnabled_${userRole}`;
            const storageKeySecret = `mfaSecret_${userRole}`;
            
            localStorage.setItem(storageKeySecret, tempSecret);
            localStorage.setItem(storageKeyMfa, 'true');
            setMfaEnabled(true);
            setShowMfaSetup(false);
            logAudit('mfa_toggled', { enabled: true, user: userRole });
            setSaveStatus('MFA enabled and verified successfully!');
            setTimeout(() => setSaveStatus(''), 3000);
        } else {
             setSetupError('Invalid code. Please ensure you entered the secret correctly into your authenticator app.');
        }
    };
    
    const timezones = [
        { label: '(UTC-08:00) Pacific Time', value: 'America/Los_Angeles' },
        { label: '(UTC-05:00) Eastern Time', value: 'America/New_York' },
        { label: '(UTC+00:00) Greenwich Mean Time', value: 'Etc/GMT' },
        { label: '(UTC+05:30) India Standard Time', value: 'Asia/Kolkata' },
    ];

    return (
        <>
            {showMfaConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <GlassPanel className="w-full max-w-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Icon name="shieldCheck" className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Confirm MFA Change</h2>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">{mfaConfirmMessage}</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowMfaConfirm(false)}
                                className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDisableMfa}
                                className="flex-1 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 rounded-lg transition-colors font-semibold"
                            >
                                Disable MFA
                            </button>
                        </div>
                    </GlassPanel>
                </div>
            )}
            
            {showMfaSetup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <GlassPanel className="w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Icon name="shieldCheck" className="w-6 h-6 text-cyan-500" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Setup MFA</h2>
                        </div>
                        
                        <div className="mb-6 space-y-4">
                            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">1. Add to Authenticator App</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Enter this key into Google Authenticator or Authy:</p>
                                <div className="bg-gray-900 dark:bg-black/40 rounded p-3 font-mono text-center">
                                    <span className="text-lg font-bold text-green-400 tracking-wider break-all">{tempSecret}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">2. Verify Code</p>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    maxLength="6"
                                    value={setupCode}
                                    onChange={(e) => setSetupCode(e.target.value.replace(/\D/g,''))}
                                    placeholder="Enter 6-digit code"
                                    className="w-full p-3 text-center text-xl font-mono tracking-widest bg-gray-100 dark:bg-black/30 border border-cyan-500/30 rounded-lg focus:ring-2 focus:ring-cyan-400 outline-none"
                                />
                                {setupError && <p className="text-red-500 text-sm mt-2 text-center">{setupError}</p>}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowMfaSetup(false)}
                                className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={verifyAndEnableMfa}
                                disabled={loadingVerify}
                                className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 rounded-lg transition-colors font-semibold"
                            >
                                {loadingVerify ? 'Verifying...' : 'Verify & Enable'}
                            </button>
                        </div>
                    </GlassPanel>
                </div>
            )}

            {showSyslog && <SyslogViewerModal onClose={() => setShowSyslog(false)} devices={devices} />}
            {showConfigBackup && <ConfigBackupModal onClose={() => setShowConfigBackup(false)} devices={devices} />}
            {showDeviceGroups && <DeviceGroupsModal onClose={() => setShowDeviceGroups(false)} devices={devices} />}
            {showFirmwareRepo && <FirmwareRepositoryModal onClose={() => setShowFirmwareRepo(false)} />}
            {showMaintenance && <MaintenanceModeModal onClose={() => setShowMaintenance(false)} devices={devices} />}
            <div className="space-y-6">
             <SettingsSection title="Global Settings" isOpen={openSections.global} onToggle={() => toggleSection('global')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Timezone</label>
                        <select
                            name="timezone"
                            value={localSettings.timezone}
                            onChange={handleSettingChange}
                            className="w-full p-2 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
                        >
                            {timezones.map(tz => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">NTP Server</label>
                        <input
                            name="ntpServer"
                            value={localSettings.ntpServer}
                            onChange={handleSettingChange}
                            disabled={isReadOnly}
                            className="w-full p-2 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:gap-8 gap-4 pt-4 border-t border-cyan-500/20 dark:border-cyan-300/10">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Dark Mode</label>
                            <ToggleSwitch 
                                enabled={currentSettings.theme === 'dark'} 
                                onChange={onThemeChange} 
                            />
                        </div>
                         <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Diagnostic Logs</label>
                            <ToggleSwitch enabled={false} onChange={() => {}} />
                        </div>
                    </div>
                </div>
                {!isReadOnly && (
                    <div className="pt-4 mt-4 border-t border-cyan-500/20 dark:border-cyan-300/10 flex justify-end items-center gap-4">
                        {saveStatus && <p className="text-green-400 text-sm animate-pulse">{saveStatus}</p>}
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity"
                        >
                            Save Settings
                        </button>
                    </div>
                )}
             </SettingsSection>

             {userRole === 'admin' && (
                <SettingsSection title="Security" isOpen={openSections.security} onToggle={() => toggleSection('security')}>
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Multi-Factor Authentication (MFA)</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Require a verification code from authenticator app after password login</p>
                                </div>
                                <ToggleSwitch 
                                    enabled={mfaEnabled}
                                    onChange={handleMfaToggle}
                                />
                            </div>
                            {mfaEnabled && (
                                <div className="mt-3 pt-3 border-t border-blue-500/10">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Your MFA Secret Key:</p>
                                    <div className="bg-gray-900 dark:bg-black/40 rounded-lg p-3 font-mono text-center break-all">
                                        <span className="text-sm font-bold text-green-400">{localStorage.getItem('mfaSecret') || '------'}</span>
                                    </div>
                                    <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                        <p className="font-semibold">Setup Instructions:</p>
                                        <ol className="list-decimal list-inside space-y-1 ml-2">
                                            <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                                            <li>Add new account and enter the secret key above</li>
                                            <li>Use the 6-digit code from the app to login</li>
                                        </ol>
                                    </div>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">⚠️ Save this secret key securely - you cannot recover it later</p>
                                </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-3 pt-3 border-t border-blue-500/10">
                                Status: <span className={mfaEnabled ? 'text-green-500 font-semibold' : 'text-gray-400 font-semibold'}>{mfaEnabled ? '✓ Enabled' : '○ Disabled'}</span>
                            </div>
                        </div>
                    </div>
                </SettingsSection>
             )}
             
             {userRole === 'admin' && (
                <SettingsSection title="User & Access Control" isOpen={openSections.users} onToggle={() => toggleSection('users')}>
                    <UserAccessControl />
                </SettingsSection>
              )}

              <SettingsSection title="Logs & Audit" isOpen={openSections.logs} onToggle={() => toggleSection('logs')}>
                 <LogsAudit />
              </SettingsSection>

              <SettingsSection title="Management Tools" isOpen={openSections.tools} onToggle={() => toggleSection('tools')}>
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => setShowSyslog(true)} className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors text-left">
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">System Logs</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">View real-time syslog messages</div>
                        </button>
                        <button onClick={() => setShowConfigBackup(true)} className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors text-left">
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Config Backup & Restore</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Manage device configurations</div>
                        </button>
                        <button onClick={() => setShowDeviceGroups(true)} className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors text-left">
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Device Groups & Tags</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Organize devices into groups</div>
                        </button>
                        <button onClick={() => setShowFirmwareRepo(true)} className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors text-left">
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Firmware Repository</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Manage firmware versions</div>
                        </button>
                        <button onClick={() => setShowMaintenance(true)} className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-colors text-left col-span-1 md:col-span-2">
                            <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Maintenance Mode</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Schedule maintenance windows</div>
                        </button>
                    </div>
                 </div>
              </SettingsSection>
            </div>
        </>
    );
};

const VlanManagementModal = ({ vlans, onSave, onClose, onDelete }) => {
    const [editingVlan, setEditingVlan] = useState(null);
    const [newVlan, setNewVlan] = useState({ id: '', name: '', ports: '' });
    
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    
    const handleSave = () => {
        if (newVlan.id && newVlan.name) {
            onSave({ ...newVlan, id: parseInt(newVlan.id), status: 'active' });
            setNewVlan({ id: '', name: '', ports: '' });
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <GlassPanel className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">VLAN Management</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Add New VLAN</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="number" placeholder="VLAN ID" value={newVlan.id} onChange={(e) => setNewVlan({...newVlan, id: e.target.value})} className="p-2 bg-white dark:bg-black/30 border border-cyan-500/20 rounded-lg" />
                        <input type="text" placeholder="VLAN Name" value={newVlan.name} onChange={(e) => setNewVlan({...newVlan, name: e.target.value})} className="p-2 bg-white dark:bg-black/30 border border-cyan-500/20 rounded-lg" />
                        <input type="text" placeholder="Ports (e.g., 1-24)" value={newVlan.ports} onChange={(e) => setNewVlan({...newVlan, ports: e.target.value})} className="p-2 bg-white dark:bg-black/30 border border-cyan-500/20 rounded-lg" />
                    </div>
                    <button onClick={handleSave} className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:opacity-90">Add VLAN</button>
                </div>
                
                <div className="space-y-2">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Existing VLANs</h4>
                    {vlans.map(vlan => (
                        <div key={vlan.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                                <span className="font-bold text-cyan-600 dark:text-cyan-400">VLAN {vlan.id}</span>
                                <span className="mx-2 text-gray-700 dark:text-gray-300">{vlan.name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Ports: {vlan.ports}</span>
                            </div>
                            {vlan.id !== 1 && (
                                <button onClick={() => onDelete(vlan.id)} className="px-3 py-1 bg-red-500/20 text-red-600 dark:text-red-400 rounded hover:bg-red-500/30">
                                    <Icon name="trash" className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </GlassPanel>
        </div>
    );
};

const SwitchesView = ({ switches, onRebootSwitch, onUpdateFirmware, userRole = 'admin' }) => {
    const [selectedSwitchId, setSelectedSwitchId] = useState(switches.length > 0 ? switches[0].id : null);
    const [switchData, setSwitchData] = useState(() => JSON.parse(JSON.stringify(initialSwitchDetails)));
    const selectedSwitch = switches.find(s => s.id === selectedSwitchId);
    const switchDetails = switchData[selectedSwitchId] || { vlans: [], ports: [] };
    const [showConfirmReboot, setShowConfirmReboot] = useState(false);
    const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
    const [showVlanModal, setShowVlanModal] = useState(false);
    const [showAdvancedNetworking, setShowAdvancedNetworking] = useState(false);
    const [backupStatus, setBackupStatus] = useState('');
    const [portPage, setPortPage] = useState(0);
    const isReadOnly = userRole === 'viewer';
    const portsPerPage = 12;

    useEffect(() => {
        setPortPage(0);
    }, [selectedSwitchId]);

    useEffect(() => {
        if (!selectedSwitchId) return;
        setSwitchData(prev => {
            if (prev[selectedSwitchId]) return prev;
            const fallback = initialSwitchDetails[selectedSwitchId] || { vlans: [], ports: [] };
            return { ...prev, [selectedSwitchId]: JSON.parse(JSON.stringify(fallback)) };
        });
    }, [selectedSwitchId]);

    useEffect(() => {
        const totalPortPages = Math.max(1, Math.ceil((switchDetails.ports || []).length / portsPerPage));
        setPortPage(prev => Math.min(prev, totalPortPages - 1));
    }, [switchDetails.ports, portsPerPage]);

    useEffect(() => {
        if (!selectedSwitchId) return undefined;
        const interval = setInterval(() => {
            setSwitchData(prev => {
                const details = prev[selectedSwitchId];
                if (!details) return prev;
                const updatedPorts = details.ports.map(port => {
                    if (port.status === 'disabled' || port.status === 'down') {
                        return port;
                    }
                    const statusFlip = Math.random() < 0.01;
                    const nextStatus = statusFlip ? 'down' : 'up';
                    const rxIncrement = Math.floor(Math.random() * 5000);
                    const txIncrement = Math.floor(Math.random() * 5000);
                    const errBump = Math.random() < 0.05 ? 1 : 0;
                    const crcBump = Math.random() < 0.03 ? 1 : 0;
                    const dropBump = Math.random() < 0.08 ? 1 : 0;
                    return {
                        ...port,
                        status: nextStatus,
                        rxPackets: (port.rxPackets || 0) + rxIncrement,
                        txPackets: (port.txPackets || 0) + txIncrement,
                        rxErrors: Math.max(0, (port.rxErrors || 0) + errBump),
                        txErrors: Math.max(0, (port.txErrors || 0) + errBump),
                        crcErrors: Math.max(0, (port.crcErrors || 0) + crcBump),
                        rxDrops: Math.max(0, (port.rxDrops || 0) + dropBump),
                        txDrops: Math.max(0, (port.txDrops || 0) + dropBump)
                    };
                });
                return { ...prev, [selectedSwitchId]: { ...details, ports: updatedPorts } };
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedSwitchId]);

    const handleSwitchBackup = () => {
        if (!selectedSwitchId) return;
        const record = {
            id: Date.now(),
            switchId: selectedSwitchId,
            timestamp: new Date().toISOString(),
            config: switchDetails
        };
        const existing = JSON.parse(localStorage.getItem('switchBackups') || '[]');
        const updated = [...existing.slice(-49), record];
        localStorage.setItem('switchBackups', JSON.stringify(updated));
        setBackupStatus(`Config backup saved for ${selectedSwitchId}`);
        setTimeout(() => setBackupStatus(''), 3000);
    };

    const handleAddVlan = (vlan) => {
        if (!selectedSwitchId) return;
        setSwitchData(prev => {
            const details = prev[selectedSwitchId] || { vlans: [], ports: [] };
            return { ...prev, [selectedSwitchId]: { ...details, vlans: [...details.vlans, vlan] } };
        });
    };

    const handleDeleteVlan = (id) => {
        if (!selectedSwitchId) return;
        setSwitchData(prev => {
            const details = prev[selectedSwitchId] || { vlans: [], ports: [] };
            return { ...prev, [selectedSwitchId]: { ...details, vlans: details.vlans.filter(v => v.id !== id) } };
        });
    };


    const getPortColor = (status) => {
        switch (status) {
            case 'up': return 'bg-green-500/80 border-green-400';
            case 'down': return 'bg-red-500/80 border-red-400';
            case 'disabled': return 'bg-gray-600/80 border-gray-500';
            default: return 'bg-gray-700';
        }
    };

    const totalPorts = switchDetails.ports?.length || 0;
    const totalPortPages = Math.max(1, Math.ceil(totalPorts / portsPerPage));
    const pageStart = portPage * portsPerPage;
    const pageEnd = Math.min(totalPorts, pageStart + portsPerPage);
    const paginatedPorts = (switchDetails.ports || []).slice(pageStart, pageEnd);
    const handlePortPageChange = (direction) => {
        setPortPage(prev => {
            const next = prev + direction;
            return Math.min(Math.max(next, 0), totalPortPages - 1);
        });
    };
    
    return (
        <>
            <div className="space-y-6">
                <GlassPanel className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="w-full md:w-auto">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Select Switch</label>
                        <select value={selectedSwitchId} onChange={e => setSelectedSwitchId(e.target.value)} className="w-full p-2 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition">
                           {switches.map(s => <option key={s.id} value={s.id}>{s.id} ({s.ip})</option>)}
                        </select>
                    </div>
                    {!isReadOnly && (
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setShowConfirmReboot(true)} className="px-3 py-2 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 dark:text-red-300 transition-colors">Reboot Switch</button>
                            <button onClick={handleSwitchBackup} className="px-3 py-2 text-sm rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 dark:text-indigo-300 transition-colors">Backup Config</button>
                            <button onClick={() => setShowConfirmUpdate(true)} className="px-3 py-2 text-sm rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 dark:text-purple-300 transition-colors">Firmware Update</button>
                            <button onClick={() => setShowVlanModal(true)} className="px-3 py-2 text-sm rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 dark:text-green-300 transition-colors">Manage VLANs</button>
                            <button onClick={() => setShowAdvancedNetworking(true)} className="px-3 py-2 text-sm rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 dark:text-cyan-300 transition-colors">Advanced</button>
                        </div>
                    )}
                </GlassPanel>
                {backupStatus && (
                    <div className="text-sm text-green-600 dark:text-green-400 px-2">{backupStatus}</div>
                )}

                {selectedSwitch && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard icon="server" title="Model" value={switchDetails.model || 'N/A'} change={selectedSwitch.ip} />
                            <StatCard icon="settings" title="Firmware" value={switchDetails.firmware || 'N/A'} change="Up to date" changeType="decrease" />
                            <StatCard icon="activity" title="Uptime" value={formatUptime(selectedSwitch.bootTime) || 'N/A'} />
                        </div>

                        {/* Environmental Monitoring */}
                        <EnvironmentalCard device={selectedSwitch} />

                        <GlassPanel className="p-4">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Port Status</h3>
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                                {switchDetails.ports.map(port => (
                                    <div key={port.id} className={`relative group w-full aspect-square rounded-md flex items-center justify-center ${getPortColor(port.status)} cursor-pointer`}>
                                        <span className="text-sm font-bold text-white">{port.id}</span>
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 text-xs bg-gray-900 border border-cyan-400/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            Port: {port.id} | Status: {port.status} | Speed: {port.speed} | VLAN: {port.vlan}
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </GlassPanel>

                         <GlassPanel className="p-4 overflow-x-auto">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">VLAN Configuration</h3>
                            <table className="w-full text-left table-auto">
                                <thead>
                                    <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">VLAN ID</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Ports</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {switchDetails.vlans.map((vlan) => (
                                        <tr key={vlan.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 transition-colors">
                                            <td className="p-3 text-cyan-600 dark:text-cyan-300 font-mono">{vlan.id}</td>
                                            <td className="p-3 text-gray-800 dark:text-gray-200">{vlan.name}</td>
                                             <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-700 dark:text-green-300`}>{vlan.status}</span>
                                            </td>
                                            <td className="p-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{vlan.ports}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </GlassPanel>

                        {/* Port Statistics */}
                        <GlassPanel className="p-4 overflow-x-auto">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Port Statistics & Errors</h3>
                            <table className="w-full text-left table-auto text-sm">
                                <thead>
                                    <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                                        <th className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Port</th>
                                        <th className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Speed</th>
                                        <th className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300">RX Packets</th>
                                        <th className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300">TX Packets</th>
                                        <th className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300">RX Errors</th>
                                        <th className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300">TX Errors</th>
                                        <th className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300">CRC Errors</th>
                                        <th className="p-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Drops</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPorts.map((port) => (
                                        <tr key={port.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/5 transition-colors">
                                            <td className="p-2 text-cyan-600 dark:text-cyan-300 font-mono font-bold">{port.id}</td>
                                            <td className="p-2">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                    port.status === 'up' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 
                                                    port.status === 'down' ? 'bg-red-500/20 text-red-700 dark:text-red-300' : 
                                                    'bg-gray-500/20 text-gray-700 dark:text-gray-300'
                                                }`}>{port.status}</span>
                                            </td>
                                            <td className="p-2 text-gray-800 dark:text-gray-200 font-mono">{port.speed}</td>
                                            <td className="p-2 text-gray-600 dark:text-gray-400 font-mono">{port.rxPackets?.toLocaleString() || '0'}</td>
                                            <td className="p-2 text-gray-600 dark:text-gray-400 font-mono">{port.txPackets?.toLocaleString() || '0'}</td>
                                            <td className={`p-2 font-mono ${(port.rxErrors || 0) > 20 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {port.rxErrors || 0}
                                            </td>
                                            <td className={`p-2 font-mono ${(port.txErrors || 0) > 20 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {port.txErrors || 0}
                                            </td>
                                            <td className={`p-2 font-mono ${(port.crcErrors || 0) > 5 ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {port.crcErrors || 0}
                                            </td>
                                            <td className="p-2 text-gray-600 dark:text-gray-400 font-mono">{((port.rxDrops || 0) + (port.txDrops || 0))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Icon name="alert" className="w-4 h-4" />
                                    <span>Errors highlighted in red when &gt; 20, CRC errors in orange when &gt; 5</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <span>Ports {totalPorts === 0 ? 0 : pageStart + 1}-{pageEnd} of {totalPorts}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePortPageChange(-1)}
                                            disabled={portPage === 0}
                                            className="px-3 py-1 rounded border border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Prev
                                        </button>
                                        <span className="font-mono">Page {totalPortPages === 0 ? 0 : portPage + 1}/{totalPortPages}</span>
                                        <button
                                            onClick={() => handlePortPageChange(1)}
                                            disabled={portPage >= totalPortPages - 1}
                                            className="px-3 py-1 rounded border border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </GlassPanel>
                    </>
                )}
            </div>
            {showConfirmReboot && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                     <GlassPanel className="w-full max-w-md p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Reboot</h3>
                        <p className="text-gray-600 dark:text-gray-300 my-4">Are you sure you want to reboot switch <span className="font-bold text-cyan-500 dark:text-cyan-300">{selectedSwitchId}</span>? This action is disruptive.</p>
                        <div className="flex justify-end gap-4">
                             <button onClick={() => setShowConfirmReboot(false)} className="px-4 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 transition-colors">Cancel</button>
                            <button onClick={() => { onRebootSwitch(selectedSwitchId); setShowConfirmReboot(false); }} className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500/100 text-white font-bold transition-colors">Reboot</button>
                        </div>
                     </GlassPanel>
                 </div>
            )}
            {showConfirmUpdate && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                     <GlassPanel className="w-full max-w-md p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Firmware Update</h3>
                        <p className="text-gray-600 dark:text-gray-300 my-4">Update <span className="font-bold text-cyan-500 dark:text-cyan-300">{selectedSwitchId}</span> to firmware v17.4.1? The device will reboot.</p>
                        <div className="flex justify-end gap-4">
                             <button onClick={() => setShowConfirmUpdate(false)} className="px-4 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 transition-colors">Cancel</button>
                            <button onClick={() => { onUpdateFirmware(selectedSwitchId); setShowConfirmUpdate(false); }} className="px-4 py-2 rounded-lg bg-purple-500/80 hover:bg-purple-500/100 text-white font-bold transition-colors">Update</button>
                        </div>
                     </GlassPanel>
                 </div>
            )}
            {showVlanModal && (
                <VlanManagementModal 
                    vlans={switchDetails.vlans} 
                    onSave={(vlan) => { handleAddVlan(vlan); setShowVlanModal(false); }}
                    onDelete={(id) => { handleDeleteVlan(id); }}
                    onClose={() => setShowVlanModal(false)} 
                />
            )}
            {showAdvancedNetworking && (
                <AdvancedNetworkingModal 
                    device={selectedSwitch}
                    onClose={() => setShowAdvancedNetworking(false)}
                />
            )}
        </>
    );
};
const RoutersView = ({ routers, onRebootRouter, userRole = 'admin' }) => {
    const [selectedRouterId, setSelectedRouterId] = useState(routers.length > 0 ? routers[0].id : null);
    const selectedRouter = routers.find(r => r.id === selectedRouterId);
    const routerDetails = initialRouterDetails[selectedRouterId] || { bgpNeighbors: [], routingTable: [] };
    const [showConfirmReboot, setShowConfirmReboot] = useState(false);
    const [showRouterManager, setShowRouterManager] = useState(false);
    const [routerBackupStatus, setRouterBackupStatus] = useState('');
    const isReadOnly = userRole === 'viewer';

    const handleRebootClick = () => {
        setShowConfirmReboot(true);
    };

    const confirmReboot = () => {
        onRebootRouter(selectedRouterId);
        setShowConfirmReboot(false);
    };

    const handleRouterBackup = () => {
        if (!selectedRouterId) return;
        const record = {
            id: Date.now(),
            routerId: selectedRouterId,
            timestamp: new Date().toISOString(),
            config: routerDetails
        };
        const existing = JSON.parse(localStorage.getItem('routerBackups') || '[]');
        const updated = [...existing.slice(-49), record];
        localStorage.setItem('routerBackups', JSON.stringify(updated));
        setRouterBackupStatus(`Config backup saved for ${selectedRouterId}`);
        setTimeout(() => setRouterBackupStatus(''), 3000);
    };

    return (
        <>
            <div className="space-y-6">
                <GlassPanel className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="w-full md:w-auto">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Select Router</label>
                        <select value={selectedRouterId} onChange={e => setSelectedRouterId(e.target.value)} className="w-full p-2 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition">
                           {routers.map(r => <option key={r.id} value={r.id}>{r.id} ({r.ip})</option>)}
                        </select>
                    </div>
                    {!isReadOnly && (
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={handleRebootClick} className="px-3 py-2 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 dark:text-red-300 transition-colors">Reboot Router</button>
                            <button onClick={handleRouterBackup} className="px-3 py-2 text-sm rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 dark:text-indigo-300 transition-colors">Backup Config</button>
                            <button onClick={() => setShowRouterManager(true)} className="px-3 py-2 text-sm rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 dark:text-cyan-300 transition-colors">Manage Router</button>
                        </div>
                    )}
                </GlassPanel>
                {routerBackupStatus && (
                    <div className="text-sm text-green-600 dark:text-green-400 px-2">{routerBackupStatus}</div>
                )}

                {selectedRouter && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard icon="router" title="Model" value={routerDetails.model || 'N/A'} change={selectedRouter.ip} />
                            <StatCard icon="settings" title="Firmware" value={routerDetails.firmware || 'N/A'} change="Up to date" changeType="decrease" />
                            <StatCard icon="activity" title="Uptime" value={formatUptime(selectedRouter.bootTime) || 'N/A'} />
                        </div>

                        <GlassPanel className="p-4 overflow-x-auto">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">BGP Neighbors</h3>
                            <table className="w-full text-left table-auto">
                                <thead>
                                    <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Neighbor IP</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">ASN</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routerDetails.bgpNeighbors.map((neighbor) => (
                                        <tr key={neighbor.neighborIP} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 transition-colors">
                                            <td className="p-3 text-cyan-600 dark:text-cyan-300 font-mono">{neighbor.neighborIP}</td>
                                            <td className="p-3 text-gray-800 dark:text-gray-200">{neighbor.asn}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${neighbor.status === 'Established' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>{neighbor.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </GlassPanel>

                         <GlassPanel className="p-4 overflow-x-auto">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Routing Table</h3>
                            <table className="w-full text-left table-auto">
                                <thead>
                                    <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Prefix</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Next Hop</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Metric</th>
                                        <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Protocol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routerDetails.routingTable.map((route) => (
                                        <tr key={route.prefix} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 transition-colors">
                                            <td className="p-3 text-cyan-600 dark:text-cyan-300 font-mono">{route.prefix}</td>
                                            <td className="p-3 text-gray-800 dark:text-gray-200 font-mono">{route.nextHop}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-300">{route.metric}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-300">{route.protocol}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </GlassPanel>
                    </>
                )}
            </div>

            {showConfirmReboot && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                     <GlassPanel className="w-full max-w-md p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Reboot</h3>
                        <p className="text-gray-600 dark:text-gray-300 my-4">Are you sure you want to reboot router <span className="font-bold text-cyan-500 dark:text-cyan-300">{selectedRouterId}</span>? This action is disruptive.</p>
                        <div className="flex justify-end gap-4">
                             <button onClick={() => setShowConfirmReboot(false)} className="px-4 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 transition-colors">Cancel</button>
                            <button onClick={confirmReboot} className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500/100 text-white font-bold transition-colors">Reboot</button>
                        </div>
                     </GlassPanel>
                 </div>
            )}
            {showRouterManager && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowRouterManager(false)}>
                    <GlassPanel className="w-full max-w-6xl h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Router ({selectedRouterId})</h3>
                            <button onClick={() => setShowRouterManager(false)} className="px-3 py-1 rounded bg-gray-600/30 hover:bg-gray-600/50 text-white">Close</button>
                        </div>
                        <iframe
                            title="Router Manager"
                            src="https://adityaraj3136.github.io/netadmin-pro/"
                            className="w-full h-full border-0"
                            loading="lazy"
                        />
                    </GlassPanel>
                </div>
            )}
        </>
    );
};

const RebootModal = ({ deviceName, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const logContainerRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && progress === 100) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, progress]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        const rebootSteps = [
            `[INFO] Initiating reboot sequence for ${deviceName}...`,
            '[OK] Closed active sessions.',
            '[INFO] Shutting down services...',
            '[OK] BGP daemon stopped.',
            '[OK] OSPF daemon stopped.',
            '[INFO] System is going down for reboot NOW!',
            '[INFO] System rebooted. Initializing kernel...',
            '[OK] Hardware checks passed.',
            '[INFO] Starting services...',
            '[OK] BGP daemon started.',
            '[OK] OSPF daemon started.',
            '[SUCCESS] Reboot complete. Device is back online.',
        ];

        let currentStep = 0;
        const intervalId = setInterval(() => {
            if (currentStep < rebootSteps.length) {
                setLogs(prev => [...prev, rebootSteps[currentStep]]);
                setProgress(Math.round(((currentStep + 1) / rebootSteps.length) * 100));
                currentStep++;
            } else {
                clearInterval(intervalId);
                setTimeout(onClose, 2000);
            }
        }, 1200);

        return () => clearInterval(intervalId);
    }, [deviceName, onClose]);

    const getLogColor = (log) => {
        if (!log) return 'text-gray-500 dark:text-gray-400';
        if (log.startsWith('[SUCCESS]')) return 'text-green-600 dark:text-green-400';
        if (log.startsWith('[OK]')) return 'text-cyan-600 dark:text-cyan-400';
        if (log.startsWith('[INFO]')) return 'text-gray-700 dark:text-gray-300';
        return 'text-gray-500 dark:text-gray-400';
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <GlassPanel className="w-full max-w-2xl p-0">
                 <div className="p-4 border-b border-cyan-500/20 dark:border-cyan-300/20">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Rebooting {deviceName}</h3>
                </div>
                <div className="p-4 space-y-4">
                    <div ref={logContainerRef} className="h-48 bg-gray-200/50 dark:bg-black/50 rounded-lg p-2 overflow-y-auto font-mono text-xs">
                        {logs.map((log, i) => (
                            <p key={i} className={getLogColor(log)}>{log}</p>
                        ))}
                    </div>
                    <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-cyan-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </GlassPanel>
        </div>
    );
};

const FirmwareUpdateModal = ({ deviceName, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const logContainerRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && progress === 100) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, progress]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        const updateSteps = [
            `[INFO] Starting firmware update for ${deviceName}...`,
            '[INFO] Downloading new firmware v17.4.1...',
            '[OK] Download complete. Checksum verified.',
            '[INFO] Preparing for installation...',
            '[OK] System prepared. Installing update...',
            '[INFO] Installation in progress... Device will reboot.',
            '[SUCCESS] Update complete. Device is rebooting.',
        ];

        let currentStep = 0;
        const intervalId = setInterval(() => {
            if (currentStep < updateSteps.length) {
                setLogs(prev => [...prev, updateSteps[currentStep]]);
                setProgress(Math.round(((currentStep + 1) / updateSteps.length) * 100));
                currentStep++;
            } else {
                clearInterval(intervalId);
                setTimeout(onClose, 2000);
            }
        }, 1500);

        return () => clearInterval(intervalId);
    }, [deviceName, onClose]);
    
    const getLogColor = (log) => {
        if (!log) return 'text-gray-500 dark:text-gray-400';
        if (log.startsWith('[SUCCESS]')) return 'text-green-600 dark:text-green-400';
        if (log.startsWith('[OK]')) return 'text-cyan-600 dark:text-cyan-400';
        if (log.startsWith('[INFO]')) return 'text-gray-700 dark:text-gray-300';
        return 'text-gray-500 dark:text-gray-400';
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <GlassPanel className="w-full max-w-2xl p-0">
                 <div className="p-4 border-b border-cyan-500/20 dark:border-cyan-300/20">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Updating Firmware on {deviceName}</h3>
                </div>
                <div className="p-4 space-y-4">
                    <div ref={logContainerRef} className="h-48 bg-gray-200/50 dark:bg-black/50 rounded-lg p-2 overflow-y-auto font-mono text-xs">
                        {logs.map((log, i) => (
                            <p key={i} className={getLogColor(log)}>{log}</p>
                        ))}
                    </div>
                    <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </GlassPanel>
        </div>
    );
};

const ServerAdvancedFeaturesModal = ({ serverId, onClose, serverDetails }) => {
    const [activeTab, setActiveTab] = useState('services');
    const [statusMessage, setStatusMessage] = useState('');
    const [services, setServices] = useState(() => serverDetails?.services || []);
    const [serviceChanges, setServiceChanges] = useState({});
    const [backups, setBackups] = useState(() => {
        const all = JSON.parse(localStorage.getItem('serverBackups') || '[]');
        return all.filter(b => b.serverId === serverId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
    const [processes, setProcesses] = useState(() => {
        const list = serverDetails?.services || [];
        return list.slice(0, 6).map(service => ({
            pid: service.pid,
            name: service.name,
            cpu: Math.max(0.5, Math.round(Math.random() * 8 + 2)),
            mem: `${Math.round(Math.random() * 400 + 64)} MB`
        }));
    });

    const buildUptimeSnapshot = (serviceList) => {
        const snapshot = {};
        serviceList.forEach(service => {
            snapshot[service.pid] = `${Math.floor(Math.random() * 25) + 5} days`;
        });
        return snapshot;
    };

    const sessionUptimesRef = useRef(null);
    const sessionUptimesServerIdRef = useRef(null);

    const refreshBackups = () => {
        const all = JSON.parse(localStorage.getItem('serverBackups') || '[]');
        setBackups(all.filter(b => b.serverId === serverId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    };

    // Initialize uptime snapshot only once per session (when serverId changes)
    useEffect(() => {
        if (sessionUptimesServerIdRef.current !== serverId) {
            sessionUptimesServerIdRef.current = serverId;
            sessionUptimesRef.current = buildUptimeSnapshot(serverDetails?.services || []);
        }
    }, [serverId]);

    // Separate effect for updating other data when serverDetails changes
    useEffect(() => {
        setServices(serverDetails?.services || []);
        setProcesses(() => {
            const list = serverDetails?.services || [];
            if (list.length === 0) {
                return [
                    { pid: 1024, name: 'systemd', cpu: 0.5, mem: '20 MB' },
                    { pid: 2048, name: 'kernel-task', cpu: 1.2, mem: '35 MB' }
                ];
            }
            return list.slice(0, 6).map(service => ({
                pid: service.pid,
                name: service.name,
                cpu: Math.max(0.5, Math.round(Math.random() * 8 + (service.status === 'Running' ? 5 : 1))),
                mem: `${Math.round(Math.random() * 400 + 64)} MB`
            }));
        });
        setServiceChanges({});
        refreshBackups();
        setStatusMessage('');
    }, [serverId, serverDetails]);

    const handleServiceAction = (serviceName, action) => {
        const actions = { start: 'started', stop: 'stopped', restart: 'restarted' };
        const nextStatus = action === 'stop' ? 'Stopped' : 'Running';
        
        // Update service status
        setServices(prev => prev.map(service => {
            if (service.name !== serviceName) return service;
            return { ...service, status: nextStatus };
        }));
        
        setServiceChanges(prev => ({ ...prev, [serviceName]: nextStatus }));
        
        // Reset uptime if restart action
        if (action === 'restart') {
            const service = (serverDetails?.services || []).find(s => s.name === serviceName);
            if (service && sessionUptimesRef.current) {
                // Generate new uptime value for restarted service
                const newUptime = `${Math.floor(Math.random() * 5) + 1} days`; // Reset to 1-5 days after restart
                sessionUptimesRef.current[service.pid] = newUptime;
            }
        }
        
        setStatusMessage(`Service ${serviceName} ${actions[action]} successfully`);
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const handleBackup = () => {
        const backupRecord = {
            id: Date.now(),
            serverId,
            timestamp: new Date().toISOString(),
            config: {
                services,
                performance: serverDetails?.performance || {},
                hostname: serverId
            }
        };
        const existing = JSON.parse(localStorage.getItem('serverBackups') || '[]');
        const updated = [...existing.slice(-49), backupRecord];
        localStorage.setItem('serverBackups', JSON.stringify(updated));
        refreshBackups();
        setStatusMessage(`Backup created successfully at ${new Date().toLocaleTimeString()}`);
        setTimeout(() => setStatusMessage(''), 3000);
    };

    const handleBackupRestore = (e, backup) => {
        e.preventDefault();
        e.stopPropagation();
        const restoredServices = backup?.config?.services || [];
        setServices(prev => (restoredServices.length ? restoredServices : prev));
        setServiceChanges({});
        if (sessionUptimesRef.current) {
            sessionUptimesRef.current = buildUptimeSnapshot(restoredServices);
        }
        setStatusMessage('Backup restored to modal session. Service changes applied.');
        setTimeout(() => setStatusMessage(''), 4000);
    };

    const handleBackupDownload = (e, backup) => {
        e.preventDefault();
        e.stopPropagation();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${serverId}-backup-${new Date(backup.timestamp).toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleOverlayMouseDown = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onMouseDown={handleOverlayMouseDown}>
            <GlassPanel className="w-full max-w-4xl max-h-[80vh] overflow-y-auto" onMouseDown={e => e.stopPropagation()}>
                <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center sticky top-0 bg-inherit">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{serverId} - Advanced Features</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
                </div>

                <div className="p-4 border-b border-cyan-500/20 flex gap-2">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`px-4 py-2 rounded transition-colors ${activeTab === 'services' ? 'bg-cyan-500/30 text-cyan-300' : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'}`}
                    >
                        Services
                    </button>
                    <button
                        onClick={() => setActiveTab('processes')}
                        className={`px-4 py-2 rounded transition-colors ${activeTab === 'processes' ? 'bg-cyan-500/30 text-cyan-300' : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'}`}
                    >
                        Processes
                    </button>
                    <button
                        onClick={() => setActiveTab('backup')}
                        className={`px-4 py-2 rounded transition-colors ${activeTab === 'backup' ? 'bg-cyan-500/30 text-cyan-300' : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'}`}
                    >
                        Backup
                    </button>
                </div>

                <div className="p-4">
                    {statusMessage && <p className="mb-4 p-2 bg-green-500/20 text-green-300 rounded text-sm">{statusMessage}</p>}

                    {activeTab === 'services' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Service Management</h3>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-cyan-500/20">
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Service</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Uptime</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map(service => (
                                        <tr key={service.pid} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                                            <td className="p-3 text-gray-800 dark:text-gray-200 font-mono text-sm">{service.name}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${service.status === 'Running' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                    {service.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400 text-sm">{(sessionUptimesRef.current && sessionUptimesRef.current[service.pid]) || '—'}</td>
                                            <td className="p-3 flex gap-2">
                                                <button onClick={() => handleServiceAction(service.name, 'start')} className="px-2 py-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded transition-colors">Start</button>
                                                <button onClick={() => handleServiceAction(service.name, 'stop')} className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors">Stop</button>
                                                <button onClick={() => handleServiceAction(service.name, 'restart')} className="px-2 py-1 text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded transition-colors">Restart</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'processes' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Top Processes by CPU</h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-cyan-500/20">
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">PID</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Process</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">CPU %</th>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Memory</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processes.map(proc => (
                                        <tr key={proc.pid} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                                            <td className="p-3 font-mono text-cyan-400">{proc.pid}</td>
                                            <td className="p-3 text-gray-200">{proc.name}</td>
                                            <td className="p-3"><span className={`${proc.cpu > 10 ? 'text-red-400' : 'text-green-400'}`}>{proc.cpu}%</span></td>
                                            <td className="p-3 text-gray-400">{proc.mem}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Server Backup & Restore</h3>
                            <button
                                onClick={handleBackup}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                            >
                                Create Backup Now
                            </button>
                            <div className="border border-cyan-500/20 rounded p-4">
                                <h4 className="font-semibold text-gray-200 mb-3">Recent Backups</h4>
                                {backups.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-cyan-500/20">
                                                <th className="p-2 text-left text-gray-400">Date</th>
                                                <th className="p-2 text-left text-gray-400">Time</th>
                                                <th className="p-2 text-left text-gray-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {backups.slice(0, 5).map((backup) => {
                                                const date = new Date(backup.timestamp);
                                                return (
                                                    <tr key={backup.id || backup.timestamp} className="border-b border-cyan-500/10">
                                                        <td className="p-2 text-gray-300">{date.toLocaleDateString()}</td>
                                                        <td className="p-2 text-gray-300">{date.toLocaleTimeString()}</td>
                                                        <td className="p-2 flex gap-3">
                                                            <button onClick={(e) => handleBackupRestore(e, backup)} className="text-blue-400 hover:text-blue-300 transition-colors">Restore</button>
                                                            <button onClick={(e) => handleBackupDownload(e, backup)} className="text-cyan-400 hover:text-cyan-300 transition-colors">Download</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-gray-400">No backups available. Create one to get started.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </GlassPanel>
        </div>
    );
};

const ServersView = ({ servers, onRebootServer, userRole = 'admin' }) => {
    const [selectedServerId, setSelectedServerId] = useState(servers.length > 0 ? servers[0].id : null);
    const selectedServer = servers.find(s => s.id === selectedServerId);
    const isReadOnly = userRole === 'viewer';
    
    const [serverDetails, setServerDetails] = useState(initialServerDetails[selectedServerId] || { services: [], performance: {cpu:[], memory:[], disk:[]} });
    const [showConfirmReboot, setShowConfirmReboot] = useState(false);
    const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

    useEffect(() => {
        if (servers.length > 0 && !servers.find(s => s.id === selectedServerId)) {
            setSelectedServerId(servers[0].id);
        } else if (servers.length === 0) {
            setSelectedServerId(null);
        }
    }, [servers, selectedServerId]);
    
    useEffect(() => {
        if(selectedServerId) {
            setServerDetails(initialServerDetails[selectedServerId] || { services: [], performance: {cpu:[], memory:[], disk:[]} });
        }
    }, [selectedServerId]);

    useEffect(() => {
        if (!selectedServerId) return;

        const interval = setInterval(() => {
            setServerDetails(prevDetails => {
                if (!prevDetails || !prevDetails.performance) return prevDetails;

                const { performance } = prevDetails;
                const baseCpu = selectedServerId === 'Dell PowerEdge R740' ? 60 : 5;
                const baseMem = selectedServerId === 'Dell PowerEdge R740' ? 70 : 18;

                const newCpu = Math.min(100, Math.max(0, baseCpu + Math.floor(Math.random() * 21) - 10));
                const newMem = Math.min(100, Math.max(0, baseMem + Math.floor(Math.random() * 11) - 5));
                const newDisk = Math.floor(Math.random() * 25);

                const newPerformance = {
                    cpu: [...(performance.cpu || []).slice(1), newCpu],
                    memory: [...(performance.memory || []).slice(1), newMem],
                    disk: [...(performance.disk || []).slice(1), newDisk],
                };

                return { ...prevDetails, performance: newPerformance };
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [selectedServerId]);


    const performanceData = (serverDetails.performance.cpu || []).map((cpu, index) => ({
        name: `T-${9-index}`,
        cpu,
        memory: (serverDetails.performance.memory || [])[index] || 0,
        disk: (serverDetails.performance.disk || [])[index] || 0
    }));

    return (
        <>
        <div className="space-y-6">
            <GlassPanel className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="w-full md:w-auto">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Select Server</label>
                    <select value={selectedServerId || ''} onChange={e => setSelectedServerId(e.target.value)} className="w-full p-2 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none transition">
                       {servers.map(s => <option key={s.id} value={s.id}>{s.id} ({s.ip})</option>)}
                    </select>
                </div>
                {!isReadOnly && (
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setShowConfirmReboot(true)} className="px-3 py-2 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 dark:text-red-300 transition-colors">Reboot Server</button>
                        <button onClick={() => setShowAdvancedFeatures(true)} className="px-3 py-2 text-sm rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 dark:text-indigo-300 transition-colors">Advanced Features</button>
                    </div>
                )}
            </GlassPanel>

            {selectedServer && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <ChartCard title="CPU Usage (%)">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <defs><linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient></defs>
                                    <XAxis dataKey="name" stroke="#8884d8" fontSize={12} />
                                    <YAxis domain={[0, 100]} stroke="#8884d8" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', border: '1px solid #00ffff' }} />
                                    <Area type="monotone" dataKey="cpu" stroke="#8884d8" fill="url(#colorCpu)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                         <ChartCard title="Memory Usage (%)">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <defs><linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/><stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/></linearGradient></defs>
                                    <XAxis dataKey="name" stroke="#82ca9d" fontSize={12} />
                                    <YAxis domain={[0, 100]} stroke="#82ca9d" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', border: '1px solid #00ffff' }} />
                                    <Area type="monotone" dataKey="memory" stroke="#82ca9d" fill="url(#colorMem)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Disk I/O (MB/s)">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <defs><linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/><stop offset="95%" stopColor="#ffc658" stopOpacity={0}/></linearGradient></defs>
                                    <XAxis dataKey="name" stroke="#ffc658" fontSize={12} />
                                    <YAxis stroke="#ffc658" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', border: '1px solid #00ffff' }} />
                                    <Area type="monotone" dataKey="disk" stroke="#ffc658" fill="url(#colorDisk)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <GlassPanel className="p-4 overflow-x-auto">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Running Services on {selectedServerId}</h3>
                        <table className="w-full text-left table-auto">
                            <thead>
                                <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                                    <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Service Name</th>
                                    <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">PID</th>
                                    <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serverDetails.services.map((service) => (
                                    <tr key={service.pid} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 transition-colors">
                                        <td className="p-3 text-gray-800 dark:text-gray-200 font-mono text-sm">{service.name}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-300">{service.pid}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${service.status === 'Running' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>{service.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassPanel>
                </>
            )}
        </div>
        {showAdvancedFeatures && (
            <ServerAdvancedFeaturesModal 
                serverId={selectedServerId} 
                onClose={() => setShowAdvancedFeatures(false)} 
                serverDetails={serverDetails}
            />
        )}
        {showConfirmReboot && (
             <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                 <GlassPanel className="w-full max-w-md p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Reboot</h3>
                    <p className="text-gray-600 dark:text-gray-300 my-4">Are you sure you want to reboot server <span className="font-bold text-cyan-500 dark:text-cyan-300">{selectedServerId}</span>? This may disrupt services.</p>
                    <div className="flex justify-end gap-4">
                         <button onClick={() => setShowConfirmReboot(false)} className="px-4 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-500/50 transition-colors">Cancel</button>
                        <button onClick={() => { onRebootServer(selectedServerId); setShowConfirmReboot(false); }} className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500/100 text-white font-bold transition-colors">Reboot</button>
                    </div>
                 </GlassPanel>
             </div>
        )}
    </>
    );
};


// --- Main App Component ---

// Helpers
const toHex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2,'0')).join('');
const hashSHA256 = async (text) => {
    const enc = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
    return toHex(digest);
};
const logAudit = (event, details = {}) => {
    const entry = { ts: new Date().toISOString(), event, details };
    const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    logs.push(entry);
    localStorage.setItem('auditLogs', JSON.stringify(logs));
};
const obfuscateSecret = (s) => btoa([...s].reverse().join(''));
const deobfuscateSecret = (s) => { try { return atob(s).split('').reverse().join(''); } catch { return ''; } };

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, info) {
        console.error('App error:', error, info);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-900">
                    <div className="p-6 text-red-500 bg-gray-800 rounded-lg">
                        <h2 className="text-xl font-bold mb-2">An unexpected error occurred</h2>
                        <p className="text-gray-400">Please refresh the page</p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [waitingForMfa, setWaitingForMfa] = useState(false);
    const [tempMfaUser, setTempMfaUser] = useState(null);
    const [tempMfaRole, setTempMfaRole] = useState(null);
    const [startMfaSetup, setStartMfaSetup] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState('admin');
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [dataLoading, setDataLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAlertsPanel, setShowAlertsPanel] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showUserProfileModal, setShowUserProfileModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showSpeedTestModal, setShowSpeedTestModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(true);
    const [rebootingDevice, setRebootingDevice] = useState(null);
    const [updatingFirmwareDevice, setUpdatingFirmwareDevice] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');
    
    // Brute force protection
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isLoginLocked, setIsLoginLocked] = useState(false);
    const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
    
    const [devices, setDevices] = useState(initialDevices);
    const [bandwidthHistory, setBandwidthHistory] = useState(initialBandwidthData);
    const [yearlyBandwidth, setYearlyBandwidth] = useState(initialYearlyBandwidth);
    const [alerts, setAlerts] = useState(initialAlerts);
    const [dnsRecords, setDnsRecords] = useState(initialDnsRecords);
    const [aclRules, setAclRules] = useState(initialAclRules);
    const [wirelessDevices, setWirelessDevices] = useState(initialWirelessDevices);
    const [isScanning, setIsScanning] = useState(false);
    
    // ✅ Main state for settings, initialize theme from localStorage if available
    const [settings, setSettings] = useState(() => {
        const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
        return { theme: savedTheme === 'dark' ? 'dark' : savedTheme === 'light' ? 'light' : 'dark', timezone: 'Asia/Kolkata', ntpServer: 'pool.ntp.org' };
    });
    const [currentTime, setCurrentTime] = useState(new Date());

    // Simulate initial data loading
    useEffect(() => {
        if (isAuthenticated) {
            setDataLoading(true);
            setTimeout(() => setDataLoading(false), 1500);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Session timeout: 15 minutes inactivity
    useEffect(() => {
        const reset = () => setLastActivity(Date.now());
        ['mousemove','keydown','click','scroll','touchstart'].forEach(evt => window.addEventListener(evt, reset));
        const interval = setInterval(() => {
            const TIMEOUT_MS = 15 * 60 * 1000;
            if (isAuthenticated && Date.now() - lastActivity > TIMEOUT_MS) {
                logAudit('session_timeout', { user: currentUser?.username });
                setIsAuthenticated(false);
            }
        }, 10000);
        return () => {
            ['mousemove','keydown','click','scroll','touchstart'].forEach(evt => window.removeEventListener(evt, reset));
            clearInterval(interval);
        };
    }, [isAuthenticated, lastActivity, currentUser]);
    const [stats, setStats] = useState({
        totalDevices: initialDevices.length,
        currentBandwidth: 1.4,
        avgLatency: 21,
        criticalAlerts: initialAlerts.filter(a => a.severity === 'Critical').length,
        bandwidthPeak: 1.8,
        latencyBase: 22,
    });
    
    const navItems = useMemo(() => [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' }, { id: 'switches', icon: 'switch', label: 'Switches' },
        { id: 'routers', icon: 'router', label: 'Routers' }, { id: 'servers', icon: 'server', label: 'Servers' },
        { id: 'wireless', icon: 'wifi', label: 'Wireless' }, { id: 'dns', icon: 'dns', label: 'DNS' },
        { id: 'acl', icon: 'shield', label: 'ACL' }, { id: 'health', icon: 'activity', label: 'Network Health' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
    ], []);
    
    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(() => {
            let newAlerts = [];
            setDevices(prevDevices => {
                return prevDevices.map(device => {
                    let newStatus = device.status;
                    if (device.status === 'Offline' && Math.random() < 0.1) {
                        newStatus = 'Online';
                    } else if (device.status === 'Online' && Math.random() < 0.01) {
                        newStatus = 'Offline';
                        newAlerts.push({id: Date.now(), severity: 'Critical', message: `Device ${device.id} is offline.`, timestamp: 'Just now'});
                    }

                    if (newStatus !== 'Offline') {
                        const newCpu = Math.min(100, Math.max(0, device.cpu + Math.floor(Math.random() * 11) - 5));
                        const newMem = Math.min(100, Math.max(0, device.mem + Math.floor(Math.random() * 7) - 3));
                        const newTemp = Math.min(85, Math.max(25, device.temp + Math.floor(Math.random() * 5) - 2));
                        
                        // Update fan speeds based on temperature
                        const newFans = device.fans.map(fan => {
                            const tempFactor = newTemp / 70;
                            const baseRpm = fan.status === 'high' ? 6500 : fan.status === 'low' ? 2000 : 3000;
                            const newRpm = Math.floor(baseRpm * tempFactor + Math.random() * 200 - 100);
                            let newStatus = 'normal';
                            if (newRpm > 6000) newStatus = 'high';
                            else if (newRpm < 2500) newStatus = 'low';
                            return { ...fan, rpm: newRpm, status: newStatus };
                        });
                        
                        if (newCpu > 85 || newMem > 90) {
                            if (device.status !== 'Warning') {
                                newAlerts.push({id: Date.now() + 1, severity: 'Warning', message: `High CPU on ${device.id} (${newCpu}%)`, timestamp: 'Just now'});
                            }
                            newStatus = 'Warning';
                        } else if (newCpu < 60 && newMem < 70) {
                            newStatus = 'Online';
                        }
                        
                        // Temperature alerts
                        if (newTemp >= 70 && device.temp < 70) {
                            newAlerts.push({id: Date.now() + 2, severity: 'Critical', message: `Critical temperature on ${device.id} (${newTemp}°C)`, timestamp: 'Just now'});
                        }
                        
                        return { ...device, status: newStatus, cpu: newCpu, mem: newMem, temp: newTemp, fans: newFans };
                    }
                    
                    return { ...device, status: newStatus };
                });
            });

            if(newAlerts.length > 0) {
                setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
            }

            setStats(prevStats => {
                const newBandwidth = parseFloat((Math.random() * 0.5 + 1.2).toFixed(1));
                const newLatency = Math.floor(Math.random() * 10) + 18;
                const newPeak = Math.max(prevStats.bandwidthPeak, newBandwidth);
                
                return {
                    ...prevStats,
                    currentBandwidth: newBandwidth,
                    avgLatency: newLatency,
                    bandwidthPeak: newPeak,
                };
            });

            setBandwidthHistory(prev => {
                const newPoint = { name: `T`, ingress: Math.floor(Math.random() * 500) + 100, egress: Math.floor(Math.random() * 400) + 80 };
                const updatedHistory = [...prev.slice(1), newPoint];
                return updatedHistory.map((d, i) => ({ ...d, name: `T-${29 - i}` }));
            });

            setAclRules(prevRules => 
                prevRules.map(rule => 
                    rule.enabled 
                        ? { ...rule, hits: (rule.hits || 0) + Math.floor(Math.random() * 5) } 
                        : rule
                )
            );

        }, 3000);

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        setStats(prev => ({
            ...prev,
            totalDevices: devices.length,
            criticalAlerts: alerts.filter(a => a.severity === 'Critical').length,
        }));
    }, [devices, alerts, isAuthenticated]);
    
    // Welcome modal now shows on every reload - removed localStorage persistence

    // Brute force protection timer
    useEffect(() => {
        if (isLoginLocked && lockTimeRemaining > 0) {
            const timer = setInterval(() => {
                setLockTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsLoginLocked(false);
                        setLoginAttempts(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isLoginLocked, lockTimeRemaining]);

    const handleLogin = async (username, password) => {
        // Check if locked
        if (isLoginLocked) {
            return { success: false, attempts: loginAttempts };
        }
        
        // Check MFA requirement - User Scoped
        // Use default false if not set
        const mfaEnabled = localStorage.getItem(`mfaEnabled_${username}`) === 'true';
        
        // Get system users
        const savedUsers = localStorage.getItem('systemUsers');
        const systemUsers = savedUsers ? JSON.parse(savedUsers) : [
            { id: 1, username: 'admin', role: 'admin', status: 'active', email: 'adityaraj3136@gmail.com' },
            { id: 2, username: 'viewer', role: 'viewer', status: 'active', email: 'viewer@nms.local' }
        ];
        
        // Find user
        const user = systemUsers.find(u => u.username === username && u.status === 'active');
        
        // For admin user, check stored password hash
        if (username === 'admin') {
            const storedHash = localStorage.getItem('userPasswordHash');
            const enteredHash = await hashSHA256(password);
            const defaultHash = await hashSHA256('admin');
            const expectedHash = storedHash || defaultHash;
            if (enteredHash === expectedHash && user) {
                // Reset attempts on successful login
                setLoginAttempts(0);
                setIsLoginLocked(false);
                
                // If MFA enabled, wait for verification
                if (mfaEnabled) {
                    setTempMfaUser(user);
                    setTempMfaRole(user.role);
                    setWaitingForMfa(true);
                    logAudit('mfa_required', { user: 'admin' });
                    return { success: true, attempts: 0 }; // Indicate credentials were valid, now waiting for MFA
                }
                // MFA disabled, authenticate immediately
                setIsAuthenticated(true);
                setCurrentUser(user);
                setUserRole(user.role);
                logAudit('login', { user: 'admin' });
                // Update last login
                const updatedUsers = systemUsers.map(u => 
                    u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
                );
                localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
                return { success: true, attempts: 0 };
            }
        } else if (user && password === 'viewer') { // Simple password for demo
            // If MFA enabled, wait for verification
            if (mfaEnabled) {
                setTempMfaUser(user);
                setTempMfaRole(user.role);
                setWaitingForMfa(true);
                logAudit('mfa_required', { user: 'viewer' });
                return { success: true, attempts: 0 };
            }
            // MFA disabled, authenticate immediately
            setIsAuthenticated(true);
            setCurrentUser(user);
            setUserRole(user.role);
            logAudit('login', { user: 'viewer' });
            // Update last login
            const updatedUsers = systemUsers.map(u => 
                u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
            );
            localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
            return { success: true, attempts: 0 };
        }
        return { success: false, attempts: loginAttempts };
    };

    const handleMfaVerify = async (code) => {
        // Retrieve secret for the temporary user trying to login
        const mfaSecret = localStorage.getItem(`mfaSecret_${tempMfaUser.username}`);
        
        if (!mfaSecret) {
            // Should not happen if mfaEnabled is true, but handle gracefully
            console.error('MFA enabled but no secret found for user:', tempMfaUser.username);
            return false;
        }
        
        // Verify TOTP code
        const isValid = await verifyTOTP(mfaSecret, code);
        
        if (isValid) {
            // MFA verified successfully
            setIsAuthenticated(true);
            setCurrentUser(tempMfaUser);
            setUserRole(tempMfaRole);
            setWaitingForMfa(false);
            setTempMfaUser(null);
            setTempMfaRole(null);
            
            // Update last login
            const savedUsers = localStorage.getItem('systemUsers');
            const systemUsers = savedUsers ? JSON.parse(savedUsers) : [];
            const updatedUsers = systemUsers.map(u => 
                u.id === tempMfaUser.id ? { ...u, lastLogin: new Date().toISOString() } : u
            );
            localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
            
            logAudit('mfa_verified', { user: tempMfaUser.username });
            return true;
        }
        return false;
    };

    const handleMfaCancel = () => {
        setWaitingForMfa(false);
        setTempMfaUser(null);
        setTempMfaRole(null);
    };

    const handleMfaReset = () => {
        // Reset MFA settings
        localStorage.removeItem('mfaSecret');
        localStorage.setItem('mfaEnabled', 'false');
        setWaitingForMfa(false);
        setTempMfaUser(null);
        setTempMfaRole(null);
        logAudit('mfa_reset', { user: tempMfaUser?.username || 'unknown', method: 'access_key' });
    };

    const handleLogout = () => { setIsAuthenticated(false); setShowProfileDropdown(false); };
    const handleAddDnsRecord = (record) => { setDnsRecords(prev => [record, ...prev]); };
    const handleDeleteDnsRecord = (id) => { setDnsRecords(prev => prev.filter(r => r.id !== id)); };
    const handleAddAclRule = (rule) => { setAclRules(prev => [rule, ...prev]); };
    const handleDeleteAclRule = (id) => { setAclRules(prev => prev.filter(r => r.id !== id)); };
    const handleToggleAclRule = (id) => {
        setAclRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled, lastModified: new Date().toLocaleString() } : r));
    };
    const handleMoveAclRule = (index, direction) => {
        setAclRules(prevRules => {
            const newRules = [...prevRules];
            if (direction === 'up' && index > 0) {
                [newRules[index], newRules[index - 1]] = [newRules[index - 1], newRules[index]];
            } else if (direction === 'down' && index < newRules.length - 1) {
                [newRules[index], newRules[index + 1]] = [newRules[index + 1], newRules[index]];
            }
            return newRules;
        });
    };
    const handleEditAclRule = (updatedRule) => {
        setAclRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
    };

    const handleWirelessScan = (range) => {
        setIsScanning(true);
        setTimeout(() => {
            const newDevice = {
                id: `New-Device-${Math.floor(Math.random()*1000)}`,
                ssid: ['NMS-Guest', 'NMS-Corp'][Math.floor(Math.random()*2)],
                mac: 'DE:AD:BE:EF:00:' + Math.floor(Math.random()*90+10),
                ip: `192.168.2.${Math.floor(Math.random()*253)+1}`,
                signal: -Math.floor(Math.random()*40+30),
                status: 'Connected',
                type: ['Tablet', 'Smart TV', 'IoT Device'][Math.floor(Math.random()*3)]
            };
            setWirelessDevices(prev => [...prev, newDevice]);
            setIsScanning(false);
        }, 2500);
    };
    
    const handleRebootDevice = (deviceId) => {
        setRebootingDevice(deviceId);
        setDevices(prev => prev.map(d => d.id === deviceId ? {...d, status: 'Rebooting'} : d));
    };
    
    const handleUpdateFirmware = (deviceId) => {
        setUpdatingFirmwareDevice(deviceId);
        setDevices(prev => prev.map(d => d.id === deviceId ? {...d, status: 'Updating'} : d));
    };
    
    const handleCloseRebootModal = useCallback(() => {
        // If firmware update finished, trigger reboot modal instead of immediately finalizing
        if (!rebootingDevice && updatingFirmwareDevice) {
            const id = updatingFirmwareDevice;
            setRebootingDevice(id);
            setUpdatingFirmwareDevice(null);
            return; // Render RebootModal next
        }
        const rebootedId = rebootingDevice || updatingFirmwareDevice;
        setDevices(prevDevices =>
            prevDevices.map(device =>
                device.id === rebootedId
                    ? { ...device, bootTime: new Date(), status: 'Online' }
                    : device
            )
        );
        setRebootingDevice(null);
        setUpdatingFirmwareDevice(null);
    }, [rebootingDevice, updatingFirmwareDevice]);

    const activeNavItem = navItems.find(item => item.id === activeView) || navItems[0];
    
    // This handles saving Timezone and NTP server
    const handleSettingsSave = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // ✅ This function handles the theme change instantly
    const handleThemeChange = () => {
        setSettings(prev => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark'
        }));
    };

    // ✅ Sync the `dark` class on the root element and persist to localStorage
    useEffect(() => {
        const isDark = settings.theme === 'dark';
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        try { localStorage.setItem('theme', settings.theme); } catch {}
    }, [settings.theme]);

    const renderView = () => {
        switch(activeView) {
            case 'dashboard': return <DashboardView stats={stats} bandwidthHistory={bandwidthHistory} devices={devices} loading={dataLoading} onShowAlerts={() => setShowAlertsPanel(true)} />;
            case 'switches': 
                return <SwitchesView 
                    switches={devices.filter(d => d.type.toLowerCase() === 'switch')}
                    onRebootSwitch={handleRebootDevice}
                    onUpdateFirmware={handleUpdateFirmware}
                    userRole={userRole}
                />;
            case 'routers': 
                return <RoutersView 
                    routers={devices.filter(d => d.type.toLowerCase() === 'router')} 
                    onRebootRouter={handleRebootDevice}
                    userRole={userRole}
                />;
            case 'servers':
                return <ServersView 
                    servers={devices.filter(d => d.type.toLowerCase().includes('server'))} 
                    onRebootServer={handleRebootDevice}
                    userRole={userRole}
                />;
            case 'wireless': return <WirelessView devices={wirelessDevices} onScan={handleWirelessScan} isScanning={isScanning} userRole={userRole}/>;
            case 'dns': return <DnsView records={dnsRecords} onAddRecord={handleAddDnsRecord} onDeleteRecord={handleDeleteDnsRecord} userRole={userRole}/>;
            case 'acl': return <AclView rules={aclRules} onAddRule={handleAddAclRule} onEditRule={handleEditAclRule} onDeleteRule={handleDeleteAclRule} onToggleRule={handleToggleAclRule} onReorderRule={handleMoveAclRule} userRole={userRole}/>;
            case 'health': return <NetworkHealthView yearlyBandwidthData={yearlyBandwidth} onStartSpeedTest={() => setShowSpeedTestModal(true)} loading={dataLoading} />;
            // ✅ We now pass the new theme handler to SettingsView
            case 'settings': 
                return <SettingsView 
                    onSave={handleSettingsSave} 
                    currentSettings={settings} 
                    onThemeChange={handleThemeChange}
                    userRole={userRole}
                    devices={devices}
                />;
            default:
                return (
                    <GlassPanel className="p-8 h-full flex items-center justify-center">
                        <h2 className="text-3xl text-cyan-400 font-bold animate-pulse">{activeNavItem.label} - View Under Construction</h2>
                    </GlassPanel>
                );
        }
    }

    return (
        <ErrorBoundary>
            {/* ✅ Container styles; dark mode driven by root `.dark` class */}
            <div className={"min-h-screen text-gray-800 dark:text-gray-200 font-sans bg-gray-100 dark:bg-[#020c1a]"}>
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80801212_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#00c4ff,transparent)]"></div>
                </div>
                
                {!isAuthenticated ? (
                    <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                        {showWelcomeModal && <WelcomeModal onClose={() => setShowWelcomeModal(false)} />}
                        {waitingForMfa ? (
                            <MFAVerificationPanel 
                                onVerify={handleMfaVerify} 
                                onCancel={handleMfaCancel}
                                onReset={handleMfaReset}
                            />
                        ) : (
                            <LoginPanel onLogin={handleLogin} isLocked={isLoginLocked} lockTimeRemaining={lockTimeRemaining} onToggleTheme={handleThemeChange} isDarkMode={settings.theme === 'dark'} />
                        )}
                    </div>
                ) : (
                    <div className="relative z-10 flex min-h-screen w-full overflow-x-hidden">
                        <Sidebar navItems={navItems} activeView={activeView} setActiveView={setActiveView} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                        <main className="flex-1 transition-all duration-300 md:ml-64 w-full min-w-0">
                            <div className="w-full max-w-7xl mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4">
                                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                                    <Header 
                                        activeViewLabel={activeNavItem.label} 
                                        alertsCount={alerts.length} 
                                        criticalAlertsCount={stats.criticalAlerts}
                                        onLogout={handleLogout} 
                                        onShowAlerts={() => setShowAlertsPanel(!showAlertsPanel)} 
                                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                                        onToggleProfile={() => setShowProfileDropdown(!showProfileDropdown)}
                                        onShowFeedback={() => setShowFeedbackModal(true)}
                                        currentTime={currentTime}
                                        timezone={settings.timezone}
                                        userRole={userRole}
                                        onToggleTheme={handleThemeChange}
                                        isDarkMode={settings.theme === 'dark'}
                                    />
                                    {showAlertsPanel && <AlertsPanel alerts={alerts} onClose={() => setShowAlertsPanel(false)} />}
                                    {showProfileDropdown && (
                                        <ProfileDropdown 
                                            onLogout={handleLogout} 
                                            onShowProfile={() => { setShowProfileDropdown(false); setShowUserProfileModal(true); }} 
                                            onShowChangePassword={() => { setShowProfileDropdown(false); setShowChangePasswordModal(true); }}
                                            onShowMfaSettings={() => { setShowProfileDropdown(false); setStartMfaSetup(true); setShowUserProfileModal(true); }}
                                            onClose={() => setShowProfileDropdown(false)}
                                        />
                                    )}
                                    {showUserProfileModal && (
                                        <UserProfileModal 
                                            onClose={() => { setShowUserProfileModal(false); setStartMfaSetup(false); }} 
                                            userRole={userRole} 
                                            startMfaSetup={startMfaSetup}
                                        />
                                    )}
                                    {showChangePasswordModal && <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />}
                                    {showSpeedTestModal && <SpeedTestModal onClose={() => setShowSpeedTestModal(false)} />}
                                    {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
                                    {rebootingDevice && <RebootModal deviceName={rebootingDevice} onClose={handleCloseRebootModal} />}
                                    {updatingFirmwareDevice && <FirmwareUpdateModal deviceName={updatingFirmwareDevice} onClose={handleCloseRebootModal} />}
                                    {renderView()}
                                    {activeView === 'dashboard' && (
                                        <div className="mt-8 pt-6 border-t border-cyan-500/20 text-center space-y-2">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Made with <span className="text-red-500">❤️</span> by <span className="font-semibold text-cyan-600 dark:text-cyan-400">Aditya Raj</span>
                                            </p>
                                            <button 
                                                onClick={() => setShowFeedbackModal(true)}
                                                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                                            >
                                                <Icon name="help" className="w-3 h-3" />
                                                Report Issue / Feedback
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}

export default App;