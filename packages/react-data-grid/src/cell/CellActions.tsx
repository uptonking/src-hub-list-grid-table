import React from 'react';
import CellAction from './CellAction';
import { CellProps } from '../Cell';

type CellActionsProps<R> = Pick<CellProps<R>, 'cellMetaData' | 'column' | 'rowData'>;

/**
 * 渲染单元格所支持操作的数组
 */
export default function CellActions<R>({ cellMetaData, column, rowData }: CellActionsProps<R>) {
  if (cellMetaData.getCellActions) {
    const cellActionButtons = cellMetaData.getCellActions(column, rowData);

    if (cellActionButtons && cellActionButtons.length > 0) {
      const actionButtons = cellActionButtons.map((action, index) => {
        return <CellAction key={index} isFirst={index === 0} {...action} />;
      });

      return <>{actionButtons}</>;
    }
  }
  return null;
}
