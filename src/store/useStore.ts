import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Application,
  CommissionRule,
  Customer,
  FollowUp,
  Intention,
  Lead,
  Material,
  PerformanceTarget,
  ReviewRecord,
  TargetPeriod,
  User,
} from '../types';
import { TARGET_APPROVAL_STEPS } from '../types';
import {
  DEFAULT_COMMISSION,
  SEED_APPLICATIONS,
  SEED_CUSTOMERS,
  SEED_FOLLOWUPS,
  SEED_LEADS,
  SEED_TARGETS,
  USERS,
} from '../data/seed';
import { nextId, now, uidGen } from '../utils/format';

export interface ApplicationInput {
  customerId: string | null;
  customerName: string;
  customerType: Application['customerType'];
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
}

export interface LeadInput {
  name: string;
  contactName: string;
  contactPhone: string;
  source: string;
  intention: Intention;
}

export interface TargetInput {
  memberIds: string[];
  period: TargetPeriod;
  periodLabel: string;
  targetAmount: number;
  kpi: string;
}

interface CrmState {
  users: User[];
  currentUserId: string;
  leads: Lead[];
  followups: FollowUp[];
  customers: Customer[];
  applications: Application[];
  targets: PerformanceTarget[];
  commission: CommissionRule;

  setCurrentUser: (id: string) => void;
  currentUser: () => User;

  addLead: (data: LeadInput) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  assignLeads: (ids: string[], managerId: string) => void;

  addFollowUp: (data: Omit<FollowUp, 'id' | 'createdAt'>) => void;

  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  convertLead: (leadId: string) => Customer;

  addApplication: (data: ApplicationInput, submit: boolean) => Application;
  updateApplication: (id: string, data: ApplicationInput) => void;
  submitApplication: (id: string) => void;
  complianceReview: (id: string, result: 'passed' | 'rejected', opinion: string) => void;
  approvalReview: (id: string, result: 'passed' | 'rejected', opinion: string) => void;

  addTarget: (data: TargetInput) => PerformanceTarget;
  updateTarget: (id: string, patch: Partial<TargetInput>) => void;
  submitTarget: (id: string) => void;
  approveTarget: (id: string, opinion: string) => void;
  rejectTarget: (id: string, opinion: string) => void;
  deleteTarget: (id: string) => void;
  setCommission: (rule: CommissionRule) => void;

  reset: () => void;
}

