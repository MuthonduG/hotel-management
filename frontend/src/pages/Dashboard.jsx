import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Typography,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Alert,
  Grid,
  Dropdown,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authstore';
import { normalizeRole, ROLE_DESCRIPTIONS, ROLE } from '../auth/roles';
import { useOpsSummary } from '../hooks/useOpsSummary';
import SummaryRail from '../layout/SummaryRail';

const { Title, Paragraph, Text } = Typography;

const SORT_OPTS = [
  { value: 'priority', label: 'Needs attention first' },
  { value: 'name', label: 'Title A-Z' },
];

function fmtUsd(n) {
  return Number(n ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
}

/** @returns {'frontdesk'|'housekeeping'|'maintenance'|'finance'|'executive'} */
function dashboardFocus(normalizedRole) {
  switch (normalizedRole) {
    case ROLE.HOUSEKEEPING_MANAGER:
    case ROLE.HOUSEKEEPING:
      return 'housekeeping';
    case ROLE.REVENUE_MANAGER:
    case ROLE.ACCOUNTANT:
      return 'finance';
    case ROLE.MAINTENANCE_MANAGER:
    case ROLE.MAINTENANCE:
      return 'maintenance';
    case ROLE.FRONT_OFFICE_MANAGER:
    case ROLE.RECEPTIONIST:
      return 'frontdesk';
    default:
      return 'executive';
  }
}

function overviewTitle(focus, normalizedRoleLabel) {
  switch (focus) {
    case 'frontdesk':
      return 'Front desk pulse';
    case 'housekeeping':
      return 'Housekeeping workload';
    case 'maintenance':
      return 'Engineering & room holds';
    case 'finance':
      return 'Revenue & occupancy';
    default:
      return normalizedRoleLabel &&
        (normalizedRoleLabel.includes('Manager') || normalizedRoleLabel === ROLE.SYSTEM_ADMIN || normalizedRoleLabel === ROLE.GENERAL_MANAGER)
        ? 'Property snapshot'
        : 'Operations overview';
  }
}

/** @param emphasis {'good'|'caution'|'alert'|'neutral'} */
function statusIcon(kind) {
  if (kind === 'good')
    return <CheckCircleOutlined style={{ color: '#3fb950', fontSize: 22 }} />;
  if (kind === 'caution')
    return <WarningOutlined style={{ color: '#d29922', fontSize: 22 }} />;
  if (kind === 'alert')
    return <ClockCircleOutlined style={{ color: '#f85149', fontSize: 22 }} />;
  return <CheckCircleOutlined style={{ color: '#58a6ff', fontSize: 22 }} />;
}

/** @typedef {{ key: string, title: string, subtitle: string, detail: string, metric: string, emphasis: 'good'|'caution'|'alert'|'neutral', navigate: string }} CardRow */

/** @returns {CardRow[]} */
function buildRealtimeCards(focus, raw) {
  const s = raw ?? {};
  const totalRooms = Number(s.totalRooms) || 0;
  const vacant = Number(s.vacantRooms) || 0;
  const occupied = Number(s.occupiedRooms) || 0;
  const dirty = Number(s.dirtyRooms) || 0;
  const cleaning = Number(s.cleaningRooms) || 0;
  const inspecting = Number(s.inspectingRooms) || 0;
  const maintenance = Number(s.maintenanceRooms) || 0;
  const turnover = Number(s.turnoverRooms) || dirty + cleaning + inspecting;
  const occPct = totalRooms ? ((occupied / totalRooms) * 100).toFixed(1) : '0';
  const inHouse = Number(s.inHouseGuests) || 0;
  const arrToday = Number(s.arrivalsDueToday) || 0;
  const depToday = Number(s.departuresDueToday) || 0;
  const upcoming = Number(s.upcomingBookings) || 0;
  const revenue = Number(s.revenuePipeline) || 0;

  const availEmphasis =
    vacant === 0 ? 'alert' : vacant < Math.ceil(totalRooms * 0.12) ? 'caution' : 'good';

  /** @type {CardRow[]} */
  const frontdesk = [
    {
      key: 'avail',
      title: 'Rooms available to assign',
      subtitle: `Vacant & ready (${vacant} of ${totalRooms} rooms)`,
      detail: `${occPct}% of rooms occupied. Manage assignments under Rooms.`,
      metric: vacant.toString(),
      emphasis: availEmphasis,
      navigate: '/rooms',
    },
    {
      key: 'inhouse',
      title: 'In-house stays',
      subtitle: `${inHouse} guests checked in`,
      detail: `${depToday} checkout${depToday !== 1 ? 's' : ''} scheduled for today`,
      metric: String(inHouse),
      emphasis: depToday > inHouse ? 'neutral' : 'neutral',
      navigate: '/guests',
    },
    {
      key: 'arr',
      title: 'Arrivals today',
      subtitle: 'Upcoming or already on the books for this calendar day',
      detail: `${arrToday} for today · ${upcoming} upcoming overall`,
      metric: String(arrToday),
      emphasis: arrToday > 8 ? 'caution' : 'good',
      navigate: '/guests',
    },
    {
      key: 'dep',
      title: 'Departures today',
      subtitle: 'Guests departing today',
      detail: `${turnover} room${turnover !== 1 ? 's' : ''} being turned (dirty, clean, ready)`,
      metric: String(depToday),
      emphasis: turnover > vacant ? 'caution' : 'good',
      navigate: '/guests',
    },
    {
      key: 'maint',
      title: 'Rooms off market',
      subtitle: 'Maintenance holds cannot be assigned',
      detail: `${maintenance} room${maintenance !== 1 ? 's' : ''} flagged maintenance`,
      metric: String(maintenance),
      emphasis: maintenance > 0 ? 'caution' : 'good',
      navigate: '/rooms',
    },
  ];

  const housekeeping = [
    {
      key: 'dirty',
      title: 'Dirty queue',
      subtitle: 'Rooms waiting for housekeeping',
      detail: `${occupied} rooms with guests · ${turnover} in turnaround`,
      metric: String(dirty),
      emphasis: dirty > Math.ceil(totalRooms * 0.2) ? 'caution' : dirty > 0 ? 'neutral' : 'good',
      navigate: '/rooms',
    },
    {
      key: 'cleaning',
      title: 'In progress',
      subtitle: `Cleaning (${cleaning}) + inspection (${inspecting})`,
      detail: `${vacant} vacant and ready to sell`,
      metric: String(cleaning + inspecting),
      emphasis: cleaning + inspecting > 6 ? 'caution' : 'neutral',
      navigate: '/rooms',
    },
    {
      key: 'vac',
      title: 'Rooms ready for guests',
      subtitle: `Vacant and cleared (${vacant} rooms)`,
      metric: String(vacant),
      emphasis: availEmphasis,
      detail: `${maintenance} maintenance hold${maintenance !== 1 ? 's' : ''}`,
      navigate: '/rooms',
    },
  ];

  const maintenanceFocus = [
    {
      key: 'maint',
      title: 'Rooms in maintenance',
      subtitle: 'Out of order for repairs',
      detail: `${dirty} dirty · ${vacant} vacant around the hotel`,
      metric: String(maintenance),
      emphasis: maintenance === 0 ? 'good' : 'caution',
      navigate: '/rooms',
    },
    {
      key: 'occ',
      title: 'Hotel snapshot',
      subtitle: `${occupied} occupied rooms · ${vacant} vacant`,
      detail: `${inHouse} guests in house`,
      metric: occupied.toString(),
      emphasis: 'neutral',
      navigate: '/reports',
    },
  ];

  const finance = [
    {
      key: 'rev',
      title: 'Booked revenue (estimate)',
      subtitle: 'Totals on active and upcoming stays',
      detail: fmtUsd(revenue),
      metric: fmtUsd(revenue),
      emphasis: revenue <= 0 ? 'caution' : 'neutral',
      navigate: '/reports',
    },
    {
      key: 'occPct',
      title: 'Rooms occupied',
      subtitle: `${occPct}% of rooms show occupied`,
      detail: `${inHouse} guests checked in`,
      metric: `${occPct}%`,
      emphasis: Number(occPct) > 90 ? 'caution' : 'neutral',
      navigate: '/reports',
    },
    {
      key: 'book',
      title: 'Upcoming reservations',
      subtitle: `${upcoming} bookings not checked in yet`,
      detail: `${arrToday} arrivals today`,
      metric: String(upcoming),
      emphasis: 'neutral',
      navigate: '/guests',
    },
  ];

  const executive = [
    frontdesk[0],
    frontdesk[1],
    frontdesk[2],
    frontdesk[3],
    {
      key: 'turn',
      title: 'Rooms in turnaround',
      subtitle: `${turnover} rooms moving from dirty to clean to ready`,
      detail: `${cleaning} cleaning · ${inspecting} inspecting (${dirty} dirty)`,
      metric: String(turnover),
      emphasis: turnover > vacant ? 'caution' : 'neutral',
      navigate: '/rooms',
    },
    finance[0],
  ];

  switch (focus) {
    case 'frontdesk':
      return frontdesk;
    case 'housekeeping':
      return housekeeping;
    case 'maintenance':
      return maintenanceFocus;
    case 'finance':
      return finance;
    default:
      return executive.slice(0, 6);
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const role = normalizeRole(user?.role);
  const focus = role ? dashboardFocus(role) : 'executive';
  const deniedToast = useRef(false);

  const { data: summary, isLoading, isFetching, isError, error, refetch } = useOpsSummary();

  const [q, setQ] = useState('');
  const [sort, setSort] = useState('priority');
  const screens = Grid.useBreakpoint();
  const compactRail = !screens.xl;

  useEffect(() => {
    const d = location.state?.accessDenied;
    if (!d || deniedToast.current) return;
    deniedToast.current = true;
    if (d === 'forbidden') {
      toast.error('You do not have access to that area.', { id: 'access-denied' });
    } else if (d === 'no-role') {
      toast.error('Your account has no role assigned. Contact an administrator.', { id: 'access-denied' });
    }
  }, [location.state]);

  useEffect(() => {
    if (!isError) return;
    const msg =
      error?.response?.data?.message || error?.message || 'Could not load the overview.';
    toast.error(msg, { id: 'ops-summary-error' });
  }, [isError, error]);

  const monitors = useMemo(() => {
    if (!role) return [];
    return buildRealtimeCards(focus, summary);
  }, [focus, summary, role]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = s ? monitors.filter((m) => `${m.title} ${m.subtitle}`.toLowerCase().includes(s)) : monitors;
    list = [...list];
    if (sort === 'name') list.sort((a, b) => a.title.localeCompare(b.title));
    else {
      const order = { alert: 0, caution: 1, neutral: 2, good: 3 };
      list.sort((a, b) => order[a.emphasis] - order[b.emphasis]);
    }
    return list;
  }, [monitors, q, sort]);

  const metricColor = (e) =>
    e === 'good'
      ? '#3fb950'
      : e === 'caution'
        ? '#d29922'
        : e === 'alert'
          ? '#ff7b72'
          : '#79c0ff';

  const newHref =
    focus === 'housekeeping'
      ? '/rooms'
      : focus === 'finance'
        ? '/reports'
        : '/guests';

  const pageTitle = overviewTitle(focus, role);

  return (
    <div style={{ padding: '24px clamp(18px, 3vw, 32px)', minHeight: '100%', color: '#e6edf3' }}>
      {!role ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24, background: '#211c12', borderColor: '#59400a', color: '#e6edf3' }}
          message="No role on this account"
          description="Ask your administrator to assign a role to this account."
        />
      ) : null}

      <div style={{ marginBottom: 22, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14 }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <Title level={2} style={{ margin: '0 0 6px', color: '#e6edf3', fontWeight: 650 }}>
            {pageTitle}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0, color: '#8b949e' }}>
            {user?.name ? (
              <>
                Signed in as <Text strong style={{ color: '#e6edf3' }}>{user.name}</Text>
                {role ? (
                  <>
                    {' '}
                    · <Tag bordered={false} style={{ background: '#21262d', color: '#79c0ff' }}>{role}</Tag>
                  </>
                ) : null}
              </>
            ) : (
              'Signed in.'
            )}
          </Paragraph>
          {role && ROLE_DESCRIPTIONS[role] ? (
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 6 }}>
              {ROLE_DESCRIPTIONS[role]}
            </Text>
          ) : null}
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(newHref)} style={{ fontWeight: 600 }}>
            New
          </Button>
        </Space>
      </div>

      {!isLoading && isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 18, background: '#281018', borderColor: '#5a1f2f', color: '#e6edf3' }}
          message="Live stats unavailable"
          description={
            error?.response?.data?.message ||
            error?.message ||
            'If this keeps happening, ask your administrator to check the hotel system.'
          }
        />
      ) : null}

      <Card
        size="small"
        styles={{
          header: {
            padding: '10px 16px',
            borderBottom: '1px solid #21262d',
            background: '#12181f',
            color: '#e6edf3',
          },
          body: { padding: 16, background: '#0d1117' },
        }}
        variant="borderless"
        title={
          <Space wrap split={<span style={{ color: '#30363d' }}>|</span>}>
            <Text type="secondary" style={{ maxWidth: 420 }}>
              {role ? 'Shown for your role. Search to narrow the list.' : 'Sign in needs a staff role to show details.'}
            </Text>
            <Input
              allowClear
              placeholder="Filter rows…"
              prefix={<SearchOutlined style={{ color: '#6e7681' }} />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: screens.md ? 280 : '100%', maxWidth: 360, background: '#0d1117' }}
              size="middle"
            />
            <Select
              popupMatchSelectWidth={false}
              value={sort}
              onChange={setSort}
              options={SORT_OPTS}
              size="small"
              variant="filled"
              style={{ minWidth: 160 }}
            />
          </Space>
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {isLoading && !filtered.length ? (
            <Card size="small" variant="borderless" styles={{ body: { padding: 32, background: '#161b22' } }}>
              <Text style={{ color: '#8b949e' }}>Loading…</Text>
            </Card>
          ) : null}
          {filtered.map((m) => (
            <Card
              key={m.key}
              size="small"
              variant="borderless"
              hoverable={false}
              styles={{
                body: {
                  padding: '14px 16px',
                  background: '#161b22',
                  borderRadius: 8,
                  border: '1px solid #21262d',
                  transition: 'border-color .15s',
                },
              }}
              style={{ cursor: 'default' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 200px', minWidth: 0 }}>
                  {statusIcon(m.emphasis)}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#e6edf3', fontSize: 15 }}>{m.title}</div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      {m.subtitle}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
                      {m.detail}
                    </Text>
                  </div>
                </div>
                <div
                  style={{
                    minWidth: 120,
                    textAlign: 'right',
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      lineHeight: 1.15,
                      color: metricColor(m.emphasis),
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {m.metric}
                  </div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                    {isFetching ? 'Updating…' : 'Pull Refresh to reload'}
                  </Text>
                </div>
                <Dropdown
                  placement="bottomRight"
                  trigger={['click']}
                  menu={{
                    items: [{ key: 'open', label: 'Open related workspace', onClick: () => navigate(m.navigate) }],
                  }}
                >
                  <Button type="text" icon={<MoreOutlined />} style={{ color: '#8b949e', marginLeft: 'auto' }} />
                </Dropdown>
              </div>
            </Card>
          ))}
          {!filtered.length && !isLoading ? (
            <Text type="secondary">No KPI rows matched your filters.</Text>
          ) : null}
        </Space>
      </Card>

      {compactRail ? (
        <div style={{ marginTop: 24 }}>
          <SummaryRail user={user} />
        </div>
      ) : null}
    </div>
  );
}
