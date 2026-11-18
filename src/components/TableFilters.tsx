import { useState } from 'react';
import { DatePicker, Input, Select } from 'antd';
import { FilterOutlined, SearchOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

export interface ColumnFilterProps {
  filterDropdown: ReactNode;
  filterIcon: ReactNode;
  filtered: boolean;
}

function makeDropdown(content: ReactNode): ReactNode {
  return (
    <div
      className="col-filter"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {content}
    </div>
  );
}

/** 文本列：单列模糊搜索框 */
export function textFilter(
  value: string | undefined,
  onChange: (v: string | undefined) => void,
  placeholder: string
): ColumnFilterProps {
  return {
    filterDropdown: makeDropdown(
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        style={{ width: 200 }}
      />
    ),
    filterIcon: <FilterOutlined />,
    filtered: !!value,
  };
}

/** 状态 / 枚举列：单列下拉筛选 */
export function selectFilter(
  value: string | undefined,
  onChange: (v: string | undefined) => void,
  options: { value: string; label: string }[],
  placeholder: string,
  width = 170
): ColumnFilterProps {
  return {
    filterDropdown: makeDropdown(
      <Select
        allowClear
        placeholder={placeholder}
        value={value}
        onChange={(v) => onChange(v ?? undefined)}
        options={options}
        style={{ width }}
      />
    ),
    filterIcon: <FilterOutlined />,
    filtered: !!value,
  };
}

/** 时间列：单列时间范围筛选 */
export function dateRangeFilter(
  value: [Dayjs, Dayjs] | null,
  onChange: (v: [Dayjs, Dayjs] | null) => void
): ColumnFilterProps {
  return {
    filterDropdown: makeDropdown(
      <DatePicker.RangePicker
        value={value}
        onChange={(dates) => onChange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)}
      />
    ),
    filterIcon: <FilterOutlined />,
    filtered: !!(value && value[0] && value[1]),
  };
}

/** 每列表头筛选的受控状态管理 */
export function useFilters() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const set = (key: string) => (value: any) => setFilters((f) => ({ ...f, [key]: value }));
  return { filters, set };
}

/** 文本匹配（大小写不敏感、模糊） */
export function matchText(target: string, keyword: string | undefined): boolean {
  if (!keyword) return true;
  return target.toLowerCase().includes(keyword.trim().toLowerCase());
}

/** 判断时间是否落在范围 [start, end] 内 */
export function inRange(dateStr: string | undefined, range: [Dayjs, Dayjs] | null | undefined): boolean {
  if (!range || !range[0] || !range[1] || !dateStr) return true;
  return !(
    dayjs(dateStr).isBefore(range[0].startOf('day')) || dayjs(dateStr).isAfter(range[1].endOf('day'))
  );
}
