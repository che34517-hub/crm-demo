import type { Role } from '../types';

export const ROLE_LABEL: Record<Role, string> = {
  manager: '客户经理',
  reviewer: '合规审核人员',
  supervisor: '客户主管',
};

export const ROLE_COLOR: Record<Role, string> = {
  manager: 'blue',
  reviewer: 'gold',
  supervisor: 'purple',
};
