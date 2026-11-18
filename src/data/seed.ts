import type { Application, CommissionRule, Customer, FollowUp, Lead, Material, PerformanceTarget, User } from '../types';

export const USERS: User[] = [
  { id: 'M001', name: '张伟', role: 'manager' },
  { id: 'M002', name: '李娜', role: 'manager' },
  { id: 'M003', name: '王强', role: 'manager' },
  { id: 'R001', name: '陈静', role: 'reviewer' },
  { id: 'S001', name: '赵磊', role: 'supervisor' },
];

export function defaultMaterials(): Material[] {
  return [
    { id: 'm1', name: '营业执照 / 统一社会信用代码证', required: true, uploaded: false },
    { id: 'm2', name: '法定代表人身份证件', required: true, uploaded: false },
    { id: 'm3', name: '受益所有人信息采集表', required: true, uploaded: false },
    { id: 'm4', name: '开户许可证 / 基本存款账户信息', required: false, uploaded: false },
    { id: 'm5', name: '公司章程', required: false, uploaded: false },
    { id: 'm6', name: '经营场所证明', required: false, uploaded: false },
  ];
}

export const SEED_LEADS: Lead[] = [
  {
    id: 'LX000001', name: '杭州云图科技有限公司', contactName: '陈晨', contactPhone: '13800001111',
    source: '网络推广', status: '已转化', intention: '高', ownerId: 'M001', customerId: 'CUS000001',
    createdAt: '2026-10-06 09:30:00', updatedAt: '2026-10-12 10:00:00', assignedAt: '2026-10-08 10:00:00', assignedBy: '赵磊',
  },
  {
    id: 'LX000002', name: '苏州蓝海贸易有限公司', contactName: '王敏', contactPhone: '13900002222',
    source: '电话咨询', status: '已转化', intention: '中', ownerId: 'M001', customerId: 'CUS000005',
    createdAt: '2026-10-14 11:00:00', updatedAt: '2026-10-16 10:00:00', assignedAt: '2026-10-15 09:00:00', assignedBy: '赵磊',
  },
  {
    id: 'LX000003', name: '上海星辉文化传媒有限公司', contactName: '刘洋', contactPhone: '13700003333',
    source: '客户转介绍', status: '已转化', intention: '高', ownerId: 'M003', customerId: 'CUS000004',
    createdAt: '2026-10-17 14:40:00', updatedAt: '2026-10-18 09:20:00', assignedAt: '2026-10-18 09:00:00', assignedBy: '赵磊',
  },
  {
    id: 'LX000004', name: '广州绿洲食品有限公司', contactName: '赵晓', contactPhone: '13600004444',
    source: '线下活动', status: '已转化', intention: '高', ownerId: 'M001', customerId: 'CUS000002',
    createdAt: '2026-09-20 10:00:00', updatedAt: '2026-10-02 09:00:00', assignedAt: '2026-09-21 09:00:00', assignedBy: '赵磊',
  },
  {
    id: 'LX000005', name: '北京华信信息技术有限公司', contactName: '孙强', contactPhone: '13500005555',
    source: '网络推广', status: '已转化', intention: '中', ownerId: 'M002', customerId: 'CUS000003',
    createdAt: '2026-10-10 09:00:00', updatedAt: '2026-10-12 15:00:00', assignedAt: '2026-10-11 09:30:00', assignedBy: '赵磊',
  },
  {
    id: 'LX000006', name: '成都锦程物流有限公司', contactName: '周婷', contactPhone: '13400006666',
    source: '电话咨询', status: '已流失', intention: '低', ownerId: 'M003', createdAt: '2026-09-28 13:00:00',
    updatedAt: '2026-10-12 10:00:00', assignedAt: '2026-09-29 09:00:00', assignedBy: '赵磊',
  },
  {
    id: 'LX000007', name: '武汉金石投资有限公司', contactName: '吴磊', contactPhone: '13300007777',
    source: '网络推广', status: '待分配', intention: '高', ownerId: null, createdAt: '2026-10-20 10:30:00',
    updatedAt: '2026-10-20 10:30:00',
  },
  {
    id: 'LX000008', name: '南京新锐智能科技有限公司', contactName: '许峰', contactPhone: '13200008888',
    source: '网络推广', status: '待分配', intention: '中', ownerId: null, createdAt: '2026-10-21 09:10:00',
    updatedAt: '2026-10-21 09:10:00',
  },
  {
    id: 'LX000009', name: '重庆恒达建设集团有限公司', contactName: '冯燕', contactPhone: '13100009999',
    source: '电话咨询', status: '跟进中', intention: '中', ownerId: 'M001', createdAt: '2026-10-09 15:30:00',
    updatedAt: '2026-10-19 10:40:00', assignedAt: '2026-10-10 10:00:00', assignedBy: '赵磊',
  },
  {
    id: 'LX000010', name: '天津海纳进出口贸易有限公司', contactName: '蒋涛', contactPhone: '13000001010',
    source: '客户转介绍', status: '跟进中', intention: '高', ownerId: 'M002', createdAt: '2026-10-11 14:20:00',
    updatedAt: '2026-10-20 11:00:00', assignedAt: '2026-10-12 09:00:00', assignedBy: '赵磊',
  },
];

