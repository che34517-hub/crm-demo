import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntdApp, Button, Col, Form, Modal, Row, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Lead, LeadStatus } from '../types';
import { fmt } from '../utils/format';
import StatCard from '../components/StatCard';
import StatusTag from '../components/StatusTag';
import LeadForm from '../components/LeadForm';
import { dateRangeFilter, inRange, matchText, selectFilter, textFilter, useFilters } from '../components/TableFilters';
import { useStore } from '../store/useStore';

const SOURCES = ['网络推广', '电话咨询', '客户转介绍', '线下活动', '其他'];
const STATUSES: LeadStatus[] = ['待分配', '跟进中', '已转化', '已流失'];

function AssignModal({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  const [managerId, setManagerId] = useState<string | undefined>();
  const { message } = AntdApp.useApp();
  const assignLeads = useStore((s) => s.assignLeads);
  const users = useStore((s) => s.users);
  const managers = users.filter((u) => u.role === 'manager');

  const onOk = () => {
    if (!lead || !managerId) {
      message.warning('请选择目标客户经理');
      return;
    }
    const name = managers.find((m) => m.id === managerId)?.name;
    assignLeads([lead.id], managerId);
    message.success(`已将「${lead.name}」分配给客户经理「${name}」`);
    onClose();
  };

  return (
    <Modal
      title={lead ? `分配线索 · ${lead.id}` : '分配线索'}
      open={!!lead}
      onCancel={onClose}
      onOk={onOk}
      okText="确认分配"
      destroyOnClose
      width={480}
    >
      {lead ? (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <div className="section-title" style={{ marginBottom: 4 }}>线索信息</div>
            <div>{lead.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              联系人 {lead.contactName} · {lead.contactPhone} · 来源 {lead.source}
            </div>
          </div>
          <Form layout="vertical">
            <Form.Item label="目标客户经理" required>
              <Select
                placeholder="请选择客户经理"
                value={managerId}
                onChange={setManagerId}
                options={managers.map((u) => ({ value: u.id, label: `${u.name}（客户经理）` }))}
              />
            </Form.Item>
          </Form>
        </Space>
      ) : null}
    </Modal>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const leads = useStore((s) => s.leads);
  const users = useStore((s) => s.users);
  const managers = users.filter((u) => u.role === 'manager');

  const { filters, set } = useFilters();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [assignLead, setAssignLead] = useState<Lead | null>(null);

  const ownerName = (id: string | null) =>
    id ? users.find((u) => u.id === id)?.name ?? '-' : <span className="muted">未分配</span>;

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (!matchText(l.id, filters.id)) return false;
      if (!matchText(l.name, filters.name)) return false;
      if (!matchText(l.contactName, filters.contactName)) return false;
      if (!matchText(l.contactPhone, filters.contactPhone)) return false;
      if (filters.source && l.source !== filters.source) return false;
      if (filters.status && l.status !== filters.status) return false;
      if (filters.ownerId) {
        const unassigned = filters.ownerId === '__unassigned__';
        if (unassigned ? l.ownerId != null : l.ownerId !== filters.ownerId) return false;
      }
      if (!inRange(l.createdAt, filters.createdAt)) return false;
      return true;
    });
  }, [leads, filters]);

  const hasFilter = Object.values(filters).some((v) => !!v);

  const stats = useMemo(() => {
    const total = leads.length;
    const pendingAssign = leads.filter((l) => l.status === '待分配').length;
    const following = leads.filter((l) => l.status === '跟进中').length;
    const recent = leads.filter((l) => dayjs(l.createdAt).isAfter(dayjs().subtract(30, 'day'))).length;
    return { total, pendingAssign, following, recent };
  }, [leads]);

  const columns: ColumnsType<Lead> = [
    { title: '线索编号', dataIndex: 'id', width: 130, ...textFilter(filters.id, set('id'), '搜索编号') },
    {
      title: '线索名称',
      dataIndex: 'name',
      ...textFilter(filters.name, set('name'), '搜索名称'),
      render: (v: string, r) => (
        <Typography.Link onClick={() => navigate(`/leads/${r.id}`)}>{v}</Typography.Link>
      ),
    },
    { title: '联系人', dataIndex: 'contactName', width: 110, ...textFilter(filters.contactName, set('contactName'), '搜索联系人') },
    { title: '联系电话', dataIndex: 'contactPhone', width: 140, ...textFilter(filters.contactPhone, set('contactPhone'), '搜索电话') },
    {
      title: '来源',
      dataIndex: 'source',
      width: 120,
      ...selectFilter(filters.source, set('source'), SOURCES.map((v) => ({ value: v, label: v })), '筛选来源'),
    },
    {
      title: '线索状态',
      dataIndex: 'status',
      width: 120,
      ...selectFilter(filters.status, set('status'), STATUSES.map((v) => ({ value: v, label: v })), '筛选状态'),
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: '负责人',
      dataIndex: 'ownerId',
      width: 130,
      ...selectFilter(
        filters.ownerId,
        set('ownerId'),
        [{ value: '__unassigned__', label: '未分配' }, ...managers.map((u) => ({ value: u.id, label: u.name }))],
        '筛选负责人'
      ),
      render: (v: string | null) => ownerName(v),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      ...dateRangeFilter(filters.createdAt, set('createdAt')),
      render: (v: string) => fmt(v),
    },
    {
      title: '操作',
      key: 'actions',
      width: 190,
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => navigate(`/leads/${r.id}`)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditing(r);
              setFormOpen(true);
            }}
          >
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => setAssignLead(r)}>
            分配
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      <Row gutter={16}>
        <Col span={6}>
          <StatCard title="线索总数" value={stats.total} />
        </Col>
        <Col span={6}>
          <StatCard title="近 30 天新增" value={stats.recent} />
        </Col>
        <Col span={6}>
          <StatCard title="待分配线索" value={stats.pendingAssign} valueStyle={{ color: '#fa8c16' }} />
        </Col>
        <Col span={6}>
          <StatCard title="跟进中线索" value={stats.following} valueStyle={{ color: '#1668dc' }} />
        </Col>
      </Row>

      <div className="toolbar">
        <span className="muted">点击各列表头筛选图标进行单列筛选</span>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>
          新增线索
        </Button>
      </div>

      <div className="table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: hasFilter ? '无符合筛选条件的结果' : '暂无线索数据' }}
        />
      </div>

      <LeadForm
        open={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <AssignModal lead={assignLead} onClose={() => setAssignLead(null)} />
    </div>
  );
}
