import React from 'react';
import { DataGridProps, DataGridState } from './interfaces';
import { isRowSelectedForRDG } from './utils/rowUtils';
import { getColumnsArrLength } from './utils/columnUtils';
import { SelectAll } from './formatters';
import KeyCodes from './common/KeyCodes';
import { CellNavigationMode, EventTypes, UpdateActions, HeaderRowType, DEFINE_SORT } from './common/enums';
import { sameColumn, sameColumns, recalculate, resizeColumn } from './utils/columnMetrics';
import { EventBus } from './masks';
import {
  CellMetaData,
  Column,
  ColumnList,
  CommitEvent,
  HeaderRowData,
  InteractionMasksMetaData,
  Position,
  SelectedRow,
} from './common/types';
import Grid from './Grid';
import ToolbarContainer from './ToolbarContainer';
import CheckboxEditor from './common/editors/CheckboxEditor';

/** defaultProps包含的属性 */
type DefaultProps = Pick<
  DataGridProps<{ id?: unknown }>,
  | 'enableCellSelect'
  | 'selectAllRenderer'
  | 'rowHeight'
  | 'headerFiltersHeight'
  | 'enableRowSelect'
  | 'minHeight'
  | 'rowKey'
  | 'cellNavigationMode'
  | 'enableCellAutoFocus'
  | 'minColumnWidth'
  | 'columnEquality'
  | 'editorPortalTarget'
>;

/**
 * Main API Component to render a data grid of rows and columns.
 * 显示表格的入口组件，除了生命周期方法外大多是事件处理函数。
 *
 * minimal usage: 必需属性仅3个，columns，rowGetter，rowsCount。
 * <ReactDataGrid columns={columns} rowGetter={i => rows[i]} rowsCount={3} />
 */
export default class ReactDataGrid<R extends {}> extends React.Component<DataGridProps<R>, DataGridState<R>> {
  static displayName = 'ReactDataGrid';

  static defaultProps: DefaultProps = {
    minColumnWidth: 80,
    columnEquality: sameColumn,
    rowHeight: 35,
    // 默认会显示10行数据
    minHeight: 350,
    rowKey: 'id',
    enableRowSelect: false,
    selectAllRenderer: SelectAll,
    enableCellSelect: false,
    enableCellAutoFocus: true,
    cellNavigationMode: CellNavigationMode.NONE,
    headerFiltersHeight: 45,
    editorPortalTarget: document.body,
  };

  /** ref-grid，是本组件最外层div(.react-grid-Container)的引用 */
  grid = React.createRef<HTMLDivElement>();
  /** ref-base-grid，是Grid组件(.react-grid-Grid)的引用 */
  base = React.createRef<Grid<R>>();
  /** ref-selectAllCheckbox */
  selectAllCheckbox = React.createRef<HTMLInputElement>();
  /** 一个对象，便于不同层次的组件传递数据，作用类似redux，包含属性dispatch函数 */
  eventBus = new EventBus();
  /** 按下的键的集合 */
  _keysDown = new Set<number>();
  /** 列数据的缓存 */
  _cachedColumns?: ColumnList<R>;
  /** 列数据计算得到的中间数据的缓存 */
  _cachedComputedColumns?: ColumnList<R>;

  constructor(props: DataGridProps<R>) {
    super(props);
    const initialState: DataGridState<R> = {
      columnMetrics: this.createColumnMetrics(),
      selectedRows: [],
      lastRowIdxUiSelected: -1,
      canFilter: false,
    };
    if (this.props.sortColumn && this.props.sortDirection) {
      initialState.sortColumn = this.props.sortColumn;
      initialState.sortDirection = this.props.sortDirection;
    }

    // 初始化state，6个属性
    this.state = initialState;
  }