export const useStore = create<CrmState>()(
  persist(
    (set, get) => ({
      users: USERS,
      currentUserId: 'M001',
      leads: SEED_LEADS,
      followups: SEED_FOLLOWUPS,
      customers: SEED_CUSTOMERS,
      applications: SEED_APPLICATIONS,
      targets: SEED_TARGETS,
      commission: DEFAULT_COMMISSION,

      setCurrentUser: (id) => set({ currentUserId: id }),

      currentUser: () => {
        const { users, currentUserId } = get();
        return users.find((u) => u.id === currentUserId) ?? users[0];
      },

      addLead: (data) => {
        const id = nextId('LX', get().leads.map((l) => l.id));
        const t = now();
        const lead: Lead = { ...data, id, status: '待分配', ownerId: null, createdAt: t, updatedAt: t };
        set((s) => ({ leads: [lead, ...s.leads] }));
        return lead;
      },

      updateLead: (id, patch) =>
        set((s) => ({
          leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: now() } : l)),
        })),

      assignLeads: (ids, managerId) => {
        const { currentUser } = get();
        const actor = currentUser().name;
        const t = now();
        set((s) => ({
          leads: s.leads.map((l) =>
            ids.includes(l.id)
              ? { ...l, ownerId: managerId, status: '跟进中' as const, assignedAt: t, assignedBy: actor, updatedAt: t }
              : l
          ),
        }));
      },

      addFollowUp: (data) => {
        const id = nextId('FU', get().followups.map((f) => f.id));
        set((s) => ({
          followups: [{ ...data, id, createdAt: now() }, ...s.followups],
        }));
      },

      addCustomer: (data) => {
        const id = nextId('CUS', get().customers.map((c) => c.id));
        const t = now();
        const customer: Customer = { ...data, id, createdAt: t, updatedAt: t };
        set((s) => ({ customers: [customer, ...s.customers] }));
        return customer;
      },

      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)),
        })),

      convertLead: (leadId) => {
        const lead = get().leads.find((l) => l.id === leadId);
        if (!lead) throw new Error('线索不存在');
        const { currentUser } = get();
        const customer = get().addCustomer({
          name: lead.name,
          type: '企业',
          contactName: lead.contactName,
          contactPhone: lead.contactPhone,
          managerId: lead.ownerId ?? currentUser().id,
          status: '潜在',
        });
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === leadId
              ? { ...l, status: '已转化' as const, customerId: customer.id, updatedAt: now() }
              : l
          ),
        }));
        return customer;
      },

      addApplication: (data, submit) => {
        const id = nextId('KH', get().applications.map((a) => a.id));
        const t = now();
        const actor = get().currentUser().name;
        const app: Application = {
          ...data,
          id,
          status: submit ? 'pending_review' : 'draft',
          createdBy: get().currentUserId,
          createdAt: t,
          updatedAt: t,
          submittedAt: submit ? t : undefined,
          compliance: null,
          approval: null,
          history: [
            { id: uidGen(), time: t, actor, action: '创建申请', detail: submit ? '创建并提交开户申请' : '创建开户申请草稿' },
            ...(submit
              ? [{ id: uidGen(), time: t, actor, action: '提交申请', detail: '提交申请进入客户资料合规审核' }]
              : []),
          ],
        };
        set((s) => ({ applications: [app, ...s.applications] }));
        return app;
      },

      updateApplication: (id, data) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: now() } : a
          ),
        })),

      submitApplication: (id) => {
        const t = now();
        const actor = get().currentUser().name;
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: 'pending_review' as const,
                  submittedAt: t,
                  updatedAt: t,
                  compliance: null,
                  approval: null,
                  history: [
                    ...a.history,
                    { id: uidGen(), time: t, actor, action: '提交申请', detail: '提交申请进入客户资料合规审核' },
                  ],
                }
              : a
          ),
        }));
      },

      complianceReview: (id, result, opinion) => {
        const t = now();
        const actor = get().currentUser().name;
        const record: ReviewRecord = { reviewer: actor, time: t, opinion, result };
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: result === 'passed' ? ('pending_approval' as const) : ('need_supplement' as const),
                  compliance: record,
                  updatedAt: t,
                  history: [
                    ...a.history,
                    {
                      id: uidGen(),
                      time: t,
                      actor,
                      action: result === 'passed' ? '合规审核通过' : '合规审核驳回',
                      detail: opinion,
                    },
                  ],
                }
              : a
          ),
        }));
      },

      approvalReview: (id, result, opinion) => {
        const t = now();
        const actor = get().currentUser().name;
        const record: ReviewRecord = { reviewer: actor, time: t, opinion, result };
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: result === 'passed' ? ('approved' as const) : ('rejected' as const),
                  approval: record,
                  updatedAt: t,
                  history: [
                    ...a.history,
                    {
                      id: uidGen(),
                      time: t,
                      actor,
                      action: result === 'passed' ? '审批通过' : '审批驳回',
                      detail: opinion,
                    },
                  ],
                }
              : a
          ),
        }));
      },

      addTarget: (data) => {
        const id = nextId('MB', get().targets.map((t) => t.id));
        const target: PerformanceTarget = {
          ...data,
          id,
          status: 'draft',
          createdBy: get().currentUser().name,
          createdAt: now(),
          approvals: [],
        };
        set((s) => ({ targets: [target, ...s.targets] }));
        return target;
      },

      updateTarget: (id, patch) =>
        set((s) => ({
          targets: s.targets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      submitTarget: (id) =>
        set((s) => ({
          targets: s.targets.map((t) => (t.id === id ? { ...t, status: 'pending' as const, approvals: [] } : t)),
        })),

      approveTarget: (id, opinion) => {
        const t = get().targets.find((x) => x.id === id);
        if (!t || t.status === 'approved') return;
        const idx = t.approvals.length;
        if (idx >= TARGET_APPROVAL_STEPS.length) return;
        const step = TARGET_APPROVAL_STEPS[idx];
        const rec = {
          step,
          actor: get().currentUser().name,
          time: now(),
          result: 'passed' as const,
          opinion: opinion || '同意',
        };
        const done = idx === TARGET_APPROVAL_STEPS.length - 1;
        set((s) => ({
          targets: s.targets.map((x) =>
            x.id === id
              ? { ...x, approvals: [...x.approvals, rec], status: done ? ('approved' as const) : ('pending' as const) }
              : x
          ),
        }));
      },

      rejectTarget: (id, opinion) => {
        const t = get().targets.find((x) => x.id === id);
        if (!t) return;
        const idx = Math.min(t.approvals.length, TARGET_APPROVAL_STEPS.length - 1);
        const rec = {
          step: TARGET_APPROVAL_STEPS[idx],
          actor: get().currentUser().name,
          time: now(),
          result: 'rejected' as const,
          opinion: opinion || '驳回',
        };
        set((s) => ({
          targets: s.targets.map((x) =>
            x.id === id ? { ...x, approvals: [...x.approvals, rec], status: 'rejected' as const } : x
          ),
        }));
      },

      deleteTarget: (id) =>
        set((s) => ({ targets: s.targets.filter((t) => t.id !== id) })),

      setCommission: (rule) => set({ commission: rule }),

      reset: () =>
        set({
          leads: SEED_LEADS,
          followups: SEED_FOLLOWUPS,
          customers: SEED_CUSTOMERS,
          applications: SEED_APPLICATIONS,
          targets: SEED_TARGETS,
          commission: DEFAULT_COMMISSION,
          currentUserId: 'M001',
        }),
    }),
    {
      name: 'crm-demo-store',
      partialize: (s) => ({
        leads: s.leads,
        followups: s.followups,
        customers: s.customers,
        applications: s.applications,
        targets: s.targets,
        commission: s.commission,
        currentUserId: s.currentUserId,
      }),
    }
  )
);

export function useCurrentUser(): User {
  return useStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? s.users[0]);
}

export function useManagerById(id: string | null | undefined): string {
  return useStore((s) => (id ? s.users.find((u) => u.id === id)?.name ?? '未分配' : '未分配'));
}
