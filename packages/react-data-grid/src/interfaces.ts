import React from 'react';
import { ToolbarProps } from './ToolbarContainer';
import { CheckboxEditorProps } from './common/editors/CheckboxEditor';
import { SelectAll } from './formatters';
import { RowsContainerProps } from './RowsContainer';
import { EventBus } from './masks';
import { CellNavigationMode, DEFINE_SORT, SCROLL_DIRECTION } from './common/enums';
import {
  AddFilterEvent,
  CalculatedColumn,
  CellActionButton,
  CellCopyPasteEvent,
  CellMetaData,
  CheckCellIsEditableEvent,
  Column,
  ColumnList,
  ColumnMetrics,
  GridRowsUpdatedEvent,
  HeaderRowData,
  InteractionMasksMetaData,
  Position,
  RowExpandToggleEvent,
  RowGetter,
  RowSelection,
  RowSelectionParams,
  SelectedRange,
  SubRowDetails,
  SubRowOptions,
  SelectedRow,
  RowRendererProps,
} from './common/types';

/**
 * ReactDataGrid组件的props类型，必需属性只有3个：columns, rowGetter, rowsCount
 */
export interface DataGridProps<R extends {}> {
  // about column
  /** An array of objects representing each column on the grid. Required. */
  columns: ColumnList<R> | any[];
  /** The key of the column which is currently being sorted */
  sortColumn?: keyof R;
  /** The direction to sort the sortColumn */
  sortDirection?: DEFINE_SORT;
  /** 判断两列内容是否相等的方法 */
  columnEquality(c1: Column<R>, c2: Column<R>): boolean;
  /** Called when a column is resized */
  onColumnResize?(idx: number, width: number): void;
  /** Minimum column width in pixels，每列最小宽度，默认80 */
  minColumnWidth: number;
  /** The minimum width of the grid in pixels，表格最小宽度 */
  minWidth?: number;
  /** The minimum height of the grid in pixels，表格最小高度，默认350，超过此高度会开始滚动 */
  minHeight: number;

  // about row
  /** The height of each row in pixels，默认行高为35 */
  rowHeight: number;
  /** The primary key property of each row */
  rowKey: keyof R;
  /** A function called for each rendered row that should return a plain key/value pair object. Required. */
  rowGetter: RowGetter<R>;
  /** The number of rows to be rendered. Required. */
  rowsCount: number;
  rowRenderer?: React.ReactElement | React.ComponentType<RowRendererProps<R>>;
  rowGroupRenderer?: React.ComponentType;
  /** Custom checkbox formatter */
  rowActionsCell?: React.ComponentType<CheckboxEditorProps<R>>;
  RowsContainer?: React.ComponentType<RowsContainerProps>;
  emptyRowsView?: React.ComponentType<{}>;
  /** Deprecated: Legacy prop to turn on row selection. Use rowSelection props instead，默认false */
  enableRowSelect: boolean | string;
  /** 选择所有行时表头行要渲染的组件，Component to render the UI in the header row for selecting all rows */
  selectAllRenderer: React.ComponentType<React.ComponentProps<typeof SelectAll>>;
  rowSelection?: {
    enableShiftSelect?: boolean;
    /** Function called whenever rows are selected */
    onRowsSelected?(args: RowSelectionParams<R>[]): void;
    /** Function called whenever rows are deselected */
    onRowsDeselected?(args: RowSelectionParams<R>[]): void;
    /** toggle whether to show a checkbox in first column to select rows */
    showCheckbox?: boolean;
    /** Method by which rows should be selected */
    selectBy: RowSelection;
  };
  /** 选择一行的事件处理函数 */
  onRowSelect?(rowData: R[]): void;
  /** Function called whenever row is clicked */
  onRowClick?(rowIdx: number, rowData: R, column: CalculatedColumn<R>): void;
  /** Function called whenever row is double clicked */
  onRowDoubleClick?(rowIdx: number, rowData: R, column: CalculatedColumn<R>): void;
  /** 行折叠展开的事件监听器函数 */
  onRowExpandToggle?(event: RowExpandToggleEvent): void;
  /** 获取行中子组件的内容 */
  getSubRowDetails?(row: R): SubRowDetails;
  /** Called whenever a sub row is added to the grid */
  onAddSubRow?(): void;
  /** Called whenever a sub row is deleted from the grid */
  onDeleteSubRow?(options: SubRowOptions<R>): void;

