import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Col, Row, Space, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AuditOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { Application } from '../types';
import { ACCOUNT_TYPES } from '../types';
import { fmt } from '../utils/format';
import { taskOf } from '../utils/status';
import StatCard from '../components/StatCard';
import StatusTag from '../components/StatusTag';
import ApplicationDetail from '../components/ApplicationDetail';
import { dateRangeFilter, inRange, matchText, selectFilter, textFilter, useFilters } from '../components/TableFilters';
import { useStore, useCurrentUser } from '../store/useStore';

const TASK_STATUS = ['待提交', '处理中', '需补充资料', '已完成', '已驳回'];
const STAGES = ['待提交', '资料审核', '开户审批', '开户办理', '资料补充', '已驳回'];
const RESULTS = ['合规审核中', '审批中', '开户成功', '待补充资料', '审批驳回'];

export default function TasksPanel() {
  const navigate = useNavigate();
  const applications = useStore((s) => s.applications);
  const currentUser = useCurrentUser();

  const { filters, set } = useFilters();
  const [detail, setDetail] = useState<Application | null>(null);

  const rows = useMemo(() => {
    return applications
      .map((a) => ({ app: a, task: taskOf(a) }))
      .filter(({ app, task }) => {
        if (!matchText(app.id, filters.id)) return false;
        if (!matchText(app.customerName, filters.customerName)) return false;
        if (filters.accountType && app.accountType !== filters.accountType) return false;
        if (filters.stage && task.stage !== filters.stage) return false;
        if (filters.status && task.status !== filters.status) return false;
        if (filters.result && task.result !== filters.result) return false;
        if (!inRange(app.submittedAt, filters.submittedAt)) return false;
        if (!inRange(app.updatedAt, filters.updatedAt)) return false;
        return true;
      });
  }, [applications, filters]);

  const hasFilter = Object.values(filters).some((v) => !!v);

  const stats = useMemo(() => {
    const views = applications.map(taskOf);
    return {
      total: applications.length,
      processing: views.filter((v) => v.status === '处理中').length,
      done: views.filter((v) => v.status === '已完成').length,
      supplement: views.filter((v) => v.status === '需补充资料').length,
      rejected: views.filter((v) => v.status === '已驳回').length,
    };
  }, [applications]);

  const actionOf = (app: Application) => {
    const t = taskOf(app);
    if ((t.status === '待提交' || t.status === '需补充资料') && currentUser.role === 'manager') {
      return (
        <Tooltip title={t.status === '待提交' ? '继续编辑并提交' : '补充资料后重新提交'}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/workbench?edit=${app.id}`)}>
            {t.status === '待提交' ? '继续编辑' : '补充资料'}
          </Button>
        </Tooltip>
      );
    }
    return (
      <Button type="link" size="small" icon={<AuditOutlined />} onClick={() => navigate(`/workbench?app=${app.id}`)}>
        去处理
      </Button>
    );
  };

  const columns: ColumnsType<{ app: Application; task: ReturnType<typeof taskOf> }> = [
    { title: '申请编号', dataIndex: ['app', 'id'], width: 120, ...textFilter(filters.id, set('id'), '搜索编号') },
    { title: '客户名称', dataIndex: ['app', 'customerName'], ...textFilter(filters.customerName, set('customerName'), '搜索客户') },
    {
      title: '开户类型',
      dataIndex: ['app', 'accountType'],
      width: 160,
      ...selectFilter(filters.accountType, set('accountType'), ACCOUNT_TYPES.map((v) => ({ value: v, label: v })), '筛选类型'),
    },
    {
      title: '当前处理阶段',
      dataIndex: ['task', 'stage'],
      width: 130,
      ...selectFilter(filters.stage, set('stage'), STAGES.map((v) => ({ value: v, label: v })), '筛选阶段'),
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: '任务状态',
      dataIndex: ['task', 'status'],
      width: 120,
      ...selectFilter(filters.status, set('status'), TASK_STATUS.map((v) => ({ value: v, label: v })), '筛选状态'),
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: '提交时间',
      dataIndex: ['app', 'submittedAt'],
      width: 170,
      ...dateRangeFilter(filters.submittedAt, set('submittedAt')),
      render: (v?: string) => fmt(v),
    },
    {
      title: '最近更新时间',
      dataIndex: ['app', 'updatedAt'],
      width: 170,
      ...dateRangeFilter(filters.updatedAt, set('updatedAt')),
      render: (v: string) => fmt(v),
    },
    {
      title: '最终结果',
      dataIndex: ['task', 'result'],
      width: 130,
      ...selectFilter(filters.result, set('result'), RESULTS.map((v) => ({ value: v, label: v })), '筛选结果'),
      render: (v: string) => <span className={v === '开户成功' ? '' : 'muted'}>{v}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetail(r.app)}>
            详情
          </Button>
          {actionOf(r.app)}
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      <Row gutter={16}>
        <Col span={4}>
          <StatCard title="任务总数" value={stats.total} />
        </Col>
        <Col span={5}>
          <StatCard title="处理中" value={stats.processing} valueStyle={{ color: '#1668dc' }} />
        </Col>
        <Col span={5}>
          <StatCard title="已完成" value={stats.done} valueStyle={{ color: '#52c41a' }} />
        </Col>
        <Col span={5}>
          <StatCard title="需补充资料" value={stats.supplement} valueStyle={{ color: '#fa8c16' }} />
        </Col>
        <Col span={5}>
          <StatCard title="已驳回" value={stats.rejected} valueStyle={{ color: '#ff4d4f' }} />
        </Col>
      </Row>

      <div className="toolbar">
        <span className="muted">点击各列表头筛选图标进行单列筛选</span>
      </div>

      <div className="table-card">
        <Table
          rowKey={(r) => r.app.id}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: hasFilter ? '无符合筛选条件的结果' : '暂无开户任务' }}
        />
      </div>

      <ApplicationDetail
        open={!!detail}
        application={detail}
        onClose={() => setDetail(null)}
        footer={
          detail ? (
            <Space>
              <Button type="primary" onClick={() => navigate(`/workbench?app=${detail.id}`)}>
                前往工作台处理
              </Button>
              <Button onClick={() => setDetail(null)}>关闭</Button>
            </Space>
          ) : undefined
        }
      />
    </div>
  );
}
