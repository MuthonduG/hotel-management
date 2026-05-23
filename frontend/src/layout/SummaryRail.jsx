import { Card, Typography, Row, Col, Flex, Spin } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { normalizeRole, ROLE_DESCRIPTIONS } from '../auth/roles';
import { useOpsSummary } from '../hooks/useOpsSummary';

const { Text, Title } = Typography;

export default function SummaryRail({ user }) {
  const role = normalizeRole(user?.role);
  const { data: s, isLoading, isError } = useOpsSummary();

  const vacant = Number(s?.vacantRooms) || 0;
  const dirty = Number(s?.dirtyRooms) || 0;
  const cleaning = Number(s?.cleaningRooms) || 0;
  const inspecting = Number(s?.inspectingRooms) || 0;
  const maintenance = Number(s?.maintenanceRooms) || 0;
  const occupied = Number(s?.occupiedRooms) || 0;
  const total = Number(s?.totalRooms) || 0;
  const attention = dirty + maintenance;
  const holdPipeline = cleaning + inspecting;
  const occPct =
    total > 0 ? (((occupied / total) * 100).toFixed(1)) : null;
  const arrToday = s?.arrivalsDueToday;
  const depToday = s?.departuresDueToday;

  const trendNeutral = occPct === null ? true : occupied <= vacant;

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card size="small" styles={{ body: { padding: 16 } }}>
        <Spin spinning={isLoading}>
          <Flex vertical align="flex-start" gap={12}>
            <Text type="secondary" style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Current status
            </Text>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: `2px solid ${trendNeutral ? 'rgba(63,185,80,0.6)' : 'rgba(248,129,129,0.55)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: trendNeutral ? '#3fb950' : '#ff7b72',
              }}
            >
              {trendNeutral ? <ArrowUpOutlined style={{ fontSize: 22 }} /> : <ArrowDownOutlined style={{ fontSize: 22 }} />}
            </div>
            <Row gutter={[8, 8]} style={{ width: '100%' }}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 650, color: '#f85149' }}>{isLoading ? '-' : attention}</div>
                  <div style={{ fontSize: 10, color: '#8b949e' }}>Attention</div>
                  <div style={{ fontSize: 9, color: '#484f58' }}>Dirty + out of order</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 650, color: '#3fb950' }}>{isLoading ? '-' : vacant}</div>
                  <div style={{ fontSize: 10, color: '#8b949e' }}>Ready</div>
                  <div style={{ fontSize: 9, color: '#484f58' }}>Vacant</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 650, color: '#8b949e' }}>{isLoading ? '-' : holdPipeline}</div>
                  <div style={{ fontSize: 10, color: '#8b949e' }}>In flight</div>
                  <div style={{ fontSize: 9, color: '#484f58' }}>Cleaning / inspection</div>
                </div>
              </Col>
            </Row>
            {role ? (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {ROLE_DESCRIPTIONS[role] ?? `Role · ${role}`}
              </Text>
            ) : null}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {!isLoading && !isError && occPct != null ? `${occPct}% rooms occupied.` : null}{' '}
              {!isLoading && arrToday != null ? `${arrToday} arrivals scheduled today.` : null}{' '}
              {!isLoading && dirty != null && cleaning != null
                ? `${dirty + cleaning + inspecting} rooms in housekeeping`
                : null}{' '}
              {isError ? 'Numbers could not be loaded.' : ''}
            </Text>
          </Flex>
        </Spin>
      </Card>

      <Card size="small" styles={{ body: { padding: 16 } }}>
        <Text type="secondary" style={{ fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Arrivals & departures
        </Text>
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col span={12}>
            <div style={{ color: '#8b949e', fontSize: 11 }}>Expected arrivals</div>
            <Title level={5} style={{ margin: '4px 0 0', color: '#e6edf3' }}>
              {isLoading ? '-' : s?.arrivalsSoon ?? 0}
            </Title>
          </Col>
          <Col span={12}>
            <div style={{ color: '#8b949e', fontSize: 11 }}>Checkouts tomorrow</div>
            <Title level={5} style={{ margin: '4px 0 0', color: '#e6edf3' }}>
              {isLoading ? '-' : s?.departuresTomorrow ?? 0}
            </Title>
          </Col>
          <Col span={12}>
            <div style={{ color: '#8b949e', fontSize: 11 }}>Departures today</div>
            <Title level={5} style={{ margin: '4px 0 0', color: '#e6edf3' }}>
              {isLoading ? '-' : depToday ?? '-'}
            </Title>
          </Col>
          <Col span={12}>
            <div style={{ color: '#8b949e', fontSize: 11 }}>Booked revenue (estimate)</div>
            <Title level={5} style={{ margin: '4px 0 0', color: '#79c0ff' }}>
              {isLoading ? '-' : `$${Math.round(Number(s?.revenuePipeline ?? 0)).toLocaleString()}`}
            </Title>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
