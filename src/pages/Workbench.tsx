import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  App as AntdApp,
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { ACCOUNT_TYPES } from '../types';
import type { Application, AppStatus } from '../types';
import { fmt } from '../utils/format';
import { APP_STATUS_META, APP_STATUS_ORDER } from '../utils/status';
import { dateRangeFilter, inRange, matchText, selectFilter, textFilter, useFilters } from '../components/TableFilters';
import StatusTag from '../components/StatusTag';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationDetail from '../components/ApplicationDetail';
import TasksPanel from './Tasks';
import { useStore, useCurrentUser } from '../store/useStore';
import { ROLE_LABEL } from '../utils/role';

type ReviewMode = 'review_pass' | 'review_reject' | 'approve_pass' | 'approve_reject';

interface OpinionState {
  open: boolean;
  mode: ReviewMode;
  app: Application | null;
}

const MODE_META: Record<ReviewMode, { title: string; label: string; required: boolean; okText: string }> = {
  review_pass: { title: '合规审核通过', label: '审核意见（选填）', required: false, okText: '确认通过' },
  review_reject: { title: '驳回补充资料', label: '驳回原因', required: true, okText: '确认驳回' },
  approve_pass: { title: '审批通过', label: '审批意见（选填）', required: false, okText: '确认通过' },
  approve_reject: { title: '审批驳回', label: '审批意见', required: true, okText: '确认驳回' },
};

function materialsSummary(app: Application) {
  const required = app.materials.filter((m) => m.required);
  const uploaded = required.filter((m) => m.uploaded).length;
  const missing = required.filter((m) => !m.uploaded).map((m) => m.name);
  return { total: required.length, uploaded, missing };
}

