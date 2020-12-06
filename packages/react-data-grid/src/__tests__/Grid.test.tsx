import React from 'react';
import { shallow } from 'enzyme';
import { CellNavigationMode } from '../common/enums';
import helpers, { fakeCellMetaData } from './utils/GridPropHelpers';
import Grid from '../Grid';

describe('Empty Grid Tests', () => {
  class EmptyRowsView extends React.Component {
    render() {
      return <div>Nothing to show</div>;
    }
  }

  const testProps = {
    columnMetrics: {
      columns: helpers.columns,
      width: 960,
      totalWidth: 960,
      minColumnWidth: 35,
      totalColumnWidth: 960,
    },
    headerRows: [],
    rowsCount: 0,
    rowOffsetHeight: 50,
    // rowGetter() {
    //   return [];
    // },
    rowGetter: helpers.rowGetter,
    minHeight: 600,
    totalWidth: 960,
    rowHeight: 24,
    emptyRowsView: EmptyRowsView,
    onViewportKeydown() {},
    onViewportDragStart() {},
    onViewportDragEnd() {},
    onViewportDoubleClick() {},
    cellMetaData: fakeCellMetaData,
    rowKey: 'id' as 'id',
    enableCellSelect: true,
    enableCellAutoFocus: true,
    cellNavigationMode: CellNavigationMode.NONE,
    eventBus: { subscribers: null, subscribe: null, dispatch: null },
    onGridRowsUpdated: () => null,
    onDragHandleDoubleClick: () => null,
    onCommit: () => null,
    onColumnResize: () => null,
    onSort: () => null,
    onViewportKeyup: () => null,
    interactionMasksMetaData: null,
    editorPortalTarget: null,
  };

  test('should not have any viewport', () => {
    const wrapper = shallow(<Grid {...testProps} />);
    expect(wrapper.find(EmptyRowsView).exists());
  });
});
