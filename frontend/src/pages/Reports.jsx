import { useEffect } from 'react';
import { Card, Col, Divider, Row, Space, Spin, Statistic, Tag, Typography } from 'antd';
import toast from 'react-hot-toast';
import { useOpsSummary } from '../hooks/useOpsSummary';

const { Paragraph, Title } = Typography;

const cardStyle = {
  background: '#161b22',
  borderRadius: 8,
  border: '1px solid #21262d',
};
const headerStyle = { background: '#12181f', borderBottom: '1px solid #21262d', color: '#e6edf3' };

export default function Reports() {
  const q = useOpsSummary();

  useEffect(() => {
    if (!q.isError) return;
    const msg = q.error?.response?.data?.message || q.error?.message || 'Could not load report summary.';
    toast.error(msg);
  }, [q.isError, q.error]);

  const d = q.data ?? {};
  const occupied = (d.roomsByStatus ?? []).find((r) => r.status === 'occupied')?.count ?? 0;
  const occ =
    (d.totalRooms ?? 0) > 0 ? ((occupied / d.totalRooms) * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '28px clamp(18px, 3vw, 36px)', minHeight: '100%', color: '#e6edf3' }}>
      <Card bordered={false} style={cardStyle} styles={{ header: headerStyle }} title="Reports">
        <Spin spinning={q.isLoading}>
          <Paragraph type="secondary" style={{ color: '#8b949e', marginBottom: 20 }}>
            Room counts, stays, arrivals, departures, and booked revenue totals.
          </Paragraph>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="Booked revenue (estimate)" value={(d.revenuePipeline ?? 0).toFixed(2)} prefix="$" />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="Estimated occupancy (by room)" value={occ} suffix="%" />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="In-house stays" value={d.inHouseGuests ?? 0} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title="Rooms" value={d.totalRooms ?? 0} />
            </Col>
          </Row>
          <Divider style={{ borderColor: '#30363d' }} />
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Title level={5} style={{ color: '#e6edf3' }}>
                Rooms by housekeeping / front status
              </Title>
              <SpaceTags items={d.roomsByStatus ?? []} />
            </Col>
            <Col xs={24} lg={12}>
              <Title level={5} style={{ color: '#e6edf3' }}>
                Reservations by stay status
              </Title>
              <SpaceTags items={d.reservationsByStatus ?? []} substituteSpace />
            </Col>
          </Row>
          <Divider style={{ borderColor: '#30363d' }} />
          <Title level={5} style={{ color: '#e6edf3', marginBottom: 8 }}>
            Front desk pulses
          </Title>
          <Paragraph style={{ color: '#8b949e', marginBottom: 0 }}>
            Arrivals in the next ~36 hours (upcoming / in-house overlaps):{' '}
            <strong style={{ color: '#e6edf3' }}>{d.arrivalsSoon ?? 0}</strong>. Departures rolling through tomorrow:{' '}
            <strong style={{ color: '#e6edf3' }}>{d.departuresTomorrow ?? 0}</strong>.
          </Paragraph>
        </Spin>
      </Card>
    </div>
  );
}

function SpaceTags({ items, substituteSpace }) {
  if (!(items ?? []).length) {
    return <Paragraph style={{ color: '#8b949e' }}>No data.</Paragraph>;
  }
  return (
    <Space wrap align="flex-start">
      {items.map((row) => (
        <Tag key={row.status} style={{ padding: '4px 12px', fontSize: 14 }}>
          {(substituteSpace ? row.status.replace(/_/g, ' ') : row.status)} · {row.count}
        </Tag>
      ))}
    </Space>
  );
}