export default function Workbench() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { message } = AntdApp.useApp();
  const currentUser = useCurrentUser();
  const applications = useStore((s) => s.applications);
  const customers = useStore((s) => s.customers);
  const users = useStore((s) => s.users);
  const complianceReview = useStore((s) => s.complianceReview);
  const approvalReview = useStore((s) => s.approvalReview);

  const [activeTab, setActiveTab] = useState('apply');

  const applyFilters = useFilters();
  const reviewFilters = useFilters();
  const approveFilters = useFilters();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [prefill, setPrefill] = useState<
    Partial<{ customerId: string; customerName: string; contactName: string; contactPhone: string }> | undefined
  >();

  const [detail, setDetail] = useState<Application | null>(null);
  const [opinion, setOpinion] = useState<OpinionState>({ open: false, mode: 'review_pass', app: null });

  const creatorName = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const managers = users.filter((u) => u.role === 'manager');

  const applyF = applyFilters.filters;
  const setApply = applyFilters.set;
  const reviewF = reviewFilters.filters;
  const setReview = reviewFilters.set;
  const approveF = approveFilters.filters;
  const setApprove = approveFilters.set;

  useEffect(() => {
    const isNew = searchParams.get('new');
    const customerId = searchParams.get('customerId');
    const appId = searchParams.get('app');
    const editId = searchParams.get('edit');

    if (isNew && customerId) {
      const c = customers.find((x) => x.id === customerId);
      if (c) {
        setEditing(null);
        setPrefill({ customerId: c.id, customerName: c.name, contactName: c.contactName, contactPhone: c.contactPhone });
        setFormOpen(true);
      }
      setSearchParams({}, { replace: true });
    } else if (editId) {
      const app = applications.find((a) => a.id === editId);
      if (app && (app.status === 'draft' || app.status === 'need_supplement')) {
        setEditing(app);
        setPrefill(undefined);
        setFormOpen(true);
      } else if (app) {
        setDetail(app);
      }
      setSearchParams({}, { replace: true });
    } else if (appId) {
      const app = applications.find((a) => a.id === appId);
      if (app) setDetail(app);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, customers, applications]);

  const canEdit = (a: Application) =>
    currentUser.role === 'manager' && a.createdBy === currentUser.id && (a.status === 'draft' || a.status === 'need_supplement');

  const doReview = (mode: ReviewMode, app: Application, opinionText: string) => {
    if (mode === 'review_pass' || mode === 'review_reject') {
      const result = mode === 'review_pass' ? 'passed' : 'rejected';
      complianceReview(app.id, result, opinionText);
      message.success(mode === 'review_pass' ? '已通过合规审核，进入开户审批' : '已驳回，申请人需补充资料');
    } else {
      const result = mode === 'approve_pass' ? 'passed' : 'rejected';
      approvalReview(app.id, result, opinionText);
      message.success(mode === 'approve_pass' ? '审批通过，开户任务进入办理' : '审批驳回');
    }
    setDetail(null);
  };

  const openOpinion = (mode: ReviewMode, app: Application) => setOpinion({ open: true, mode, app });

  const footerFor = (app: Application | null) => {
    if (!app) return undefined;
    const buttons: ReactNode[] = [];
    if (app.status === 'pending_review' && currentUser.role === 'reviewer') {
      buttons.push(
        <Button key="pass" type="primary" icon={<CheckCircleOutlined />} onClick={() => openOpinion('review_pass', app)}>
          审核通过
        </Button>,
        <Button key="reject" danger icon={<CloseCircleOutlined />} onClick={() => openOpinion('review_reject', app)}>
          驳回补充资料
        </Button>
      );
    }
    if (app.status === 'pending_approval' && currentUser.role === 'supervisor') {
      buttons.push(
        <Button key="pass" type="primary" icon={<CheckCircleOutlined />} onClick={() => openOpinion('approve_pass', app)}>
          审批通过
        </Button>,
        <Button key="reject" danger icon={<CloseCircleOutlined />} onClick={() => openOpinion('approve_reject', app)}>
          审批驳回
        </Button>
      );
    }
    buttons.push(
      <Button key="close" onClick={() => setDetail(null)}>
        关闭
      </Button>
    );
    return <Space>{buttons}</Space>;
  };

  const applyColumns: ColumnsType<Application> = [
    { title: '申请编号', dataIndex: 'id', width: 120, ...textFilter(applyF.id, setApply('id'), '搜索编号') },
    { title: '客户名称', dataIndex: 'customerName', ...textFilter(applyF.customerName, setApply('customerName'), '搜索客户') },
    {
      title: '开户类型',
      dataIndex: 'accountType',
      width: 160,
      ...selectFilter(applyF.accountType, setApply('accountType'), ACCOUNT_TYPES.map((v) => ({ value: v, label: v })), '筛选类型'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      ...selectFilter(
        applyF.status,
        setApply('status'),
        APP_STATUS_ORDER.map((s) => ({ value: s, label: APP_STATUS_META[s].label })),
        '筛选状态'
      ),
      render: (v: AppStatus) => <StatusTag status={APP_STATUS_META[v].label} />,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      width: 100,
      ...selectFilter(applyF.createdBy, setApply('createdBy'), managers.map((u) => ({ value: u.id, label: u.name })), '筛选创建人'),
      render: (v: string) => creatorName(v),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 170,
      ...dateRangeFilter(applyF.submittedAt, setApply('submittedAt')),
      render: (v?: string) => fmt(v),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      ...dateRangeFilter(applyF.updatedAt, setApply('updatedAt')),
      render: (v: string) => fmt(v),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)}>
            查看
          </Button>
          {canEdit(r) ? (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setEditing(r);
                setPrefill(undefined);
                setFormOpen(true);
              }}
            >
              编辑
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const reviewColumns: ColumnsType<Application> = [
    { title: '申请编号', dataIndex: 'id', width: 120, ...textFilter(reviewF.id, setReview('id'), '搜索编号') },
    { title: '客户名称', dataIndex: 'customerName', ...textFilter(reviewF.customerName, setReview('customerName'), '搜索客户') },
    {
      title: '资料完整性',
      key: 'materials',
      width: 220,
      ...selectFilter(
        reviewF.materials,
        setReview('materials'),
        [
          { value: 'complete', label: '资料齐全' },
          { value: 'incomplete', label: '缺资料' },
        ],
        '筛选完整性'
      ),
      render: (_, r) => {
        const s = materialsSummary(r);
        const ok = s.missing.length === 0;
        return (
          <Space>
            <Tag color={ok ? 'success' : 'error'}>
              必填 {s.uploaded}/{s.total} 已上传
            </Tag>
            {!ok ? <span className="muted">缺 {s.missing.length} 项</span> : null}
          </Space>
        );
      },
    },
    {
      title: '开户类型',
      dataIndex: 'accountType',
      width: 160,
      ...selectFilter(reviewF.accountType, setReview('accountType'), ACCOUNT_TYPES.map((v) => ({ value: v, label: v })), '筛选类型'),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 170,
      ...dateRangeFilter(reviewF.submittedAt, setReview('submittedAt')),
      render: (v?: string) => fmt(v),
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)}>
            查看详情
          </Button>
          {currentUser.role === 'reviewer' ? (
            <>
              <Button type="link" size="small" onClick={() => openOpinion('review_pass', r)}>
                审核通过
              </Button>
              <Button type="link" size="small" danger onClick={() => openOpinion('review_reject', r)}>
                驳回补充资料
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  const approveColumns: ColumnsType<Application> = [
    { title: '申请编号', dataIndex: 'id', width: 120, ...textFilter(approveF.id, setApprove('id'), '搜索编号') },
    { title: '客户名称', dataIndex: 'customerName', ...textFilter(approveF.customerName, setApprove('customerName'), '搜索客户') },
    {
      title: '合规审核结论',
      key: 'compliance',
      width: 220,
      ...selectFilter(
        approveF.compliance,
        setApprove('compliance'),
        [
          { value: 'passed', label: '已通过' },
          { value: 'not_passed', label: '未通过' },
        ],
        '筛选结论'
      ),
      render: (_, r) =>
        r.compliance?.result === 'passed' ? (
          <Space direction="vertical" size={0}>
            <Tag color="success">已通过</Tag>
            <span className="muted" style={{ fontSize: 12 }}>
              {r.compliance.reviewer} · {fmt(r.compliance.time)}
            </span>
          </Space>
        ) : (
          <Tag color="error">未通过合规审核</Tag>
        ),
    },
    {
      title: '开户类型',
      dataIndex: 'accountType',
      width: 160,
      ...selectFilter(approveF.accountType, setApprove('accountType'), ACCOUNT_TYPES.map((v) => ({ value: v, label: v })), '筛选类型'),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      width: 170,
      ...dateRangeFilter(approveF.submittedAt, setApprove('submittedAt')),
      render: (v?: string) => fmt(v),
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)}>
            查看详情
          </Button>
          {currentUser.role === 'supervisor' ? (
            <>
              <Button type="link" size="small" onClick={() => openOpinion('approve_pass', r)}>
                审批通过
              </Button>
              <Button type="link" size="small" danger onClick={() => openOpinion('approve_reject', r)}>
                审批驳回
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  const applyList = useMemo(() => {
    return applications.filter((a) => {
      if (!matchText(a.id, applyF.id)) return false;
      if (!matchText(a.customerName, applyF.customerName)) return false;
      if (applyF.accountType && a.accountType !== applyF.accountType) return false;
      if (applyF.status && a.status !== applyF.status) return false;
      if (applyF.createdBy && a.createdBy !== applyF.createdBy) return false;
      if (!inRange(a.submittedAt, applyF.submittedAt)) return false;
      if (!inRange(a.updatedAt, applyF.updatedAt)) return false;
      return true;
    });
  }, [applications, applyF]);

  const reviewList = useMemo(
    () =>
      applications.filter((a) => {
        if (a.status !== 'pending_review') return false;
        if (!matchText(a.id, reviewF.id)) return false;
        if (!matchText(a.customerName, reviewF.customerName)) return false;
        if (reviewF.materials) {
          const s = materialsSummary(a);
          const ok = s.missing.length === 0;
          if (reviewF.materials === 'complete' && !ok) return false;
          if (reviewF.materials === 'incomplete' && ok) return false;
        }
        if (reviewF.accountType && a.accountType !== reviewF.accountType) return false;
        if (!inRange(a.submittedAt, reviewF.submittedAt)) return false;
        return true;
      }),
    [applications, reviewF]
  );

  const approveList = useMemo(
    () =>
      applications.filter((a) => {
        if (a.status !== 'pending_approval') return false;
        if (!matchText(a.id, approveF.id)) return false;
        if (!matchText(a.customerName, approveF.customerName)) return false;
        if (approveF.compliance) {
          const passed = a.compliance?.result === 'passed';
          if (approveF.compliance === 'passed' && !passed) return false;
          if (approveF.compliance === 'not_passed' && passed) return false;
        }
        if (approveF.accountType && a.accountType !== approveF.accountType) return false;
        if (!inRange(a.submittedAt, approveF.submittedAt)) return false;
        return true;
      }),
    [applications, approveF]
  );

  const applyHasFilter = Object.values(applyF).some((v) => !!v);
  const reviewHasFilter = Object.values(reviewF).some((v) => !!v);
  const approveHasFilter = Object.values(approveF).some((v) => !!v);

  return (
    <div className="page">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'apply',
            label: `开户申请（${applications.length}）`,
            children: (
              <div className="page">
                <div className="toolbar">
                  <span className="muted">点击各列表头筛选图标进行单列筛选</span>
                  <div style={{ flex: 1 }} />
                  {currentUser.role === 'manager' ? (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditing(null);
                        setPrefill(undefined);
                        setFormOpen(true);
                      }}
                    >
                      新建申请
                    </Button>
                  ) : (
                    <Typography.Text type="secondary">客户经理可新建、编辑和提交本人申请</Typography.Text>
                  )}
                </div>
                <div className="table-card">
                  <Table
                    rowKey="id"
                    columns={applyColumns}
                    dataSource={applyList}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    locale={{ emptyText: applyHasFilter ? '无符合筛选条件的结果' : '暂无申请' }}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'review',
            label: `客户资料合规审核（${reviewList.length}）`,
            children: (
              <div className="page">
                {currentUser.role !== 'reviewer' ? (
                  <Alert
                    type="info"
                    showIcon
                    message={`当前角色为「${ROLE_LABEL[currentUser.role]}」，无合规审核操作权限。请切换到「合规审核人员 · 陈静」进行审核。`}
                  />
                ) : null}
                <div className="table-card">
                  <Table
                    rowKey="id"
                    columns={reviewColumns}
                    dataSource={reviewList}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    locale={{ emptyText: reviewHasFilter ? '无符合筛选条件的结果' : '暂无待审核申请' }}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'approve',
            label: `开户审批（${approveList.length}）`,
            children: (
              <div className="page">
                {currentUser.role !== 'supervisor' ? (
                  <Alert
                    type="info"
                    showIcon
                    message={`当前角色为「${ROLE_LABEL[currentUser.role]}」，无审批操作权限。请切换到「客户主管 · 赵磊」进行审批。`}
                  />
                ) : null}
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 0 }}
                  message="仅「合规审核已通过」的申请会进入本环节，未通过合规审核的申请无法直接审批通过。"
                />
                <div className="table-card">
                  <Table
                    rowKey="id"
                    columns={approveColumns}
                    dataSource={approveList}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    locale={{ emptyText: approveHasFilter ? '无符合筛选条件的结果' : '暂无待审批申请' }}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'tasks',
            label: `开户任务与结果（${applications.length}）`,
            children: <TasksPanel />,
          },
        ]}
      />

      <ApplicationForm open={formOpen} initial={editing} prefill={prefill} onClose={() => { setFormOpen(false); setEditing(null); setPrefill(undefined); }} />

      <ApplicationDetail open={!!detail} application={detail} onClose={() => setDetail(null)} footer={footerFor(detail)} />

      <OpinionModal
        state={opinion}
        onClose={() => setOpinion((s) => ({ ...s, open: false }))}
        onSubmit={(text) => {
          if (opinion.app) doReview(opinion.mode, opinion.app, text);
          setOpinion((s) => ({ ...s, open: false }));
        }}
      />
    </div>
  );
}

function OpinionModal({
  state,
  onClose,
  onSubmit,
}: {
  state: OpinionState;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [form] = Form.useForm();
  const meta = MODE_META[state.mode];

  const handleOk = async () => {
    if (meta.required) {
      const v = await form.validateFields();
      onSubmit(v.opinion);
    } else {
      const v = form.getFieldValue('opinion');
      onSubmit(v ?? '同意');
    }
  };

  return (
    <Modal
      title={meta.title}
      open={state.open}
      onCancel={onClose}
      onOk={handleOk}
      okText={meta.okText}
      cancelText="取消"
      okButtonProps={{ danger: state.mode === 'review_reject' || state.mode === 'approve_reject' }}
      destroyOnClose
      width={480}
    >
      <div style={{ marginBottom: 8 }}>
        {state.app ? (
          <Space>
            <Typography.Text strong>{state.app.customerName}</Typography.Text>
            <Typography.Text type="secondary">{state.app.id}</Typography.Text>
          </Space>
        ) : null}
      </div>
      <Form form={form} layout="vertical">
        <Form.Item
          name="opinion"
          label={meta.label}
          rules={meta.required ? [{ required: true, message: '该项为必填' }] : []}
        >
          <Input.TextArea rows={3} placeholder={meta.required ? '请填写原因（必填）' : '可填写意见'} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