  componentDidMount() {
    console.log('====componentDidMount RDGrid');

    // 每次resize都会触发this.metricsUpdated(),执行顺序是在子组件重新render之后
    window.addEventListener('resize', this.metricsUpdated);

    // 鼠标释放时触发单元格选择事件
    if (this.props.cellRangeSelection) {
      window.addEventListener('mouseup', this.handleWindowMouseUp);
    }

    // 更新this.state中grid的宽度
    this.metricsUpdated();
  }

  componentWillUnmount() {
    console.log('====componentWillUnmount RDGrid');

    window.removeEventListener('resize', this.metricsUpdated);
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
  }

  UNSAFE_componentWillReceiveProps(nextProps: DataGridProps<R>) {
    console.log('====componentWillReceiveProps RDGrid');

    if (
      nextProps.columns &&
      (!sameColumns(this.props.columns, nextProps.columns, this.props.columnEquality) ||
        nextProps.minWidth !== this.props.minWidth)
    ) {
      const columnMetrics = this.createColumnMetrics(nextProps);
      this.setState({ columnMetrics });
    }
  }

  /**
   * 调用eventBus的dispatch方法，将选择单元格的行列号传过去
   * @param positionXY 包含列号和行号的对象
   * @param openEditor 可选参数，是否打开单元格编辑器
   */
  selectCell({ idx, rowIdx }: Position, openEditor?: boolean) {
    this.eventBus.dispatch(EventTypes.SELECT_CELL, { rowIdx, idx }, openEditor);
  }

  /** 根据ref-grid的引用获取parentElement的宽度，首次会返回0，每次render都会调用此方法 */
  gridWidth() {
    // 首次渲染时current依次为 null,div-rgd-Container
    const { current } = this.grid;
    // console.log('gridWidth-this.grid.current, ', current);
    // 首次渲染时parentEle依次为 null,div-main
    // console.log('gridWidth-grid-parentElement, ', current ? current.parentElement : null);
    return current && current.parentElement ? current.parentElement.offsetWidth : 0;
  }

  /** 调用gridWidth()返回grid父元素宽度 */
  getTotalWidth() {
    if (this.grid.current) {
      return this.gridWidth();
    }

    // 计算 列数*每列宽度 作为总宽度
    return getColumnsArrLength(this.props.columns) * this.props.minColumnWidth;
  }

  getColumn(idx: number) {
    return this.state.columnMetrics.columns[idx];
  }

  getSize() {
    return this.state.columnMetrics.columns.length;
  }

  /** 调用createColumnMetrics重新计算列宽，再通过this.setState更新state */
  metricsUpdated = () => {
    // console.log('RDG-metricsUpdated()');
    const columnMetrics = this.createColumnMetrics();
    this.setState({ columnMetrics });
  };

  /**
   * 计算列信息及列宽相关配置
   * @param props 组件的this.props
   */
  createColumnMetrics(props = this.props) {
    const gridColumns: ColumnList<R> = this.setupGridColumns(props);
    const metrics = {
      columns: gridColumns,
      minColumnWidth: this.props.minColumnWidth,
      totalWidth: this.props.minWidth || this.getTotalWidth(),
    };
    // console.log('metrics, ', metrics);

    // 给metrics添加了width和totalColumnWidth属性
    return recalculate(metrics);
  }

  isSingleKeyDown(keyCode: number) {
    return this._keysDown.has(keyCode) && this._keysDown.size === 1;
  }

  handleColumnResize = (idx: number, width: number) => {
    const columnMetrics = resizeColumn(this.state.columnMetrics, idx, width);
    this.setState({ columnMetrics });
    if (this.props.onColumnResize) {
      this.props.onColumnResize(idx, width);
    }
  };

  handleDragEnter = (overRowIdx: number) => {
    this.eventBus.dispatch(EventTypes.DRAG_ENTER, overRowIdx);
  };

  handleViewportKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Track which keys are currently down for shift clicking etc
    this._keysDown.add(e.keyCode);

