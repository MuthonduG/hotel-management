import { Menu, Button, Avatar, Typography } from 'antd';
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  UserOutlined,
  HomeOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
  DashboardOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const ICONS = {
  dashboard: <DashboardOutlined />,
  guests: <UserOutlined />,
  rooms: <HomeOutlined />,
  reports: <BarChartOutlined />,
  staff: <TeamOutlined />,
  settings: <SettingOutlined />,
};

/** Left rail content (desktop + drawer). */
export default function SidebarChrome({
  defs,
  path,
  user,
  initials,
  inlineCollapsed,
  showCollapseToggle,
  onNavigate,
  onToggleCollapse,
  onLogout,
  minFullHeight,
}) {
  const menuItems = defs.map((d) => ({
    key: d.path,
    icon: ICONS[d.icon] ?? <AppstoreOutlined />,
    label: d.label,
    onClick: () => onNavigate(d.path),
  }));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: minFullHeight,
        height: '100%',
      }}
    >
      <div style={{ flex: '1 1 auto', overflowY: 'auto' }}>
        <div
          style={{
            padding: inlineCollapsed && showCollapseToggle ? 12 : '20px 18px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid #21262d',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#3fb950',
              boxShadow: '0 0 0 3px rgba(63, 185, 80, 0.25)',
              flexShrink: 0,
            }}
          />
          {!(inlineCollapsed && showCollapseToggle) && (
            <div>
              <div style={{ fontWeight: 650, color: '#e6edf3', fontSize: 15, letterSpacing: '-0.02em' }}>Hotel PMS</div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Operations
              </Text>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={Boolean(inlineCollapsed && showCollapseToggle)}
          selectedKeys={[path]}
          style={{ background: 'transparent', border: 'none', marginTop: 8 }}
          items={menuItems}
        />
      </div>

      <div style={{ flexShrink: 0, padding: 12, borderTop: '1px solid #21262d', background: '#151b24' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            marginBottom: 10,
            borderRadius: 8,
            background: '#1a222d',
          }}
        >
          <Avatar style={{ background: '#238636', flexShrink: 0 }}>{initials}</Avatar>
          {!(inlineCollapsed && showCollapseToggle) && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ color: '#e6edf3', fontWeight: 500, fontSize: 13 }}>{user?.name || user?.username || 'Staff'}</div>
              <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                {user?.email || user?.role}
              </Text>
            </div>
          )}
        </div>

        <Button block type="primary" style={{ marginBottom: 8, border: 'none', background: '#238636', fontWeight: 600 }}>
          Property OK
        </Button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          {showCollapseToggle ? (
            <Button
              type="text"
              size="small"
              icon={inlineCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={onToggleCollapse}
              style={{ color: '#8b949e' }}
            />
          ) : (
            <span />
          )}
          <Button type="text" size="small" icon={<LogoutOutlined />} onClick={onLogout} style={{ color: '#f85149' }} />
        </div>
      </div>
    </div>
  );
}
