import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, LineChart, PieChart, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

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
  };
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icons[name] || <circle cx="12" cy="12" r="10" />}</svg>;
};

const GlassPanel = ({ children, className = '' }) => (
  <div className={`bg-white/60 dark:bg-black/20 backdrop-blur-xl border border-cyan-500/20 dark:border-cyan-300/20 rounded-2xl shadow-lg shadow-cyan-500/10 ${className}`}>
    {children}
  </div>
);

const GlowingBorder = ({ children, className = '' }) => (
  <div className={`relative p-px rounded-2xl group transition-all duration-300 hover:shadow-cyan-500/30 hover:shadow-2xl ${className}`}>
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
    <div className="relative bg-gray-200/80 dark:bg-gray-900/80 rounded-[15px] h-full transition-transform duration-300 group-hover:scale-[1.02]">
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
const initialDevices = [ { id: 'S1-CORE-01', type: 'Switch', ip: '192.168.1.1', status: 'Online', cpu: 15, mem: 45, bootTime: randomBootTime(32) }, { id: 'R1-EDGE-01', type: 'Router', ip: '10.0.0.1', status: 'Online', cpu: 25, mem: 60, bootTime: randomBootTime(120) }, { id: 'SRV-DC-AD-01', type: 'Server', ip: '192.168.10.5', status: 'Online', cpu: 65, mem: 75, bootTime: randomBootTime(5) }, { id: 'AP-LOBBY-01', type: 'Access Point', ip: '192.168.2.10', status: 'Online', cpu: 10, mem: 30, bootTime: randomBootTime(18) }, { id: 'FW-MAIN-01', type: 'Firewall', ip: '10.0.0.2', status: 'Warning', cpu: 92, mem: 55, bootTime: randomBootTime(120) }, { id: 'USER-PC-1123', type: 'User Device', ip: '192.168.1.101', status: 'Offline', cpu: 0, mem: 0, bootTime: null }, { id: 'DNS-PRIMARY', type: 'DNS Server', ip: '8.8.8.8', status: 'Online', cpu: 5, mem: 20, bootTime: randomBootTime(365) }, ];
const initialAlerts = [ { id: 1, severity: 'Warning', message: 'High CPU on SRV-DC-AD-01 (65%).', timestamp: '1m ago' }, { id: 2, severity: 'Critical', message: 'FW-MAIN-01 CPU at 92%', timestamp: '2m ago' }, ];
const initialDnsRecords = [ { id: 1, type: 'A', name: 'example.com', value: '192.0.2.1', ttl: 3600 }, { id: 2, type: 'AAAA', name: 'example.com', value: '2001:0db8::1', ttl: 3600 }, { id: 3, type: 'CNAME', name: 'www.example.com', value: 'example.com', ttl: 3600 }, { id: 4, type: 'MX', name: 'example.com', value: '10 mail.example.com', ttl: 7200 }, { id: 5, type: 'TXT', name: 'example.com', value: '"v=spf1 mx -all"', ttl: 3600 }, ];
const initialAclRules = [ { id: 1, action: 'Allow', protocol: 'TCP', source: '192.168.1.0/24', destination: 'any', port: '443', description: 'Allow HTTPS for LAN', enabled: true, hits: 15023 }, { id: 2, action: 'Deny', protocol: 'UDP', source: 'any', destination: 'any', port: '53', description: 'Deny external DNS', enabled: true, hits: 8345 }, { id: 3, action: 'Allow', protocol: 'ICMP', source: '10.0.0.1', destination: '8.8.8.8', port: 'any', description: 'Allow ping from edge router', enabled: false, hits: 101 }, { id: 4, action: 'Deny', protocol: 'Any', source: '0.0.0.0/0', destination: 'any', port: 'any', description: 'Default Deny All', enabled: true, hits: 234897 }, ];
const initialWirelessDevices = [ { id: 'AP-LOBBY-01', ssid: 'NMS-Guest', mac: '00:1A:2B:3C:4D:5E', ip: '192.168.2.10', signal: -55, status: 'Connected', type: 'Access Point' }, { id: 'SM-G998U1', ssid: 'NMS-Guest', mac: 'A8:F2:78:9A:BC:DE', ip: '192.168.2.115', signal: -62, status: 'Connected', type: 'Phone' }, { id: 'HP-Spectre-X360', ssid: 'NMS-Corp', mac: 'C0:3E:BA:12:34:56', ip: '192.168.3.50', signal: -48, status: 'Connected', type: 'Laptop' }, ];
const initialSwitchDetails = {
    'S1-CORE-01': {
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
            vlan: i < 24 ? 10 : (i < 36 ? 20 : 30)
        }))
    }
};
const initialRouterDetails = {
    'R1-EDGE-01': {
        model: 'ISR 4451-X',
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
    'SRV-DC-AD-01': {
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
    'DNS-PRIMARY': {
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

// --- UI Components ---

const LoginPanel = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        const success = onLogin(username, password);
        if (!success) {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <GlassPanel className="w-full max-w-md p-8 mx-auto">
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
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                    Login
                </button>
            </form>
        </GlassPanel>
    );
};

const Sidebar = ({ navItems, activeView, setActiveView, isSidebarOpen, setIsSidebarOpen }) => {
    return (
        <>
            <div className={`fixed top-0 left-0 h-full p-4 z-30 w-64 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
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

const Header = ({ activeViewLabel, alertsCount, onLogout, onShowAlerts, onToggleSidebar, onToggleProfile, currentTime, timezone }) => (
    <GlassPanel className="w-full p-3 sm:p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={onToggleSidebar} className="md:hidden p-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">
                <Icon name="menu" className="w-6 h-6" />
            </button>
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 capitalize">{activeViewLabel}</h2>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 text-cyan-600 dark:text-cyan-300">
                <Icon name="clock" className="w-6 h-6" />
                <span className="font-mono text-sm">
                    {currentTime.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={onShowAlerts} className="relative p-2 rounded-full hover:bg-cyan-500/10 transition-colors">
                    <Icon name="alert" className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                    {alertsCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">{alertsCount}</span>}
                </button>
                <button onClick={onToggleProfile} className="flex items-center gap-3 p-1 rounded-full hover:bg-cyan-500/10 transition-colors">
                    <img src="https://placehold.co/40x40/0A0A0A/31C48D?text=A" alt="Admin" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-cyan-500 dark:border-cyan-400"/>
                    <div className="hidden md:block text-left">
                        <p className="text-gray-900 dark:text-white font-semibold">Admin</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Network Administrator</p>
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

const ProfileDropdown = ({ onLogout, onShowProfile }) => {
    const menuItems = [
        { label: 'User Profile', icon: 'user', action: onShowProfile },
        { label: 'Change Password', icon: 'lock' },
        { label: 'MFA Settings', icon: 'shieldCheck' },
    ];
    return (
        <div className="fixed top-24 right-4 z-40">
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

const UserProfileModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <GlassPanel className="w-full max-w-lg p-0">
            <div className="flex justify-between items-center p-4 border-b border-cyan-500/20 dark:border-cyan-300/20">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">User Profile</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-cyan-500/20">
                    <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                </button>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                    <img src="https://placehold.co/80x80/0A0A0A/31C48D?text=A" alt="Admin" className="w-20 h-20 rounded-full border-2 border-cyan-500 dark:border-cyan-400"/>
                    <div>
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Admin</h4>
                        <p className="text-cyan-600 dark:text-cyan-300">Network Administrator</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-cyan-500/10 dark:border-cyan-300/10">
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Username</p><p className="text-lg text-gray-900 dark:text-white">admin</p></div>
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Email</p><p className="text-lg text-gray-900 dark:text-white">admin@nms.local</p></div>
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">Last Login</p><p className="text-lg text-gray-900 dark:text-white">2023-10-27 10:30 AM</p></div>
                    <div><p className="text-sm text-gray-500 dark:text-gray-400">MFA Status</p><p className="text-lg text-green-600 dark:text-green-400">Enabled</p></div>
                </div>
            </div>
        </GlassPanel>
    </div>
);


const StatCard = ({ icon, title, value, change, changeType }) => (
    <GlowingBorder>
        <div className="p-5">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-600 dark:text-gray-400 text-lg">{title}</h3>
                <div className="p-2 bg-gray-300/50 dark:bg-gray-800/50 rounded-lg border border-cyan-500/10 dark:border-cyan-300/10">
                    <Icon name={icon} className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
                </div>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
            <div className={`text-sm flex items-center ${changeType === 'increase' ? 'text-red-500' : changeType === 'decrease' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {change}
            </div>
        </div>
    </GlowingBorder>
);

const ChartCard = ({ title, children }) => (
  <GlassPanel className="p-4 h-full flex flex-col">
    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
    <div className="flex-grow w-full h-64 sm:h-80">
        {children}
    </div>
  </GlassPanel>
);

const NetworkTopologyMap = () => (
    <GlassPanel className="p-4 h-[500px] overflow-hidden relative">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Network Topology</h3>
        <svg width="100%" height="100%" viewBox="0 0 800 400">
            <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 255, 255, 0.05)" strokeWidth="0.5"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <g className="connections opacity-40">
                <line x1="100" y1="200" x2="250" y2="100" stroke="#00ffff" strokeWidth="2" /><line x1="100" y1="200" x2="250" y2="300" stroke="#00ffff" strokeWidth="2" /><line x1="250" y1="100" x2="400" y2="100" stroke="#00ffff" strokeWidth="2" /><line x1="250" y1="300" x2="400" y2="300" stroke="#00ffff" strokeWidth="2" /><line x1="400" y1="100" x2="550" y2="200" stroke="#00ffff" strokeWidth="2" /><line x1="400" y1="300" x2="550" y2="200" stroke="#00ffff" strokeWidth="2" /><line x1="550" y1="200" x2="700" y2="100" stroke="#00ffff" strokeWidth="2" /><line x1="550" y1="200" x2="700" y2="300" stroke="#00ffff" strokeWidth="2" />
            </g>
            <circle cx="0" cy="0" r="4" fill="#39ff14"><animateMotion dur="3s" repeatCount="indefinite" path="M100,200 L250,100" /></circle>
            <circle cx="0" cy="0" r="4" fill="#39ff14"><animateMotion dur="4s" repeatCount="indefinite" path="M250,300 L400,300" /></circle>
            <circle cx="0" cy="0" r="4" fill="#ff073a"><animateMotion dur="2.5s" repeatCount="indefinite" path="M550,200 L700,300" /></circle>
            {[{x: 100, y: 200, label: 'R1-EDGE', type: 'router'}, {x: 250, y: 100, label: 'S1-CORE', type: 'switch'}, {x: 250, y: 300, label: 'S2-CORE', type: 'switch'}, {x: 400, y: 100, label: 'FW-01', type: 'firewall'}, {x: 400, y: 300, label: 'FW-02', type: 'firewall'}, {x: 550, y: 200, label: 'R2-INT', type: 'router'}, {x: 700, y: 100, label: 'SRV-01', type: 'server'}, {x: 700, y: 300, label: 'SRV-02', type: 'server'}].map(node => (
                <g key={node.label} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer group">
                    <circle cx="0" cy="0" r="25" fill="#0d1f2d" stroke="#00ffff" strokeWidth="2" className="group-hover:stroke-yellow-400 transition-all"/><circle cx="0" cy="0" r="28" fill="transparent" stroke="#00ffff" strokeWidth="1" strokeDasharray="4 4" className="opacity-30 group-hover:opacity-70 animate-spin-slow"/><text x="0" y="4" textAnchor="middle" fill="#e0e0e0" fontSize="10" className="font-sans">{node.type.charAt(0).toUpperCase()}</text><text x="0" y="45" textAnchor="middle" fill="#cccccc" fontSize="12" className="font-semibold tracking-wider group-hover:fill-white">{node.label}</text>
                </g>
            ))}
        </svg>
    </GlassPanel>
);

const DeviceTable = ({ devices }) => (
    <GlassPanel className="p-4 overflow-x-auto">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Device List</h3>
        <table className="w-full text-left table-auto">
            <thead>
                <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                    <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Device ID</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Type</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">IP Address</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">CPU</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Memory</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">Uptime</th>
                </tr>
            </thead>
            <tbody>
                {devices.map((device) => (
                    <tr key={device.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 transition-colors">
                        <td className="p-3 text-gray-800 dark:text-gray-200 font-mono text-sm">{device.id}</td><td className="p-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{device.type}</td><td className="p-3 text-gray-600 dark:text-gray-300 font-mono text-sm">{device.ip}</td><td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${device.status === 'Online' ? 'bg-green-500/20 text-green-700 dark:text-green-300' : device.status === 'Warning' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>{device.status}</span></td><td className="p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{device.cpu}%</td><td className="p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{device.mem}%</td><td className="p-3 text-gray-600 dark:text-gray-300 hidden lg:table-cell">{formatUptime(device.bootTime)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </GlassPanel>
);

const DashboardView = ({ stats, bandwidthHistory, devices }) => {
    const deviceStatusData = [
        { name: 'Online', value: devices.filter(d => d.status === 'Online').length, color: '#00C49F' },
        { name: 'Warning', value: devices.filter(d => d.status === 'Warning').length, color: '#FFBB28' },
        { name: 'Offline', value: devices.filter(d => d.status === 'Offline').length, color: '#FF8042' },
    ];

    const bandwidthChange = stats.currentBandwidth < stats.bandwidthPeak 
        ? `-${((1 - stats.currentBandwidth / stats.bandwidthPeak) * 100).toFixed(0)}% from peak`
        : 'New Peak!';
    const bandwidthChangeType = stats.currentBandwidth < stats.bandwidthPeak ? 'decrease' : 'increase';

    const latencyChange = stats.avgLatency - stats.latencyBase;
    const latencyChangeText = `${latencyChange >= 0 ? '+' : ''}${latencyChange}ms from avg`;
    const latencyChangeType = latencyChange > 0 ? 'increase' : 'decrease';
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon="switch" title="Total Devices" value={stats.totalDevices} change={`${deviceStatusData[0].value} Online`} changeType="neutral" />
                <StatCard icon="activity" title="Bandwidth" value={`${stats.currentBandwidth} Gbps`} change={bandwidthChange} changeType={bandwidthChangeType}/>
                <StatCard icon="alert" title="Latency" value={`${stats.avgLatency} ms`} change={latencyChangeText} changeType={latencyChangeType}/>
                <StatCard icon="shield" title="Critical Alerts" value={stats.criticalAlerts} change="No change" changeType="neutral"/>
            </div>
            <NetworkTopologyMap />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartCard title="Bandwidth Utilization">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bandwidthHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.1)" /><XAxis dataKey="name" stroke="#8884d8" fontSize={12} /><YAxis stroke="#8884d8" fontSize={12} unit="Mbps"/><Tooltip contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', border: '1px solid #00ffff' }} /><Legend /><Line type="monotone" dataKey="ingress" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 8 }}/><Line type="monotone" dataKey="egress" stroke="#82ca9d" strokeWidth={2} dot={false}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <div>
                     <ChartCard title="Device Status">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={deviceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{deviceStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', border: '1px solid #00ffff' }}/><Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>
            <DeviceTable devices={devices} />
        </div>
    );
}

const DnsRecordForm = ({ onSave, onCancel }) => {
    const [record, setRecord] = useState({ type: 'A', name: '', value: '', ttl: '3600' });
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

const DnsView = ({ records, onAddRecord, onDeleteRecord }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const handleSave = (record) => { onAddRecord(record); setShowAddForm(false); };
    return (
        <div className="space-y-6">
            <GlassPanel className="p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">DNS Records</h3>
                <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity">
                    <Icon name={showAddForm ? 'x' : 'plus'} className="w-5 h-5" />
                    <span>{showAddForm ? 'Cancel' : 'Add Record'}</span>
                </button>
            </GlassPanel>
            {showAddForm && <DnsRecordForm onSave={handleSave} onCancel={() => setShowAddForm(false)} />}
            <GlassPanel className="p-4 overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20"><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Value</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">TTL</th><th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th></tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <tr key={record.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 transition-colors">
                                <td className="p-3 text-cyan-600 dark:text-cyan-300 font-mono text-sm">{record.type}</td><td className="p-3 text-gray-800 dark:text-gray-200 font-mono text-sm break-all">{record.name}</td><td className="p-3 text-gray-600 dark:text-gray-300 font-mono text-sm break-all">{record.value}</td><td className="p-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{record.ttl}</td>
                                <td className="p-3"><button onClick={() => onDeleteRecord(record.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-full transition-colors"><Icon name="trash" className="w-5 h-5"/></button></td>
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

const AclView = ({ rules, onAddRule, onEditRule, onDeleteRule, onToggleRule, onReorderRule }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [ruleToDelete, setRuleToDelete] = useState(null);

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
    
    return (
        <div className="space-y-6">
            <GlassPanel className="p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Access Control List</h3>
                <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity">
                    <Icon name={'plus'} className="w-5 h-5" />
                    <span>Add Rule</span>
                </button>
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
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="border-b border-cyan-500/20 dark:border-cyan-300/20">
                            <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">Order</th>
                            <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                            <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                            <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Protocol</th>
                            <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Source</th>
                            <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Destination</th>
                            <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Port</th>
                            <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Hits</th>
                            <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map((rule, index) => (
                            <tr key={rule.id} className="border-b border-cyan-500/10 dark:border-cyan-300/10 hover:bg-cyan-500/10 group">
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-cyan-600 dark:text-cyan-300">{index + 1}</span>
                                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onReorderRule(index, 'up')} disabled={index === 0} className="disabled:opacity-20"><Icon name="arrowUp" className="w-4 h-4" /></button>
                                            <button onClick={() => onReorderRule(index, 'down')} disabled={index === rules.length - 1} className="disabled:opacity-20"><Icon name="arrowDown" className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3"><ToggleSwitch enabled={rule.enabled} onChange={() => onToggleRule(rule.id)} /></td>
                                <td className="p-3 font-mono text-sm"><span className={rule.action === 'Allow' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{rule.action}</span></td>
                                <td className="p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{rule.protocol}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-200 font-mono text-xs break-all">{rule.source}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300 font-mono text-xs hidden sm:table-cell break-all">{rule.destination}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{rule.port}</td>
                                <td className="p-3 text-yellow-600 dark:text-yellow-300 font-mono text-sm">{rule.hits.toLocaleString()}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openForm(rule)} className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-500/20 rounded-full transition-colors"><Icon name="edit" className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteClick(rule)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"><Icon name="trash" className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassPanel>
        </div>
    );
};
const SpeedTestModal = ({ onClose }) => (
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


const NetworkHealthView = ({ yearlyBandwidthData, onStartSpeedTest }) => {
    const [pingStatus, setPingStatus] = useState({ testing: false, latency: null, status: 'Idle' });

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
            
            <ChartCard title="Yearly Bandwidth Usage">
                <ResponsiveContainer width="100%" height="100%">
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

const WirelessView = ({ devices, onScan, isScanning }) => {
    const [scanRange, setScanRange] = useState({ start: '192.168.2.1', end: '192.168.2.254' });
    const [autoScan, setAutoScan] = useState(false);
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState({ key: 'ssid', direction: 'asc' });

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
                        <ToggleSwitch enabled={autoScan} onChange={() => setAutoScan(!autoScan)} />
                    </div>
                     <button onClick={() => onScan(scanRange)} disabled={isScanning} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                        <Icon name={isScanning ? 'activity' : 'search'} className={`w-5 h-5 ${isScanning ? 'animate-pulse' : ''}`} />
                        <span>{isScanning ? 'Scanning...' : 'Scan Network'}</span>
                    </button>
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

const SettingsView = ({ onSave, currentSettings, onThemeChange }) => {
    const [openSections, setOpenSections] = useState({ global: true });
    const [localSettings, setLocalSettings] = useState({
        timezone: currentSettings.timezone,
        ntpServer: currentSettings.ntpServer
    });
    const [saveStatus, setSaveStatus] = useState('');

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
    
    const timezones = [
        { label: '(UTC-08:00) Pacific Time', value: 'America/Los_Angeles' },
        { label: '(UTC-05:00) Eastern Time', value: 'America/New_York' },
        { label: '(UTC+00:00) Greenwich Mean Time', value: 'Etc/GMT' },
        { label: '(UTC+05:30) India Standard Time', value: 'Asia/Kolkata' },
    ];

    return (
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
                            className="w-full p-2 bg-gray-200/50 dark:bg-black/30 border border-cyan-500/20 dark:border-cyan-300/20 rounded-lg"
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
                <div className="pt-4 mt-4 border-t border-cyan-500/20 dark:border-cyan-300/10 flex justify-end items-center gap-4">
                    {saveStatus && <p className="text-green-400 text-sm animate-pulse">{saveStatus}</p>}
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity"
                    >
                        Save Settings
                    </button>
                </div>
             </SettingsSection>
             
              <SettingsSection title="User & Access Control" isOpen={openSections.users} onToggle={() => toggleSection('users')}>
                <p className="text-gray-500 dark:text-gray-400">Manage user roles, authentication, and API access.</p>
                <button className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-500 dark:text-cyan-300">View Audit Logs</button>
             </SettingsSection>
             
              <SettingsSection title="Discovery & Inventory" isOpen={openSections.discovery} onToggle={() => toggleSection('discovery')}>
                <p className="text-gray-500 dark:text-gray-400">Configure how NMS discovers and classifies devices on your network.</p>
             </SettingsSection>

              <SettingsSection title="Monitoring & Performance" isOpen={openSections.monitoring} onToggle={() => toggleSection('monitoring')}>
                <p className="text-gray-500 dark:text-gray-400">Adjust polling frequencies, thresholds, and data retention policies.</p>
             </SettingsSection>
             
              <SettingsSection title="Alerts & Notifications" isOpen={openSections.alerts} onToggle={() => toggleSection('alerts')}>
                <p className="text-gray-500 dark:text-gray-400">Define alerting rules and configure notification channels like Email, SMS, and Slack.</p>
             </SettingsSection>
             
              <SettingsSection title="Configuration Management" isOpen={openSections.config} onToggle={() => toggleSection('config')}>
                <p className="text-gray-500 dark:text-gray-400">Manage device configuration backups, versioning, and push templates.</p>
             </SettingsSection>

              <SettingsSection title="Automation & Orchestration" isOpen={openSections.automation} onToggle={() => toggleSection('automation')}>
                <p className="text-gray-500 dark:text-gray-400">Schedule jobs and manage scripts or playbooks for automated tasks.</p>
             </SettingsSection>
             
              <SettingsSection title="Logs & Event Management" isOpen={openSections.logs} onToggle={() => toggleSection('logs')}>
                <p className="text-gray-500 dark:text-gray-400">Configure Syslog receivers, log retention, and forwarding to SIEM tools.</p>
             </SettingsSection>

              <SettingsSection title="Integrations" isOpen={openSections.integrations} onToggle={() => toggleSection('integrations')}>
                <p className="text-gray-500 dark:text-gray-400">Connect NMS with other tools like ServiceNow, Jira, and Slack.</p>
             </SettingsSection>

              <SettingsSection title="High Availability & Backup" isOpen={openSections.ha} onToggle={() => toggleSection('ha')}>
                <p className="text-gray-500 dark:text-gray-400">Configure system backups and failover settings.</p>
             </SettingsSection>
        </div>
    );
};

const SwitchesView = ({ switches, onRebootSwitch, onUpdateFirmware }) => {
    const [selectedSwitchId, setSelectedSwitchId] = useState(switches.length > 0 ? switches[0].id : null);
    const selectedSwitch = switches.find(s => s.id === selectedSwitchId);
    const switchDetails = initialSwitchDetails[selectedSwitchId] || { vlans: [], ports: [] };
    const [showConfirmReboot, setShowConfirmReboot] = useState(false);
    const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);


    const getPortColor = (status) => {
        switch (status) {
            case 'up': return 'bg-green-500/80 border-green-400';
            case 'down': return 'bg-red-500/80 border-red-400';
            case 'disabled': return 'bg-gray-600/80 border-gray-500';
            default: return 'bg-gray-700';
        }
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
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setShowConfirmReboot(true)} className="px-3 py-2 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 dark:text-red-300 transition-colors">Reboot Switch</button>
                        <button className="px-3 py-2 text-sm rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 dark:text-indigo-300 transition-colors">Backup Config</button>
                        <button onClick={() => setShowConfirmUpdate(true)} className="px-3 py-2 text-sm rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 dark:text-purple-300 transition-colors">Firmware Update</button>
                    </div>
                </GlassPanel>

                {selectedSwitch && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard icon="server" title="Model" value={switchDetails.model || 'N/A'} change={selectedSwitch.ip} />
                            <StatCard icon="settings" title="Firmware" value={switchDetails.firmware || 'N/A'} change="Up to date" changeType="decrease" />
                            <StatCard icon="activity" title="Uptime" value={formatUptime(selectedSwitch.bootTime) || 'N/A'} />
                        </div>

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
        </>
    );
};
const RoutersView = ({ routers, onRebootRouter }) => {
    const [selectedRouterId, setSelectedRouterId] = useState(routers.length > 0 ? routers[0].id : null);
    const selectedRouter = routers.find(r => r.id === selectedRouterId);
    const routerDetails = initialRouterDetails[selectedRouterId] || { bgpNeighbors: [], routingTable: [] };
    const [showConfirmReboot, setShowConfirmReboot] = useState(false);

    const handleRebootClick = () => {
        setShowConfirmReboot(true);
    };

    const confirmReboot = () => {
        onRebootRouter(selectedRouterId);
        setShowConfirmReboot(false);
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
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={handleRebootClick} className="px-3 py-2 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 dark:text-red-300 transition-colors">Reboot Router</button>
                        <button className="px-3 py-2 text-sm rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 dark:text-indigo-300 transition-colors">Backup Config</button>
                    </div>
                </GlassPanel>

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
        </>
    );
};

const RebootModal = ({ deviceName, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const logContainerRef = useRef(null);

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

const ServersView = ({ servers, onRebootServer }) => {
    const [selectedServerId, setSelectedServerId] = useState(servers.length > 0 ? servers[0].id : null);
    const selectedServer = servers.find(s => s.id === selectedServerId);
    
    const [serverDetails, setServerDetails] = useState(initialServerDetails[selectedServerId] || { services: [], performance: {cpu:[], memory:[], disk:[]} });
    const [showConfirmReboot, setShowConfirmReboot] = useState(false);

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
                const baseCpu = selectedServerId === 'SRV-DC-AD-01' ? 60 : 5;
                const baseMem = selectedServerId === 'SRV-DC-AD-01' ? 70 : 18;

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
                 <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowConfirmReboot(true)} className="px-3 py-2 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 dark:text-red-300 transition-colors">Reboot Server</button>
                    <button className="px-3 py-2 text-sm rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 dark:text-indigo-300 transition-colors">Backup</button>
                </div>
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
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAlertsPanel, setShowAlertsPanel] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showUserProfileModal, setShowUserProfileModal] = useState(false);
    const [showSpeedTestModal, setShowSpeedTestModal] = useState(false);
    const [rebootingDevice, setRebootingDevice] = useState(null);
    const [updatingFirmwareDevice, setUpdatingFirmwareDevice] = useState(null);
    const [activeView, setActiveView] = useState('dashboard');
    
    const [devices, setDevices] = useState(initialDevices);
    const [bandwidthHistory, setBandwidthHistory] = useState(initialBandwidthData);
    const [yearlyBandwidth, setYearlyBandwidth] = useState(initialYearlyBandwidth);
    const [alerts, setAlerts] = useState(initialAlerts);
    const [dnsRecords, setDnsRecords] = useState(initialDnsRecords);
    const [aclRules, setAclRules] = useState(initialAclRules);
    const [wirelessDevices, setWirelessDevices] = useState(initialWirelessDevices);
    const [isScanning, setIsScanning] = useState(false);
    
    // ✅ Main state for settings, with theme defaulting to 'dark'
    const [settings, setSettings] = useState({ theme: 'dark', timezone: 'Asia/Kolkata', ntpServer: 'pool.ntp.org' });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const [stats, setStats] = useState({
        totalDevices: initialDevices.length,
        currentBandwidth: 1.4,
        avgLatency: 21,
        criticalAlerts: initialAlerts.filter(a => a.severity === 'Critical').length,
        bandwidthPeak: 1.8,
        latencyBase: 22,
    });
    
    const navItems = [
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' }, { id: 'switches', icon: 'switch', label: 'Switches' },
        { id: 'routers', icon: 'router', label: 'Routers' }, { id: 'servers', icon: 'server', label: 'Servers' },
        { id: 'wireless', icon: 'wifi', label: 'Wireless' }, { id: 'dns', icon: 'dns', label: 'DNS' },
        { id: 'acl', icon: 'shield', label: 'ACL' }, { id: 'health', icon: 'activity', label: 'Network Health' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
    ];
    
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
                        if (newCpu > 85 || newMem > 90) {
                            if (device.status !== 'Warning') {
                                newAlerts.push({id: Date.now() + 1, severity: 'Warning', message: `High CPU on ${device.id} (${newCpu}%)`, timestamp: 'Just now'});
                            }
                            newStatus = 'Warning';
                        } else if (newCpu < 60 && newMem < 70) {
                            newStatus = 'Online';
                        }
                        return { ...device, status: newStatus, cpu: newCpu, mem: newMem };
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
    
    const handleLogin = (username, password) => {
        if (username === 'admin' && password === 'password') { setIsAuthenticated(true); return true; }
        return false;
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

    const renderView = () => {
        switch(activeView) {
            case 'dashboard': return <DashboardView stats={stats} bandwidthHistory={bandwidthHistory} devices={devices} />;
            case 'switches': 
                return <SwitchesView 
                    switches={devices.filter(d => d.type.toLowerCase() === 'switch')}
                    onRebootSwitch={handleRebootDevice}
                    onUpdateFirmware={handleUpdateFirmware}
                />;
            case 'routers': 
                return <RoutersView 
                    routers={devices.filter(d => d.type.toLowerCase() === 'router')} 
                    onRebootRouter={handleRebootDevice} 
                />;
            case 'servers':
                return <ServersView 
                    servers={devices.filter(d => d.type.toLowerCase().includes('server'))} 
                    onRebootServer={handleRebootDevice} 
                />;
            case 'wireless': return <WirelessView devices={wirelessDevices} onScan={handleWirelessScan} isScanning={isScanning}/>;
            case 'dns': return <DnsView records={dnsRecords} onAddRecord={handleAddDnsRecord} onDeleteRecord={handleDeleteDnsRecord} />;
            case 'acl': return <AclView rules={aclRules} onAddRule={handleAddAclRule} onEditRule={handleEditAclRule} onDeleteRule={handleDeleteAclRule} onToggleRule={handleToggleAclRule} onReorderRule={handleMoveAclRule} />;
            case 'health': return <NetworkHealthView yearlyBandwidthData={yearlyBandwidth} onStartSpeedTest={() => setShowSpeedTestModal(true)} />;
            // ✅ We now pass the new theme handler to SettingsView
            case 'settings': 
                return <SettingsView 
                    onSave={handleSettingsSave} 
                    currentSettings={settings} 
                    onThemeChange={handleThemeChange} 
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
        // ✅ The 'dark' or 'light' class is applied here, along with background colors
        <div className={`min-h-screen text-gray-800 dark:text-gray-200 font-sans flex items-center justify-center bg-gray-100 dark:bg-[#020c1a] ${settings.theme}`}>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80801212_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,#00c4ff,transparent)]"></div>
            </div>
            
            {!isAuthenticated ? (
                <div className="z-10 w-full p-4 flex items-center justify-center"><LoginPanel onLogin={handleLogin} /></div>
            ) : (
                <div className="w-full h-screen z-10 flex">
                    <Sidebar navItems={navItems} activeView={activeView} setActiveView={setActiveView} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                    <main className="flex-1 w-full h-full transition-all duration-300 md:ml-64">
                        <div className="h-full w-full max-w-7xl mx-auto p-4 overflow-y-auto">
                            <div className="space-y-6">
                                <Header 
                                    activeViewLabel={activeNavItem.label} 
                                    alertsCount={alerts.length} 
                                    onLogout={handleLogout} 
                                    onShowAlerts={() => setShowAlertsPanel(!showAlertsPanel)} 
                                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                                    onToggleProfile={() => setShowProfileDropdown(!showProfileDropdown)}
                                    currentTime={currentTime}
                                    timezone={settings.timezone}
                                />
                                {showAlertsPanel && <AlertsPanel alerts={alerts} onClose={() => setShowAlertsPanel(false)} />}
                                {showProfileDropdown && <ProfileDropdown onLogout={handleLogout} onShowProfile={() => { setShowProfileDropdown(false); setShowUserProfileModal(true);}} />}
                                {showUserProfileModal && <UserProfileModal onClose={() => setShowUserProfileModal(false)} />}
                                {showSpeedTestModal && <SpeedTestModal onClose={() => setShowSpeedTestModal(false)} />}
                                {rebootingDevice && <RebootModal deviceName={rebootingDevice} onClose={handleCloseRebootModal} />}
                                {updatingFirmwareDevice && <FirmwareUpdateModal deviceName={updatingFirmwareDevice} onClose={handleCloseRebootModal} />}
                                {renderView()}
                            </div>
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
}