    const { onGridKeyDown } = this.props;
    if (onGridKeyDown) {
      onGridKeyDown(e);
    }
  };

  handleViewportKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Track which keys are currently down for shift clicking etc
    this._keysDown.delete(e.keyCode);

    const { onGridKeyUp } = this.props;
    if (onGridKeyUp) {
      onGridKeyUp(e);
    }
  };

  /** 单元格单击时的事件处理函数，会被传递到Cell组件，click事件会在mousedown和mouseup事件后执行 */
  handleCellClick = ({ rowIdx, idx }: Position) => {
    console.log('====RDG-handleCellClick');

    const { onRowClick, rowGetter } = this.props;
    this.selectCell({ rowIdx, idx });

    // console.log('onRowClick, ',onRowClick)
    // 若存在，则调用单击整行的事件处理函数，onRowClick默认为undefined
    if (onRowClick) {
      onRowClick(rowIdx, rowGetter(rowIdx), this.getColumn(idx));
    }
  };

  /** 单元格双击时的事件处理函数，会被传递到Cell组件， 双击时会先执行两次单击事件，然后再执行双击事件，TODO 优化性能 */
  handleCellDoubleClick = ({ rowIdx, idx }: Position) => {
    console.log('====RDG-handleCellDoubleClick');

    const { onRowDoubleClick, rowGetter } = this.props;
    // console.log('onRowDoubleClick, ',onRowDoubleClick)
    // 若存在，则调用双击整行的事件处理函数，onRowDoubleClick默认为undefined
    if (onRowDoubleClick) {
      onRowDoubleClick(rowIdx, rowGetter(rowIdx), this.getColumn(idx));
    }

    // 最后打开单元格编辑器
    this.openCellEditor(rowIdx, idx);
  };

  handleCellMouseDown = (position: Position) => {
    console.log('====RDG-handleCellMouseDown');

    this.eventBus.dispatch(EventTypes.SELECT_START, position);
  };

  handleCellMouseEnter = (position: Position) => {
    console.log('====RDG-handleCellMouseEnter');

    this.eventBus.dispatch(EventTypes.SELECT_UPDATE, position);
  };

  handleWindowMouseUp = () => {
    console.log('====RDG-handleWindowMouseUp');

    this.eventBus.dispatch(EventTypes.SELECT_END);
  };

  handleCellContextMenu = (position: Position) => {
    this.selectCell(position);
  };

  /** 点击顶部工具栏Filter Rows按钮时会触发的事件，会在表头行下面显示或隐藏一行过滤器 */
  handleToggleFilter = () => {
    this.setState(
      prevState => ({ canFilter: !prevState.canFilter }),
      () => {
        if (this.state.canFilter === false && this.props.onClearFilters) {
          this.props.onClearFilters();
        }
      },
    );
  };

  handleDragHandleDoubleClick: InteractionMasksMetaData<R>['onDragHandleDoubleClick'] = e => {
    const cellKey = this.getColumn(e.idx).key;
    this.handleGridRowsUpdated(
      cellKey,
      e.rowIdx,
      this.props.rowsCount - 1,
      { [cellKey]: e.rowData[cellKey] },
      UpdateActions.COLUMN_FILL,
    );
  };

  /** 更新一行数据会调用的方法，如编辑单元格后 */
  handleGridRowsUpdated: InteractionMasksMetaData<R>['onGridRowsUpdated'] = (
    cellKey,
    fromRow,
    toRow,
    updated,
    action,
    originRow,
  ) => {
    const { rowGetter, rowKey, onGridRowsUpdated } = this.props;
    if (!onGridRowsUpdated) {
      return;
    }

    const rowIds = [];
    // Set correct rowIds when copying cell with upward dragging
    const start = Math.min(fromRow, toRow);
    const end = Math.max(fromRow, toRow);

    for (let i = start; i <= end; i++) {
      rowIds.push(rowGetter(i)[rowKey]);
    }

    const fromRowData = rowGetter(action === UpdateActions.COPY_PASTE ? originRow : fromRow);
    const fromRowId = fromRowData[rowKey];
    const toRowId = rowGetter(toRow)[rowKey];

    // 调用此方法更新表格数据源对象，会触发ReactDataGrid组件的重新渲染
    onGridRowsUpdated({
      cellKey,
      fromRow,
      toRow,
      fromRowId,
      toRowId,
      rowIds,
      updated: updated as never,
      action,
      fromRowData,
    });
  };

  /** 提交数据最新值的方法入口，会作为onCommit属性传递到IMASK */
  handleCommit = (commit: CommitEvent<R>) => {
    const targetRow = commit.rowIdx;
    this.handleGridRowsUpdated(commit.cellKey, targetRow, targetRow, commit.updated, UpdateActions.CELL_UPDATE);
  };

  handleSort = (sortColumn: keyof R, sortDirection: DEFINE_SORT) => {
    this.setState({ sortColumn, sortDirection }, () => {
      const { onGridSort } = this.props;
      if (onGridSort) {
        onGridSort(sortColumn, sortDirection);
      }
    });
  };

  getSelectedRow(rows: SelectedRow<R>[], key: unknown) {
    return rows.find(r => r[this.props.rowKey] === key);
  }

  useNewRowSelection = () => {
    return this.props.rowSelection && this.props.rowSelection.selectBy;
  };

  // return false if not a shift select so can be handled as normal row selection
  handleShiftSelect = (rowIdx: number) => {
    const { rowSelection } = this.props;
    if (rowSelection && this.state.lastRowIdxUiSelected > -1 && this.isSingleKeyDown(KeyCodes.Shift)) {
      const { keys, indexes, isSelectedKey } = rowSelection.selectBy as { [key: string]: unknown };
      const isPreviouslySelected = isRowSelectedForRDG(
        keys,
        indexes,
        isSelectedKey,
        this.props.rowGetter(rowIdx),
        rowIdx,
      );

      if (isPreviouslySelected) return false;

      let handled = false;

      if (rowIdx > this.state.lastRowIdxUiSelected) {
        const rowsSelected = [];

        for (let i = this.state.lastRowIdxUiSelected + 1; i <= rowIdx; i++) {
          rowsSelected.push({ rowIdx: i, row: this.props.rowGetter(i) });
        }

        if (typeof rowSelection.onRowsSelected === 'function') {
          rowSelection.onRowsSelected(rowsSelected);
        }

        handled = true;
      } else if (rowIdx < this.state.lastRowIdxUiSelected) {
        const rowsSelected = [];

        for (let i = rowIdx; i <= this.state.lastRowIdxUiSelected - 1; i++) {
          rowsSelected.push({ rowIdx: i, row: this.props.rowGetter(i) });
        }

        if (typeof rowSelection.onRowsSelected === 'function') {
          rowSelection.onRowsSelected(rowsSelected);
        }

        handled = true;
      }

      if (handled) {
        this.setState({ lastRowIdxUiSelected: rowIdx });
      }

      return handled;
    }

    return false;
  };

  handleNewRowSelect = (rowIdx: number, rowData: R) => {
    const { current } = this.selectAllCheckbox;
    if (current && current.checked === true) {
      current.checked = false;
    }

    const { rowSelection } = this.props;
    if (rowSelection) {
      const { keys, indexes, isSelectedKey } = rowSelection.selectBy as { [key: string]: unknown };
      const isPreviouslySelected = isRowSelectedForRDG(keys, indexes, isSelectedKey, rowData, rowIdx);

      this.setState({ lastRowIdxUiSelected: isPreviouslySelected ? -1 : rowIdx });
      const cb = isPreviouslySelected ? rowSelection.onRowsDeselected : rowSelection.onRowsSelected;
      if (typeof cb === 'function') {
        cb([{ rowIdx, row: rowData }]);
      }
    }
  };

  // columnKey not used here as this function will select the whole row,
  // but needed to match the function signature in the CheckboxEditor
  handleRowSelect = (rowIdx: number, columnKey: keyof R, rowData: R, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const { rowSelection } = this.props;

    if (this.useNewRowSelection()) {
      if (rowSelection && rowSelection.enableShiftSelect === true) {
        if (!this.handleShiftSelect(rowIdx)) {
          this.handleNewRowSelect(rowIdx, rowData);
        }
      } else {
        this.handleNewRowSelect(rowIdx, rowData);
      }
    } else {
      // Fallback to old onRowSelect handler
      const selectedRows = this.props.enableRowSelect === 'single' ? [] : [...this.state.selectedRows];
      const selectedRow = this.getSelectedRow(selectedRows, rowData[this.props.rowKey]);
      if (selectedRow) {
        selectedRow.isSelected = !selectedRow.isSelected;
      } else {
        (rowData as SelectedRow<R>).isSelected = true;
        selectedRows.push(rowData as SelectedRow<R>);
      }
      this.setState({ selectedRows });
      if (this.props.onRowSelect) {
        this.props.onRowSelect(selectedRows.filter(r => r.isSelected === true));
      }
    }
  };

  handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allRowsSelected = e.currentTarget.checked;
    const { rowSelection } = this.props;
    if (rowSelection && this.useNewRowSelection()) {
      const { keys, indexes, isSelectedKey } = rowSelection.selectBy as { [key: string]: unknown };

      if (allRowsSelected && typeof rowSelection.onRowsSelected === 'function') {
        const selectedRows = [];
        for (let i = 0; i < this.props.rowsCount; i++) {
          const rowData = this.props.rowGetter(i);
          if (!isRowSelectedForRDG(keys, indexes, isSelectedKey, rowData, i)) {
            selectedRows.push({ rowIdx: i, row: rowData });
          }
        }

        if (selectedRows.length > 0) {
          rowSelection.onRowsSelected(selectedRows);
        }
      } else if (!allRowsSelected && typeof rowSelection.onRowsDeselected === 'function') {
        const deselectedRows = [];
        for (let i = 0; i < this.props.rowsCount; i++) {
          const rowData = this.props.rowGetter(i);
          if (isRowSelectedForRDG(keys, indexes, isSelectedKey, rowData, i)) {
            deselectedRows.push({ rowIdx: i, row: rowData });
          }
        }

        if (deselectedRows.length > 0) {
          rowSelection.onRowsDeselected(deselectedRows);
        }
      }
    } else {
      const selectedRows: SelectedRow<R>[] = [];
      for (let i = 0; i < this.props.rowsCount; i++) {
        const row = { ...this.props.rowGetter(i), isSelected: allRowsSelected };
        selectedRows.push(row);
      }
      this.setState({ selectedRows });
      if (typeof this.props.onRowSelect === 'function') {
        this.props.onRowSelect(selectedRows.filter(r => r.isSelected === true));
      }
    }
  };

  /** 计算所有表头行的高度和，包括过滤器行 */
  getRowOffsetHeight(): number {
    return this.getHeaderRows().reduce((offsetHeight, row) => {
      // offsetHeight += row.height;
      // return offsetHeight;
      return offsetHeight + row.height;
    }, 0);
  }

  /** 创建所有表头行的属性，这里会组装表头行过滤器的事件处理函数 */
  getHeaderRows() {
    const { headerRowHeight, rowHeight, onAddFilter, headerFiltersHeight, superHeaders } = this.props;
    const rows: HeaderRowData<R>[] = [];
    // 若包含多级表头行
    if (superHeaders) {
      rows.push({
        rowType: HeaderRowType.SUPER,
        columns: superHeaders,
        height: headerRowHeight || rowHeight,
      });
    }
    // 添加一个普通表头行
    rows.push({ height: headerRowHeight || rowHeight, rowType: HeaderRowType.HEADER });
    // 若包含过滤器表头行，过滤器行默认高度45
    if (this.state.canFilter === true) {
      rows.push({
        filterable: true,
        rowType: HeaderRowType.FILTER,
        onFilterChange: onAddFilter,
        height: headerFiltersHeight,
      });
    }
    return rows;
  }

  getRowSelectionProps() {
    return this.props.rowSelection && this.props.rowSelection.selectBy;
  }

  getSelectedRows() {
    if (this.props.rowSelection) {
      // return;
      return null;
    }

    return this.state.selectedRows.filter(r => r.isSelected === true);
  }

  /** 通过调用this.selectCell()打开单元格编辑器 */
  openCellEditor(rowIdx: number, idx: number) {
    this.selectCell({ rowIdx, idx }, true);
  }

  scrollToColumn(colIdx: number) {
    this.eventBus.dispatch(EventTypes.SCROLL_TO_COLUMN, colIdx);
  }

  /**
   * 计算列配置信息并缓存，每次window的resize事件都会调用
   * @param props 组件的this.props
   */
  setupGridColumns(props = this.props): ColumnList<R> {
    const { columns } = props;
    if (this._cachedColumns === columns) {
      // return this._cachedComputedColumns!;
      return this._cachedComputedColumns;
    }

    this._cachedColumns = columns;

    // 这里得到的可能是undefined
    const rowSelectionEnabled =
      this.props.rowActionsCell ||
      (props.enableRowSelect && !this.props.rowSelection) ||
      (props.rowSelection && props.rowSelection.showCheckbox !== false);
    // console.log('rowSelectionEnabled, ', rowSelectionEnabled);
    if (rowSelectionEnabled) {
      const SelectAllComponent = this.props.selectAllRenderer;

      let headerRenderer: JSX.Element;
      if (props.enableRowSelect !== 'single') {
        headerRenderer = <SelectAllComponent onChange={this.handleCheckboxChange} ref={this.selectAllCheckbox} />;
      }

      const Formatter = ((this.props.rowActionsCell
        ? this.props.rowActionsCell
        : CheckboxEditor) as unknown) as React.ComponentClass<{ rowSelection: unknown }>;

      const selectColumn = ({
        key: 'select-row',
        name: '',
        formatter: <Formatter rowSelection={this.props.rowSelection} />,
        onCellChange: this.handleRowSelect,
        filterable: false,
        headerRenderer,
        width: 60,
        frozen: true,
        getRowMetaData: (rowData: R) => rowData,
        cellClass: this.props.rowActionsCell ? 'rdg-row-actions-cell' : '',
      } as unknown) as Column<R>;

      this._cachedComputedColumns = Array.isArray(columns) ? [selectColumn, ...columns] : null;
    } else {
      // if rowSelectionEnabled false

      this._cachedComputedColumns = columns.slice() as ColumnList<R>;
    }

    // console.log('this._cachedComputedColumns, ', this._cachedComputedColumns);

    return this._cachedComputedColumns;
  }

  /**
   * 每次render都会调用gridWidth()重新计算整个列表的宽度
   */
  render() {
    console.log('====props4 RDGrid');
    console.log(this.props);
    // console.log(this.state);

    // cellMetaData包含了单元格操作相关事件
    const cellMetaData: CellMetaData<R> = {
      rowKey: this.props.rowKey,
      onCellClick: this.handleCellClick,
      onCellDoubleClick: this.handleCellDoubleClick,
      onCellExpand: this.props.onCellExpand,
      onCellContextMenu: this.handleCellContextMenu,
      getCellActions: this.props.getCellActions,
      onRowExpandToggle: this.props.onRowExpandToggle,
      onAddSubRow: this.props.onAddSubRow,
      onDeleteSubRow: this.props.onDeleteSubRow,
      onDragEnter: this.handleDragEnter,
    };
    // 默认不传递mousedown和mouseenter事件处理函数，单元格组件相应方法就为空方法
    if (this.props.cellRangeSelection) {
      cellMetaData.onCellMouseDown = this.handleCellMouseDown;
      cellMetaData.onCellMouseEnter = this.handleCellMouseEnter;
    }

    // interactionMasksMetaData包含了活跃单元格操作的事件，如提交单元格编辑器的值
    const interactionMasksMetaData: InteractionMasksMetaData<R> = {
      onCheckCellIsEditable: this.props.onCheckCellIsEditable,
      onCellCopyPaste: this.props.onCellCopyPaste,
      onCellSelected: this.props.onCellSelected,
      onCellDeSelected: this.props.onCellDeSelected,
      onCellRangeSelectionStarted: this.props.cellRangeSelection && this.props.cellRangeSelection.onStart,
      onCellRangeSelectionUpdated: this.props.cellRangeSelection && this.props.cellRangeSelection.onUpdate,
      onCellRangeSelectionCompleted: this.props.cellRangeSelection && this.props.cellRangeSelection.onComplete,
      onCommit: this.handleCommit,
      onGridRowsUpdated: this.handleGridRowsUpdated,
      onDragHandleDoubleClick: this.handleDragHandleDoubleClick,
    };

    // 获取本组件父元素宽度，考虑到生命周期顺序，gridWidth()在首次调用时本组件未加载会返回0
    let containerWidth: string | number = this.props.minWidth || this.gridWidth();
    // grid自身宽度，默认与父元素等宽
    let gridWidth: string | number = containerWidth;
    // 若grid在display-none的div中，如bootstrap的tabs和collapses，宽度可能未正确初始化，这里补充处理，设置为100%
    if (Number.isNaN(containerWidth) || containerWidth === 0) {
      containerWidth = '100%';
      gridWidth = '100%';
    }
    // console.log('containerWidth, ', containerWidth);

    return (
      <div
        className='react-grid-Container rdg-outmost-style-placeholder'
        style={{ width: containerWidth }}
        ref={this.grid}
      >
        {/* 表格顶部之外的工具栏，可放置开关切换过滤器 */}
        <ToolbarContainer<R>
          toolbar={this.props.toolbar}
          columns={this.props.columns}
          rowsCount={this.props.rowsCount}
          onToggleFilter={this.handleToggleFilter}
        />

        {/* 只剩余一个组件，表格主体 */}
        <Grid<R>
          ref={this.base}
          columnMetrics={this.state.columnMetrics}
          onColumnResize={this.handleColumnResize}
          sortColumn={this.state.sortColumn}
          sortDirection={this.state.sortDirection}
          onSort={this.handleSort}
          minHeight={this.props.minHeight}
          totalWidth={gridWidth}
          rowKey={this.props.rowKey}
          rowHeight={this.props.rowHeight}
          rowsCount={this.props.rowsCount}
          rowGetter={this.props.rowGetter}
          rowRenderer={this.props.rowRenderer}
          rowGroupRenderer={this.props.rowGroupRenderer}
          RowsContainer={this.props.RowsContainer}
          rowSelection={this.getRowSelectionProps()}
          rowOffsetHeight={this.getRowOffsetHeight()}
          getSubRowDetails={this.props.getSubRowDetails}
          emptyRowsView={this.props.emptyRowsView}
          selectedRows={this.getSelectedRows()}
          headerRows={this.getHeaderRows()}
          cellMetaData={cellMetaData}
          cellNavigationMode={this.props.cellNavigationMode}
          enableCellSelect={this.props.enableCellSelect}
          enableCellAutoFocus={this.props.enableCellAutoFocus}
          getValidFilterValues={this.props.getValidFilterValues}
          draggableHeaderCell={this.props.draggableHeaderCell}
          onHeaderDrop={this.props.onHeaderDrop}
          contextMenu={this.props.contextMenu}
          eventBus={this.eventBus}
          interactionMasksMetaData={interactionMasksMetaData}
          onViewportKeydown={this.handleViewportKeyDown}
          onViewportKeyup={this.handleViewportKeyUp}
          onScroll={this.props.onScroll}
          scrollToRowIndex={this.props.scrollToRowIndex}
          editorPortalTarget={this.props.editorPortalTarget}
        />
      </div>
    );
  }
}

// export type ReactDataGridProps<R extends {}> = JSX.LibraryManagedAttributes<typeof ReactDataGrid, DataGridProps<R>>;