  // about cell
  /** Used to toggle whether cells can be selected or not, default false */
  enableCellSelect: boolean;
  /** Toggles whether cells should be autofocused，默认true */
  enableCellAutoFocus: boolean;
  /** 单元格导航模式，默认NONE，可选CHANGE_ROW，LOOP_OVER_ROW */
  cellNavigationMode: CellNavigationMode;
  /** 选择多个单元格的回调函数 */
  cellRangeSelection?: {
    onStart(selectedRange: SelectedRange): void;
    onUpdate?(selectedRange: SelectedRange): void;
    onComplete?(selectedRange: SelectedRange): void;
  };
  /** Function called whenever a cell has been expanded */
  onCellExpand?(options: SubRowOptions<R>): void;
  /** InteractionMasksMetaData */
  /** Deprecated: Function called when grid is updated via a copy/paste. Use onGridRowsUpdated instead */
  onCellCopyPaste?(event: CellCopyPasteEvent<R>): void;
  /** Function called whenever a cell is selected */
  onCellSelected?(position: Position): void;
  /** Function called whenever a cell is deselected */
  onCellDeSelected?(position: Position): void;
  /** called before cell is set active, returns a boolean to determine whether cell is editable */
  onCheckCellIsEditable?(event: CheckCellIsEditableEvent<R>): boolean;
  /** CellMetaData */
  getCellActions?(column: CalculatedColumn<R>, rowData: R): CellActionButton[] | undefined;
  /** Component used to render a draggable header cell */
  draggableHeaderCell?: React.ComponentType<{ column: CalculatedColumn<R>; onHeaderDrop(): void }>;

  // about header
  /** The height of the header row in pixels */
  headerRowHeight?: number;
  /** The height of the header filter row in pixels，过滤器行的高度默认45 */
  headerFiltersHeight: number;
  onHeaderDrop?(): void;
  /** Component used to render toolbar above the grid */
  toolbar?: React.ReactElement<ToolbarProps<R>> | React.ComponentType<ToolbarProps<R>>;
  /** 添加或移除过滤器的事件处理器 */
  onAddFilter?(event: AddFilterEvent<R>): void;
  /** 清除过滤器 */
  onClearFilters?(): void;
  /** 支持分组表头 */
  superHeaders?: any[];

  // about whole grid
  /** Function called whenever grid is sorted */
  onGridSort?(columnKey: keyof R, direction: DEFINE_SORT): void;
  /** Function called whenever keyboard key is released */
  onGridKeyUp?(event: React.KeyboardEvent<HTMLDivElement>): void;
  /** Function called whenever keyboard key is pressed down */
  onGridKeyDown?(event: React.KeyboardEvent<HTMLDivElement>): void;
  /**
   * Callback called whenever row data is updated.
   * When editing is enabled, this callback will be called for the following scenarios.
   * 1. Using the supplied editor of the column. The default editor is the SimpleTextEditor.
   * 2. Copy/pasting the value from one cell to another <kbd>CTRL</kbd>+<kbd>C</kbd>, <kbd>CTRL</kbd>+<kbd>V</kbd>
   * 3. Update multiple cells by dragging the fill handle of a cell up or down to a destination cell.
   * 4. Update all cells under a given cell by double clicking the cell's fill handle.
   */
  onGridRowsUpdated?<E extends GridRowsUpdatedEvent<R>>(event: E): void;
  /** Called when the grid is scrolled */
  onScroll?(scrollState: ScrollState): void;
  /** When set, grid will scroll to this row index */
  scrollToRowIndex?: number;
  /** 根据过滤条件选出源数据中符合条件的行的数组 */
  getValidFilterValues?(columnKey: keyof R): unknown;
  /** The node where the editor portal should mount，默认document.body */
  editorPortalTarget: Element;
  /** Component used to render a context menu. react-data-grid-addons provides a default context menu which may be used */
  contextMenu?: React.ReactElement;
}