export const SEED_CUSTOMERS: Customer[] = [
  { id: 'CUS000001', name: '杭州云图科技有限公司', type: '企业', contactName: '陈晨', contactPhone: '13800001111', managerId: 'M001', status: '潜在', createdAt: '2026-10-12 10:00:00', updatedAt: '2026-10-20 16:00:00' },
  { id: 'CUS000002', name: '广州绿洲食品有限公司', type: '企业', contactName: '赵晓', contactPhone: '13600004444', managerId: 'M001', status: '正式', createdAt: '2026-10-02 09:00:00', updatedAt: '2026-10-10 17:30:00' },
  { id: 'CUS000003', name: '北京华信信息技术有限公司', type: '企业', contactName: '孙强', contactPhone: '13500005555', managerId: 'M002', status: '潜在', createdAt: '2026-10-12 15:00:00', updatedAt: '2026-10-21 11:20:00' },
  { id: 'CUS000004', name: '上海星辉文化传媒有限公司', type: '企业', contactName: '刘洋', contactPhone: '13700003333', managerId: 'M003', status: '潜在', createdAt: '2026-10-18 09:20:00', updatedAt: '2026-10-19 14:00:00' },
  { id: 'CUS000005', name: '苏州蓝海贸易有限公司', type: '企业', contactName: '王敏', contactPhone: '13900002222', managerId: 'M001', status: '潜在', createdAt: '2026-10-16 10:00:00', updatedAt: '2026-10-16 10:00:00' },
];

const m = defaultMaterials;

