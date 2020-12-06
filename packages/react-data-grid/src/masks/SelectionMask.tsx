import React, { forwardRef } from 'react';
import CellMask, { CellMaskProps } from './CellMask';

// eslint-disable-next-line react/display-name
const SelectionMask = forwardRef<HTMLDivElement, CellMaskProps>(function SelectionMask(props, ref) {
  return <CellMask {...props} className='rdg-selected' ref={ref} tabIndex={0} />;
});

export default SelectionMask;
