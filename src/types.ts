export type Role = 'manager' | 'reviewer' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type LeadStatus = '待分配' | '跟进中' | '已转化' | '已流失';
export type Intention = '高' | '中' | '低';

export interface Lead {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  source: string;
  status: LeadStatus;
  intention: Intention;
  ownerId: string | null;
  customerId?: string;
  assignedAt?: string;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  targetType: 'lead' | 'customer';
  targetId: string;
  time: string;
  method: string;
  content: string;
  intention: Intention;
  nextPlan: string;
  createdBy: string;
  createdAt: string;
}

export type CustomerType = '企业' | '个体工商户' | '个人';
export type CustomerStatus = '潜在' | '正式' | '休眠';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  contactName: string;
  contactPhone: string;
  managerId: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  name: string;
  required: boolean;
  uploaded: boolean;
}

export type AppStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_approval'
  | 'approved'
  | 'need_supplement'
  | 'rejected';

export interface ReviewRecord {
  reviewer: string;
  time: string;
  opinion: string;
  result: 'passed' | 'rejected';
}

export interface HistoryRecord {
  id: string;
  time: string;
  actor: string;
  action: string;
  detail: string;
}

export interface Application {
  id: string;
  customerId: string | null;
  customerName: string;
  customerType: CustomerType;
  legalName: string;
  creditCode: string;
  legalPerson: string;
  registerAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  idType: string;
  idNumber: string;
  accountType: string;
  bankBranch: string;
  currency: string;
  remark: string;
  amount: number;
  materials: Material[];
  status: AppStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  compliance: ReviewRecord | null;
  approval: ReviewRecord | null;
  history: HistoryRecord[];
}

export type TargetPeriod = 'month' | 'quarter' | 'year';
export type TargetStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface TargetApproval {
  step: string;
  actor: string;
  time: string;
  result: 'passed' | 'rejected';
  opinion: string;
}

export interface PerformanceTarget {
  id: string;
  memberIds: string[];
  period: TargetPeriod;
  periodLabel: string;
  targetAmount: number;
  kpi: string;
  status: TargetStatus;
  createdBy: string;
  createdAt: string;
  approvals: TargetApproval[];
}

export interface CommissionRule {
  rate: number;
  coefficient: number;
  baseLine: number;
}

export const ACCOUNT_TYPES = ['基本存款账户', '一般存款账户', '专用存款账户', '临时存款账户'];
export const ID_TYPES = ['营业执照', '居民身份证', '护照', '其他'];
export const CURRENCIES = ['人民币', '美元', '欧元', '港币'];
export const FOLLOW_METHODS = ['电话', '微信', '上门拜访', '邮件'];
export const TARGET_APPROVAL_STEPS = ['销售确认', '部门主管审批', '财务确认'];
