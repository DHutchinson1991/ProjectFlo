import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';

const STATUS_COLORS: Record<string, ChipProps['color']> = {
  Draft: 'default',
  Sent: 'primary',
  Accepted: 'success',
  Declined: 'error',
};

interface ProposalStatusChipProps {
  status: string;
}

export function ProposalStatusChip({ status }: ProposalStatusChipProps) {
  return <Chip label={status} size="small" color={STATUS_COLORS[status] || 'default'} />;
}