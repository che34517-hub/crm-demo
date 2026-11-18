import dayjs from 'dayjs';

export const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

export const fmt = (s?: string) => (s ? dayjs(s).format('YYYY-MM-DD HH:mm') : '-');

export const fmtDate = (s?: string) => (s ? dayjs(s).format('YYYY-MM-DD') : '-');

export function nextId(prefix: string, ids: string[]): string {
  const re = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  ids.forEach((id) => {
    const m = id.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return prefix + String(max + 1).padStart(6, '0');
}

let uid = 0;
export const uidGen = () => `h${Date.now().toString(36)}${(uid++).toString(36)}`;
