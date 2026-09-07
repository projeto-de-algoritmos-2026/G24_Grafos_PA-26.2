import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppShell = () => (
  <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
    <Sidebar />
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
      <Topbar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 56px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);
