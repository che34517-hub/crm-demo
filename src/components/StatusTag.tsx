import { Tag } from 'antd';
import { tagColor } from '../utils/status';

export default function StatusTag({ status }: { status: string }) {
  return <Tag color={tagColor(status)}>{status}</Tag>;
}
