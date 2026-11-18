import type { Application, CommissionRule } from '../types';

/** 某（些）客户经理名下「已开户(approved)」申请的业绩额合计（万元） */
export function actualAmountOf(apps: Application[], memberIds: string[]): number {
  return apps
    .filter((a) => a.status === 'approved' && a.createdBy && memberIds.includes(a.createdBy))
    .reduce((sum, a) => sum + (a.amount ?? 0), 0);
}

export function completionRateOf(targetAmount: number, actual: number): number {
  if (targetAmount <= 0) return 0;
  return Math.round((actual / targetAmount) * 100);
}

export function commissionOf(actual: number, rule: CommissionRule): number {
  if (actual < rule.baseLine) return 0;
  return Math.round(actual * (rule.rate / 100) * rule.coefficient * 100) / 100;
}
