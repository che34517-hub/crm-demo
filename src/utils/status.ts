import type { Application, AppStatus } from '../types';

export const APP_STATUS_META: Record<AppStatus, { label: string; color: string }> = {
  draft: { label: '待提交', color: 'default' },
  pending_review: { label: '待审核', color: 'warning' },
  pending_approval: { label: '待审批', color: 'processing' },
  approved: { label: '已通过', color: 'success' },
  need_supplement: { label: '需补充资料', color: 'error' },
  rejected: { label: '已驳回', color: 'error' },
};

export const APP_STATUS_ORDER: AppStatus[] = [
  'draft',
  'pending_review',
  'pending_approval',
  'need_supplement',
  'approved',
  'rejected',
];

const TAG_COLOR: Record<string, string> = {
  待分配: 'orange',
  跟进中: 'processing',
  已转化: 'success',
  已流失: 'default',
  潜在: 'default',
  正式: 'success',
  休眠: 'default',
  待提交: 'default',
  待审核: 'warning',
  待审批: 'processing',
  已通过: 'success',
  需补充资料: 'error',
  已驳回: 'error',
  未提交: 'default',
  处理中: 'processing',
  已完成: 'success',
  高: 'success',
  中: 'warning',
  低: 'default',
};

export function tagColor(label: string): string {
  return TAG_COLOR[label] ?? 'default';
}

export type ComplianceStatus = '未提交' | '待审核' | '已通过' | '需补充资料' | '已驳回';

export const COMPLIANCE_OPTIONS: ComplianceStatus[] = ['未提交', '待审核', '已通过', '需补充资料', '已驳回'];

export function hasOpenedAccountOf(apps: Application[], customerId: string | null): boolean {
  if (!customerId) return false;
  return apps.some((a) => a.customerId === customerId && a.status === 'approved');
}

export function complianceStatusOf(apps: Application[], customerId: string | null): ComplianceStatus {
  if (!customerId) return '未提交';
  const list = apps
    .filter((a) => a.customerId === customerId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  if (!list.length) return '未提交';
  const latest = list[0];
  switch (latest.status) {
    case 'draft':
      return '未提交';
    case 'pending_review':
      return '待审核';
    case 'pending_approval':
    case 'approved':
      return '已通过';
    case 'need_supplement':
      return '需补充资料';
    case 'rejected':
      return '已驳回';
  }
}

export interface TaskView {
  stage: string;
  status: string;
  result: string;
}

export function taskOf(app: Application): TaskView {
  switch (app.status) {
    case 'draft':
      return { stage: '待提交', status: '待提交', result: '-' };
    case 'pending_review':
      return { stage: '资料审核', status: '处理中', result: '合规审核中' };
    case 'pending_approval':
      return { stage: '开户审批', status: '处理中', result: '审批中' };
    case 'approved':
      return { stage: '开户办理', status: '已完成', result: '开户成功' };
    case 'need_supplement':
      return { stage: '资料补充', status: '需补充资料', result: '待补充资料' };
    case 'rejected':
      return { stage: '已驳回', status: '已驳回', result: '审批驳回' };
  }
}
