import React from 'react';

export interface RowsContainerProps {
  id: string;
  children: React.ReactNode;
}
/** 行容器组件 */
export default function RowsContainer({ children }: RowsContainerProps) {
  return <>{children}</>;
}