export const SEED_APPLICATIONS: Application[] = [
  {
    id: 'KH000001', customerId: 'CUS000001', customerName: '杭州云图科技有限公司', customerType: '企业',
    legalName: '杭州云图科技有限公司', creditCode: '91330100MA27XK0001', legalPerson: '陈晨',
    registerAddress: '浙江省杭州市余杭区文一西路 998 号', contactName: '陈晨', contactPhone: '13800001111',
    contactEmail: 'chenchen@yuntu.example.com', idType: '营业执照', idNumber: '91330100MA27XK0001',
    accountType: '基本存款账户', bankBranch: '杭州分行营业部', currency: '人民币', remark: '对公基本户开户', amount: 80,
    materials: m(), status: 'pending_approval', createdBy: 'M001', createdAt: '2026-10-13 09:00:00',
    updatedAt: '2026-10-20 16:00:00', submittedAt: '2026-10-14 10:00:00',
    compliance: { reviewer: '陈静', time: '2026-10-20 15:00:00', opinion: '资料齐全，主体信息与证照一致，同意提交审批。', result: 'passed' },
    approval: null,
    history: [
      { id: 'h1', time: '2026-10-13 09:00:00', actor: '张伟', action: '创建申请', detail: '创建开户申请草稿' },
      { id: 'h2', time: '2026-10-14 10:00:00', actor: '张伟', action: '提交申请', detail: '提交申请进入客户资料合规审核' },
      { id: 'h3', time: '2026-10-20 15:00:00', actor: '陈静', action: '合规审核通过', detail: '资料齐全，主体信息与证照一致，同意提交审批。' },
    ],
  },
  {
    id: 'KH000002', customerId: 'CUS000002', customerName: '广州绿洲食品有限公司', customerType: '企业',
    legalName: '广州绿洲食品有限公司', creditCode: '91440100MA59XK0002', legalPerson: '赵晓',
    registerAddress: '广东省广州市白云区机场路 88 号', contactName: '赵晓', contactPhone: '13600004444',
    contactEmail: 'zhaoxiao@luzhou.example.com', idType: '营业执照', idNumber: '91440100MA59XK0002',
    accountType: '一般存款账户', bankBranch: '广州白云支行', currency: '人民币', remark: '经营结算用一般户', amount: 120,
    materials: m(), status: 'approved', createdBy: 'M001', createdAt: '2026-10-02 09:00:00',
    updatedAt: '2026-10-10 17:30:00', submittedAt: '2026-10-03 09:30:00',
    compliance: { reviewer: '陈静', time: '2026-10-06 10:00:00', opinion: '材料完整，审核通过。', result: 'passed' },
    approval: { reviewer: '赵磊', time: '2026-10-10 17:30:00', opinion: '同意开户，请按流程办理。', result: 'passed' },
    history: [
      { id: 'h1', time: '2026-10-02 09:00:00', actor: '张伟', action: '创建申请', detail: '创建开户申请草稿' },
      { id: 'h2', time: '2026-10-03 09:30:00', actor: '张伟', action: '提交申请', detail: '提交申请进入客户资料合规审核' },
      { id: 'h3', time: '2026-10-06 10:00:00', actor: '陈静', action: '合规审核通过', detail: '材料完整，审核通过。' },
      { id: 'h4', time: '2026-10-10 17:30:00', actor: '赵磊', action: '审批通过', detail: '同意开户，请按流程办理。' },
    ],
  },
  {
    id: 'KH000003', customerId: 'CUS000003', customerName: '北京华信信息技术有限公司', customerType: '企业',
    legalName: '北京华信信息技术有限公司', creditCode: '91110100MA01XK0003', legalPerson: '孙强',
    registerAddress: '北京市海淀区中关村大街 27 号', contactName: '孙强', contactPhone: '13500005555',
    contactEmail: 'sunqiang@huaxin.example.com', idType: '营业执照', idNumber: '91110100MA01XK0003',
    accountType: '基本存款账户', bankBranch: '北京中关村支行', currency: '人民币', remark: '', amount: 60,
    materials: m(), status: 'need_supplement', createdBy: 'M002', createdAt: '2026-10-12 15:00:00',
    updatedAt: '2026-10-21 11:20:00', submittedAt: '2026-10-13 10:00:00',
    compliance: { reviewer: '陈静', time: '2026-10-21 11:20:00', opinion: '缺少法定代表人身份证件扫描件，请补充后重新提交。', result: 'rejected' },
    approval: null,
    history: [
      { id: 'h1', time: '2026-10-12 15:00:00', actor: '李娜', action: '创建申请', detail: '创建开户申请草稿' },
      { id: 'h2', time: '2026-10-13 10:00:00', actor: '李娜', action: '提交申请', detail: '提交申请进入客户资料合规审核' },
      { id: 'h3', time: '2026-10-21 11:20:00', actor: '陈静', action: '合规审核驳回', detail: '缺少法定代表人身份证件扫描件，请补充后重新提交。' },
    ],
  },
  {
    id: 'KH000004', customerId: 'CUS000004', customerName: '上海星辉文化传媒有限公司', customerType: '企业',
    legalName: '上海星辉文化传媒有限公司', creditCode: '91310100MA1XK0004', legalPerson: '刘洋',
    registerAddress: '上海市黄浦区南京东路 300 号', contactName: '刘洋', contactPhone: '13700003333',
    contactEmail: 'liuyang@xinghui.example.com', idType: '营业执照', idNumber: '91310100MA1XK0004',
    accountType: '基本存款账户', bankBranch: '上海黄浦支行', currency: '人民币', remark: '', amount: 100,
    materials: m(), status: 'pending_review', createdBy: 'M003', createdAt: '2026-10-18 09:20:00',
    updatedAt: '2026-10-19 14:00:00', submittedAt: '2026-10-19 14:00:00',
    compliance: null, approval: null,
    history: [
      { id: 'h1', time: '2026-10-18 09:20:00', actor: '王强', action: '创建申请', detail: '创建开户申请草稿' },
      { id: 'h2', time: '2026-10-19 14:00:00', actor: '王强', action: '提交申请', detail: '提交申请进入客户资料合规审核' },
    ],
  },
  {
    id: 'KH000005', customerId: 'CUS000005', customerName: '苏州蓝海贸易有限公司', customerType: '企业',
    legalName: '苏州蓝海贸易有限公司', creditCode: '91320500MA1XK0005', legalPerson: '王敏',
    registerAddress: '江苏省苏州市工业园区星湖街 218 号', contactName: '王敏', contactPhone: '13900002222',
    contactEmail: 'wangmin@lanhai.example.com', idType: '营业执照', idNumber: '91320500MA1XK0005',
    accountType: '基本存款账户', bankBranch: '苏州工业园区支行', currency: '人民币', remark: '草稿，资料待补齐', amount: 50,
    materials: m(), status: 'draft', createdBy: 'M001', createdAt: '2026-10-16 10:00:00',
    updatedAt: '2026-10-16 10:00:00',
    compliance: null, approval: null,
    history: [
      { id: 'h1', time: '2026-10-16 10:00:00', actor: '张伟', action: '创建申请', detail: '创建开户申请草稿' },
    ],
  },
];

