import { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Grid, Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authstore';
import { getSidebarDefsForUser } from './sidebarNav';
import { appShellTheme } from './appShellTheme';
import SummaryRail from './SummaryRail';
import SidebarChrome from './SidebarChrome';

const { Sider, Content, Header } = Layout;

export default function AppShellLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const showRightRail = !!screens.xl;

  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const defs = useMemo(() => getSidebarDefsForUser(user), [user]);

  const initials = useMemo(() => {
    const n = (user?.name || user?.email || user?.username || '?').trim();
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }, [user]);

  const path = location.pathname;

  const go = (next) => {
    navigate(next);
    setMobileOpen(false);
  };

  const logout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  const desktopSider = (
    <Sider
      trigger={null}
      width={collapsed ? 80 : 244}
      style={{
        background: '#151b24',
        borderRight: '1px solid #21262d',
        overflow: 'hidden',
      }}
    >
      <SidebarChrome
        defs={defs}
        path={path}
        user={user}
        initials={initials}
        inlineCollapsed={collapsed}
        showCollapseToggle={!isMobile}
        minFullHeight={isMobile ? undefined : '100vh'}
        onNavigate={go}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onLogout={logout}
      />
    </Sider>
  );

  return (
    <ConfigProvider theme={appShellTheme}>
      <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
        {isMobile ? (
          <Header
            style={{
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#151b24',
              borderBottom: '1px solid #21262d',
              height: 52,
              lineHeight: '52px',
            }}
          >
            <Button type="text" icon={<MenuOutlined />} onClick={() => setMobileOpen(true)} style={{ color: '#e6edf3' }} />
            <span style={{ fontWeight: 600, color: '#e6edf3' }}>Hotel PMS</span>
            <span
              style={{
                marginLeft: 'auto',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#3fb950',
              }}
            />
          </Header>
        ) : null}

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            minHeight: isMobile ? 'calc(100vh - 52px)' : 0,
            background: '#0d1117',
          }}
        >
          {!isMobile ? desktopSider : null}

          <Drawer
            placement="left"
            open={isMobile && mobileOpen}
            onClose={() => setMobileOpen(false)}
            styles={{ body: { padding: 0, background: '#151b24' } }}
            width={276}
          >
            <SidebarChrome
              defs={defs}
              path={path}
              user={user}
              initials={initials}
              inlineCollapsed={false}
              showCollapseToggle={false}
              minFullHeight="100vh"
              onNavigate={go}
              onToggleCollapse={() => {}}
              onLogout={logout}
            />
          </Drawer>

          <Layout
            style={{
              flex: 1,
              background: '#0d1117',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'row',
              minHeight: 0,
              minWidth: 0,
            }}
          >
            <Content style={{ overflow: 'auto', flex: showRightRail ? '1 1 auto' : 1, minWidth: 0, background: '#0d1117' }}>
              <Outlet />
            </Content>

            {showRightRail ? (
              <aside
                style={{
                  width: 296,
                  flexShrink: 0,
                  borderLeft: '1px solid #21262d',
                  background: '#0d1117',
                  overflow: 'auto',
                }}
              >
                <SummaryRail user={user} />
              </aside>
            ) : null}
          </Layout>
        </div>
      </Layout>
    </ConfigProvider>
  );
}