/** ReactDataGrid组件的state类型 */
export interface DataGridState<R> {
  /** 列基本配置 */
  columnMetrics: ColumnMetrics<R>;
  /** 上次选中过的行索引号，默认-1 */
  lastRowIdxUiSelected: number;
  /** 选中的行信息 */
  selectedRows: SelectedRow<R>[];
  /** 是否能过滤，默认false */
  canFilter?: boolean;
  /** 当前排序的列的key */
  sortColumn?: keyof R;
  /** 列排序的顺序：ASC、DESC、NONE */
  sortDirection?: DEFINE_SORT;
}

/**
 * Grid组件的props类型，从DataGridProps和DataGridState中挑选部分属性，再加上下面的新属性
 */
export interface GridProps<R> extends SharedDataGridProps<R>, SharedDataGridState<R> {
  /** 列改变大小的事件处理函数 */
  onColumnResize(idx: number, width: number): void;
  /** 列排序的事件处理函数 */
  onSort(columnKey: keyof R, sortDirection: DEFINE_SORT): void;
  /** grid总宽度，此属性不直接在ReactDataGrid组件设置 */
  totalWidth: number | string;
  /** 行高 */
  rowOffsetHeight: number;
  /** 选择的行范围及数据 */
  rowSelection?: RowSelection;
  /** 选中的行 */
  selectedRows?: SelectedRow<R>[];
  /** 单元格关于事件处理函数的元信息 */
  cellMetaData: CellMetaData<R>;
  /** 表头行 */
  headerRows: HeaderRowData<R>[];
  /** 按下键盘开始时的事件处理函数 */
  onViewportKeydown(e: React.KeyboardEvent<HTMLDivElement>): void;
  /** 按下键盘结束时的事件处理函数 */
  onViewportKeyup(e: React.KeyboardEvent<HTMLDivElement>): void;
  /** 交互类事件处理的数据中心对象 */
  eventBus: EventBus;
  /** 处理交互类事件的中间层 */
  interactionMasksMetaData: InteractionMasksMetaData<R>;
}

type SharedDataGridProps<R> = Pick<
  DataGridProps<R>,
  | 'rowKey'
  | 'draggableHeaderCell'
  | 'getValidFilterValues'
  | 'rowGetter'
  | 'rowsCount'
  | 'rowHeight'
  | 'rowRenderer'
  | 'rowGroupRenderer'
  | 'minHeight'
  | 'scrollToRowIndex'
  | 'contextMenu'
  | 'enableCellSelect'
  | 'enableCellAutoFocus'
  | 'cellNavigationMode'
  | 'onScroll'
  | 'RowsContainer'
  | 'emptyRowsView'
  | 'onHeaderDrop'
  | 'getSubRowDetails'
  | 'editorPortalTarget'
>;
type SharedDataGridState<R> = Pick<DataGridState<R>, 'columnMetrics' | 'sortColumn' | 'sortDirection'>;

/** 与滚动相关的行列索引位置 */
export interface ScrollState {
  height: number;
  scrollTop: number;
  scrollLeft: number;
  rowVisibleStartIdx: number;
  rowVisibleEndIdx: number;
  rowOverscanStartIdx: number;
  rowOverscanEndIdx: number;
  colVisibleStartIdx: number;
  colVisibleEndIdx: number;
  colOverscanStartIdx: number;
  colOverscanEndIdx: number;
  scrollDirection: SCROLL_DIRECTION;
  lastFrozenColumnIndex: number;
  isScrolling: boolean;
}