export const SEED_FOLLOWUPS: FollowUp[] = [
  {
    id: 'FU000001', targetType: 'lead', targetId: 'LX000001', time: '2026-10-18 15:20:00', method: '电话',
    content: '与陈晨沟通开户需求，客户计划近期开立基本户，需要准备材料清单。', intention: '高', nextPlan: '发送开户材料清单，约定本周上门收集资料。', createdBy: '张伟', createdAt: '2026-10-18 15:20:00',
  },
  {
    id: 'FU000002', targetType: 'customer', targetId: 'CUS000001', time: '2026-10-20 09:00:00', method: '微信',
    content: '已发送开户材料清单，客户反馈证照齐全，等待审批结果。', intention: '高', nextPlan: '审批通过后跟进开户办理进度。', createdBy: '张伟', createdAt: '2026-10-20 09:00:00',
  },
  {
    id: 'FU000003', targetType: 'customer', targetId: 'CUS000002', time: '2026-10-11 10:00:00', method: '上门拜访',
    content: '上门收集开户所需纸质材料，并现场核对证照原件。', intention: '高', nextPlan: '开户成功后告知客户。', createdBy: '张伟', createdAt: '2026-10-11 10:00:00',
  },
];

export const DEFAULT_COMMISSION: CommissionRule = { rate: 5, coefficient: 1, baseLine: 0 };

export const SEED_TARGETS: PerformanceTarget[] = [
  {
    id: 'MB000001', memberIds: ['M001'], period: 'month', periodLabel: '2026-10', targetAmount: 200,
    kpi: '完成开户 4 户、回款 200 万元', status: 'approved', createdBy: '赵磊', createdAt: '2026-10-01 09:00:00',
    approvals: [
      { step: '销售确认', actor: '张伟', time: '2026-10-02 10:00:00', result: 'passed', opinion: '确认目标' },
      { step: '部门主管审批', actor: '赵磊', time: '2026-10-03 10:00:00', result: 'passed', opinion: '同意' },
      { step: '财务确认', actor: '陈静', time: '2026-10-04 10:00:00', result: 'passed', opinion: '已备案' },
    ],
  },
  {
    id: 'MB000002', memberIds: ['M002', 'M003'], period: 'quarter', periodLabel: '2026-Q4', targetAmount: 500,
    kpi: 'Q4 新增开户 10 户、回款 500 万元', status: 'pending', createdBy: '赵磊', createdAt: '2026-10-05 09:00:00',
    approvals: [{ step: '销售确认', actor: '李娜', time: '2026-10-06 10:00:00', result: 'passed', opinion: '已确认' }],
  },
  {
    id: 'MB000003', memberIds: ['M001'], period: 'month', periodLabel: '2026-11', targetAmount: 150,
    kpi: '11 月回款目标 150 万元', status: 'draft', createdBy: '赵磊', createdAt: '2026-10-25 09:00:00', approvals: [],
  },
];
