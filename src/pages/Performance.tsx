import { useMemo, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import type { CommissionRule, PerformanceTarget, TargetPeriod } from '../types';
import { TARGET_APPROVAL_STEPS } from '../types';
import { fmt } from '../utils/format';
import StatCard from '../components/StatCard';
import { useStore, useCurrentUser } from '../store/useStore';
import { actualAmountOf, commissionOf, completionRateOf } from '../utils/perf';
import { matchText, selectFilter, textFilter, useFilters } from '../components/TableFilters';

const PERIOD_LABEL: Record<TargetPeriod, string> = { month: '月', quarter: '季', year: '年' };

const STATUS_TAG: Record<PerformanceTarget['status'], { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pending: { color: 'processing', text: '待审批' },
  approved: { color: 'success', text: '已通过' },
  rejected: { color: 'error', text: '已驳回' },
};

function periodOptions(period: TargetPeriod): string[] {
  if (period === 'year') return ['2025', '2026', '2027'];
  const opts: string[] = [];
  if (period === 'month') {
    for (const y of [2026, 2027]) for (let m = 1; m <= 12; m++) opts.push(`${y}-${String(m).padStart(2, '0')}`);
    return opts;
  }
  for (const y of [2025, 2026, 2027]) for (const q of [1, 2, 3, 4]) opts.push(`${y}-Q${q}`);
  return opts;
}

function TargetForm({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial: PerformanceTarget | null;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const users = useStore((s) => s.users);
  const addTarget = useStore((s) => s.addTarget);
  const updateTarget = useStore((s) => s.updateTarget);
  const managers = users.filter((u) => u.role === 'manager');
  const [period, setPeriod] = useState<TargetPeriod>(initial?.period ?? 'month');

  const onOk = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        memberIds: v.memberIds,
        period: period,
        periodLabel: v.periodLabel,
        targetAmount: v.targetAmount,
        kpi: v.kpi ?? '',
      };
      if (initial) {
        updateTarget(initial.id, payload);
        message.success('目标已更新');
      } else {
        addTarget(payload);
        message.success('目标已创建（草稿）');
      }
      onClose();
    } catch {
      // 校验失败
    }
  };

  return (
    <Modal
      title={initial ? `编辑目标 · ${initial.id}` : '新增业绩目标'}
      open={open}
      onCancel={onClose}
      onOk={onOk}
      okText="保存"
      destroyOnClose
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          initial ?? {
            memberIds: [],
            period: 'month',
            periodLabel: periodOptions('month')[0],
            targetAmount: undefined,
            kpi: '',
          }
        }
      >
        <Form.Item
          name="memberIds"
          label="团队成员（可多选）"
          rules={[{ required: true, message: '请选择至少一名成员' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择客户经理"
            options={managers.map((u) => ({ value: u.id, label: `${u.name}（客户经理）` }))}
          />
        </Form.Item>
        <Form.Item label="目标周期">
          <Space size={12} style={{ width: '100%' }}>
            <Segmented
              value={period}
              onChange={(v) => {
                setPeriod(v as TargetPeriod);
                form.setFieldsValue({ periodLabel: periodOptions(v as TargetPeriod)[0] });
              }}
              options={[
                { value: 'month', label: '按月' },
                { value: 'quarter', label: '按季' },
                { value: 'year', label: '按年' },
              ]}
            />
            <Form.Item name="periodLabel" noStyle rules={[{ required: true, message: '请选择周期' }]}>
              <Select
                style={{ width: 180 }}
                placeholder="选择周期"
                options={periodOptions(period).map((v) => ({ value: v, label: v }))}
              />
            </Form.Item>
          </Space>
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="targetAmount"
              label="目标金额（万元）"
              rules={[{ required: true, message: '请填写目标金额' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} addonAfter="万元" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="kpi" label="业绩指标（选填）">
          <Input.TextArea rows={2} placeholder="例如：完成开户 4 户、回款 200 万元" />
        </Form.Item>
        <div className="muted" style={{ fontSize: 12 }}>
          填报时间由系统自动生成；保存后进入草稿，需提交审批流（销售确认 → 部门主管 → 财务）。
        </div>
      </Form>
    </Modal>
  );
}

export default function Performance() {
  const { message, modal } = AntdApp.useApp();
  const currentUser = useCurrentUser();
  const targets = useStore((s) => s.targets);
  const applications = useStore((s) => s.applications);
  const users = useStore((s) => s.users);
  const commission = useStore((s) => s.commission);
  const submitTarget = useStore((s) => s.submitTarget);
  const approveTarget = useStore((s) => s.approveTarget);
  const rejectTarget = useStore((s) => s.rejectTarget);
  const deleteTarget = useStore((s) => s.deleteTarget);
  const setCommission = useStore((s) => s.setCommission);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PerformanceTarget | null>(null);
  const [rule, setRule] = useState<CommissionRule>(commission);
  const [preview, setPreview] = useState<PerformanceTarget | null>(null);

  const { filters, set } = useFilters();

  const memberNames = (ids: string[]) => ids.map((id) => users.find((u) => u.id === id)?.name ?? id).join('、');

  const stats = useMemo(() => {
    const approved = targets.filter((t) => t.status === 'approved');
    return {
      total: targets.length,
      approved: approved.length,
      targetSum: targets.reduce((s, t) => s + t.targetAmount, 0),
      actualSum: targets.reduce((s, t) => s + actualAmountOf(applications, t.memberIds), 0),
    };
  }, [targets, applications]);

  const rows = useMemo(
    () =>
      targets
        .filter((t) => {
          if (!matchText(t.id, filters.id)) return false;
          if (!matchText(memberNames(t.memberIds), filters.members)) return false;
          if (filters.period && t.period !== filters.period) return false;
          if (filters.status && t.status !== filters.status) return false;
          return true;
        })
        .map((t) => {
          const actual = actualAmountOf(applications, t.memberIds);
          return {
            target: t,
            actual,
            rate: completionRateOf(t.targetAmount, actual),
            commissionAmount: commissionOf(actual, commission),
          };
        }),
    [targets, applications, commission, filters]
  );

  const hasFilter = Object.values(filters).some((v) => !!v);

  const doApprove = (t: PerformanceTarget) => {
    const step = TARGET_APPROVAL_STEPS[Math.min(t.approvals.length, TARGET_APPROVAL_STEPS.length - 1)];
    modal.confirm({
      title: `审批通过 · ${step}`,
      content: `以「${currentUser.name}」身份通过「${step}」环节，目标金额 ${t.targetAmount} 万元。`,
      okText: '通过',
      cancelText: '取消',
      onOk: () => {
        approveTarget(t.id, '同意');
        message.success(t.approvals.length + 1 >= TARGET_APPROVAL_STEPS.length ? '已通过全部审批，目标生效' : `已通过「${step}」，进入下一环节`);
      },
    });
  };

  const doReject = (t: PerformanceTarget) => {
    const step = TARGET_APPROVAL_STEPS[Math.min(t.approvals.length, TARGET_APPROVAL_STEPS.length - 1)];
    modal.confirm({
      title: `驳回目标 · ${step}`,
      content: '驳回后该目标将标记为「已驳回」。',
      okText: '驳回',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        rejectTarget(t.id, '目标不符合要求，予以驳回');
        message.success('已驳回');
      },
    });
  };

  const columns: ColumnsType<{
    target: PerformanceTarget;
    actual: number;
    rate: number;
    commissionAmount: number;
  }> = [
    { title: '编号', dataIndex: ['target', 'id'], width: 100, ...textFilter(filters.id, set('id'), '搜索编号') },
    {
      title: '团队成员',
      key: 'members',
      width: 150,
      ...textFilter(filters.members, set('members'), '搜索成员'),
      render: (_, r) => memberNames(r.target.memberIds),
    },
    {
      title: '周期',
      dataIndex: ['target', 'periodLabel'],
      width: 100,
      ...selectFilter(
        filters.period,
        set('period'),
        [
          { value: 'month', label: '月' },
          { value: 'quarter', label: '季' },
          { value: 'year', label: '年' },
        ],
        '筛选周期'
      ),
    },
    {
      title: '目标金额',
      dataIndex: ['target', 'targetAmount'],
      width: 100,
      align: 'right',
      render: (v: number) => `${v} 万`,
    },
    { title: '实际完成', dataIndex: 'actual', width: 100, align: 'right', render: (v: number) => `${v} 万` },
    {
      title: '完成率',
      dataIndex: 'rate',
      width: 150,
      render: (v: number) => <Progress percent={Math.min(v, 100)} size="small" />,
    },
    { title: '提成金额', dataIndex: 'commissionAmount', width: 100, align: 'right', render: (v: number) => `${v} 万` },
    {
      title: '状态',
      dataIndex: ['target', 'status'],
      width: 100,
      ...selectFilter(
        filters.status,
        set('status'),
        (Object.keys(STATUS_TAG) as PerformanceTarget['status'][]).map((v) => ({ value: v, label: STATUS_TAG[v].text })),
        '筛选状态'
      ),
      render: (v: PerformanceTarget['status']) => <Tag color={STATUS_TAG[v].color}>{STATUS_TAG[v].text}</Tag>,
    },
    {
      title: '审批进度',
      key: 'flow',
      width: 210,
      render: (_, r) => {
        const passed = r.target.approvals.filter((a) => a.result === 'passed').length;
        return (
          <Steps
            size="small"
            current={passed}
            status={r.target.status === 'rejected' ? 'error' : r.target.status === 'approved' ? 'finish' : 'process'}
            items={TARGET_APPROVAL_STEPS.map((s) => ({ title: s.replace('审批', '').replace('确认', '') }))}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      render: (_, r) => {
        const t = r.target;
        return (
          <Space size={0}>
            {t.status === 'draft' ? (
              <>
                <Button type="link" size="small" icon={<SendOutlined />} onClick={() => { submitTarget(t.id); message.success('已提交审批流'); }}>
                  提交审批
                </Button>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditing(t); setFormOpen(true); }}>
                  编辑
                </Button>
              </>
            ) : null}
            {t.status === 'pending' ? (
              <>
                <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => doApprove(t)}>
                  审批通过
                </Button>
                <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => doReject(t)}>
                  驳回
                </Button>
              </>
            ) : null}
            <Button type="link" size="small" onClick={() => setPreview(t)}>
              预览
            </Button>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => { deleteTarget(t.id); message.success('已删除'); }}>
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page">
      <Row gutter={16}>
        <Col span={5}>
          <StatCard title="目标总数" value={stats.total} />
        </Col>
        <Col span={5}>
          <StatCard title="已通过目标" value={stats.approved} valueStyle={{ color: '#52c41a' }} />
        </Col>
        <Col span={5}>
          <StatCard title="累计目标金额" value={`${stats.targetSum} 万`} valueStyle={{ color: '#1668dc' }} />
        </Col>
        <Col span={5}>
          <StatCard title="累计实际回款" value={`${stats.actualSum} 万`} valueStyle={{ color: '#52c41a' }} />
        </Col>
        <Col span={4}>
          <StatCard title="提成比例" value={`${commission.rate}%`} valueStyle={{ color: '#fa8c16' }} />
        </Col>
      </Row>

      <Card
        size="small"
        title="提成规则与系数配置"
        extra={<span className="muted" style={{ fontWeight: 400 }}>结合 CRM 实际回款（已开户申请业绩额）自动计算</span>}
      >
        <Space size={24} wrap>
          <Form.Item label="提成比例（%）" style={{ marginBottom: 0 }}>
            <InputNumber
              min={0}
              max={100}
              value={rule.rate}
              onChange={(v) => setRule((r) => ({ ...r, rate: v ?? 0 }))}
              addonAfter="%"
            />
          </Form.Item>
          <Form.Item label="提成系数" style={{ marginBottom: 0 }}>
            <InputNumber
              min={0}
              step={0.1}
              value={rule.coefficient}
              onChange={(v) => setRule((r) => ({ ...r, coefficient: v ?? 1 }))}
            />
          </Form.Item>
          <Form.Item label="起提线（万元）" style={{ marginBottom: 0 }}>
            <InputNumber
              min={0}
              value={rule.baseLine}
              onChange={(v) => setRule((r) => ({ ...r, baseLine: v ?? 0 }))}
              addonAfter="万元"
            />
          </Form.Item>
          <Button type="primary" onClick={() => { setCommission(rule); message.success('提成规则已保存'); }}>
            保存规则
          </Button>
        </Space>
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          提成金额 = 实际完成 × 提成比例 × 系数（实际完成低于起提线时不计提成）。
        </div>
      </Card>

      <div className="toolbar">
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>
          新增目标
        </Button>
      </div>

      <div className="table-card">
        <Table
          rowKey={(r) => r.target.id}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: hasFilter ? '无符合筛选条件的结果' : '暂无业绩目标' }}
        />
      </div>

      <TargetForm open={formOpen} initial={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />

      <Modal
        title={preview ? `审批流预览 · ${preview.id}` : '审批流预览'}
        open={!!preview}
        onCancel={() => setPreview(null)}
        footer={<Button onClick={() => setPreview(null)}>关闭</Button>}
        width={520}
      >
        {preview ? (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Typography.Text>
              {memberNames(preview.memberIds)} · {preview.periodLabel}（{PERIOD_LABEL[preview.period]}度） · 目标 {preview.targetAmount} 万元
            </Typography.Text>
            {preview.kpi ? <div className="muted">指标：{preview.kpi}</div> : null}
            <Steps
              size="small"
              current={preview.approvals.filter((a) => a.result === 'passed').length}
              status={preview.status === 'rejected' ? 'error' : preview.status === 'approved' ? 'finish' : 'process'}
              items={TARGET_APPROVAL_STEPS.map((s) => ({ title: s }))}
            />
            {preview.approvals.length ? (
              <Timeline
                items={preview.approvals.map((a) => ({
                  color: a.result === 'passed' ? 'green' : 'red',
                  children: (
                    <div>
                      <Space>
                        <Typography.Text strong>{a.step}</Typography.Text>
                        <Tag color={a.result === 'passed' ? 'success' : 'error'}>{a.result === 'passed' ? '通过' : '驳回'}</Tag>
                      </Space>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {a.actor} · {fmt(a.time)} · {a.opinion}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <span className="muted">尚未进入审批流</span>
            )}
          </Space>
        ) : null}
      </Modal>
    </div>
  );
}
