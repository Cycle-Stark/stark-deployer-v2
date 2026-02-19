import { Badge, Group } from '@mantine/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { contractInteractionsManager } from '@/storage/contractInteractionsDatabase';

interface ContractInteractionStatsProps {
  contractId: number;
}

export default function ContractInteractionStats({ contractId }: ContractInteractionStatsProps) {
  const total = useLiveQuery(
    () => contractInteractionsManager.getCountByContractId(contractId),
    [contractId]
  );

  const success = useLiveQuery(
    () => contractInteractionsManager.getCountByStatus(contractId, 'success'),
    [contractId]
  );

  const failed = useLiveQuery(
    () => contractInteractionsManager.getCountByStatus(contractId, 'failed'),
    [contractId]
  );

  if (total === undefined) return null;
  if (total === 0) {
    return (
      <Badge size="sm" color="gray" variant="light">
        0
      </Badge>
    );
  }

  return (
    <Group gap={4} wrap="nowrap">
      <Badge size="sm" color="gray" variant="light">
        {total}
      </Badge>
      {(success ?? 0) > 0 && (
        <Badge size="sm" color="teal" variant="light">
          {success}
        </Badge>
      )}
      {(failed ?? 0) > 0 && (
        <Badge size="sm" color="red" variant="light">
          {failed}
        </Badge>
      )}
    </Group>
  );
}
