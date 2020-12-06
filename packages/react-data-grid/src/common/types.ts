import { KeyboardEvent, ReactNode } from 'react';
import { HeaderRowType, UpdateActions } from './enums';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type SelectedRow<TRow> = TRow & { isSelected: boolean };

/**
 * 列类型包含的属性
 */
interface ColumnValue<TRow, TDependentValue = unknown, TField extends keyof TRow = keyof TRow> {
  /** Name of the column. By default it will be displayed in the header cell. */
  name: string;
  /** A unique key to distinguish each column */
  key: TField;
  /** Column width. If not specified, it will be determined automatically based on grid width and specified widths of other columns */
  width?: number;
  /** 是否隐藏该列 */
  hidden?: boolean;
  /** 该列支持的样式 */
  cellClass?: string;
  /** By adding an event object with callbacks for the native react events you can bind events to a specific column. That will not break the default behaviour of the grid and will run only for the specified column */
  events?: {
    [key: string]: undefined | ((e: Event, info: ColumnEventInfo<TRow>) => void);
  };
  /** Formatter to be used to render the cell content */
  formatter?: React.ReactElement | React.ComponentType<FormatterProps<TRow[TField], TDependentValue, TRow>>;
  /** Enables cell editing. If set and no editor property specified, then a textinput will be used as the cell editor */
  editable?: boolean | ((rowData: TRow) => boolean);
  /** Enable dragging of a column */
  draggable?: boolean;
  /** Enable filtering of a column */
  filterable?: boolean;
  /** Determines whether column is frozen or not */
  frozen?: boolean;
  /** Enable resizing of a column */
  resizable?: boolean;
  /** Enable sorting of a column */
  sortable?: boolean;
  /** Sets the column sort order to be descending instead of ascending the first time the column is sorted */
  sortDescendingFirst?: boolean;
  /** Editor to be rendered when cell of column is being edited. If set, then the column is automatically set to be editable */
  editor?: React.ReactElement | React.ComponentType<EditorProps<TRow[TField], TDependentValue, TRow>>;
  /** Header renderer for each header cell */
  headerRenderer?: React.ReactElement | React.ComponentType<HeaderRowProps<TRow>>;
  /** Component to be used to filter the data of the column */
  filterRenderer?: React.ComponentType<FilterRendererProps<TRow, TDependentValue>>;

  // TODO: these props are only used by checkbox editor and we should remove them
  onCellChange?(rowIdx: number, key: keyof TRow, dependentValues: TDependentValue, event: React.SyntheticEvent): void;
  getRowMetaData?(rowData: TRow, column: CalculatedColumn<TRow, TDependentValue>): TDependentValue;
}

/**
 * 列类型的定义
 */
export type Column<TRow, TDependentValue = unknown, TField extends keyof TRow = keyof TRow> = TField extends keyof TRow
  ? ColumnValue<TRow, TDependentValue, TField>
  : never;

/** 包含各列类型定义的数组 */
export type ColumnList<TRow> = Column<TRow>[];

export type CalculatedColumn<TRow, TDependentValue = unknown, TField extends keyof TRow = keyof TRow> = Column<
  TRow,
  TDependentValue,
  TField
> & {
  idx: number;
  width: number;
  left: number;
};

/** 列字段信息及宽度相关配置 */
export interface ColumnMetrics<TRow> {
  columns: CalculatedColumn<TRow>[];
  width: number;
  totalWidth: number;
  minColumnWidth: number;
  totalColumnWidth: number;
}

export interface RowData {
  name?: string;
  get?(key: PropertyKey): unknown;
  __metaData?: RowGroupMetaData;
}

/** cell单元格包含的事件类型 */
export interface CellMetaData<TRow> {
  rowKey: keyof TRow;
  onCellClick(position: Position): void;
  onCellDoubleClick(position: Position): void;
  onCellMouseDown?(position: Position): void;
  onCellMouseEnter?(position: Position): void;
  onCellExpand?(options: SubRowOptions<TRow>): void;
  onRowExpandToggle?(e: RowExpandToggleEvent): void;
  onAddSubRow?(): void;
  onDeleteSubRow?(options: SubRowOptions<TRow>): void;
  onCellContextMenu(position: Position): void;
  onDragEnter(overRowIdx: number): void;
  getCellActions?(column: CalculatedColumn<TRow>, rowData: TRow): CellActionButton[] | undefined;
}

/** 单元格位置坐标的类型，列号和行号都为整数 */
export interface Position {
  /** 列索引号 */
  idx: number;
  /** 行索引号 */
  rowIdx: number;
}

export interface Range {
  topLeft: Position;
  bottomRight: Position;
}

export interface SelectedRange extends Range {
  startCell: Position | null;
  cursorCell: Position | null;
  isDragging: boolean;
}

export interface Dimension {
  width: number;
  height: number;
  top: number;
  left: number;
  zIndex: number;
}

export type RowGetter<TRow> = (rowIdx: number) => TRow;

export interface Editor<TValue = never> extends React.Component {
  getInputNode(): Element | Text | undefined | null;
  getValue(): TValue;
  hasResults?(): boolean;
  isSelectOpen?(): boolean;
  validate?(value: unknown): boolean;
  readonly disableContainerStyles?: boolean;
}

export interface FormatterProps<TValue, TDependentValue = unknown, TRow = any> {
  rowIdx: number;
  value: TValue;
  column: CalculatedColumn<TRow, TDependentValue>;
  row: TRow;
  isScrolling: boolean;
  dependentValues?: TDependentValue;
}

export interface EditorProps<TValue, TDependentValue = unknown, TRow = any> {
  column: CalculatedColumn<TRow, TDependentValue>;
  value: TValue;
  rowMetaData?: TDependentValue;
  rowData: TRow;
  height: number;
  onCommit(args?: { key?: string }): void;
  onCommitCancel(): void;
  onBlur(): void;
  onOverrideKeyDown(e: KeyboardEvent): void;
}

export interface HeaderRowProps<TRow> {
  column: CalculatedColumn<TRow>;
  rowType: HeaderRowType;
}

/** Cell组件的主要props类型 */
export interface CellRendererProps<TRow, TValue = unknown> {
  idx: number;
  rowIdx: number;
  column: CalculatedColumn<TRow>;
  height: number;
  value: TValue;
  rowData: TRow;
  cellMetaData: CellMetaData<TRow>;
  isScrolling: boolean;
  scrollLeft: number;
  isRowSelected?: boolean;
  expandableOptions?: ExpandableOptions;
  lastFrozenColumnIndex?: number;
}

/**
 * Row组件的props类型，还会继承RowRenderer接口
 */
export interface RowRendererProps<TRow> {
  /** height of the row in pixels, 默认35 */
  height: number;
  /** Array of columns to render */
  columns: CalculatedColumn<TRow>[];
  /** js object represeting row data */
  row: TRow;
  /** 单元格组件，默认使用Cell，可自定义 */
  cellRenderer?: React.ComponentType<CellRendererProps<TRow>>;
  /** Object used to listen for cell events */
  cellMetaData: CellMetaData<TRow>;
  /** index of the row in the grid */
  idx: number;
  /** Space separated list of extra css classes to apply to row */
  extraClasses?: string;
  /**   */
  subRowDetails?: SubRowDetails;
  colOverscanStartIdx: number;
  /** index of the last overscan column on the grid */
  colOverscanEndIdx: number;
  /** Flag to determine whether the grid is being scrolled */
  isScrolling: boolean;
  /** Flag to determine whether row is selected or not */
  isSelected?: boolean;
  /** scrollLeft in pixels */
  scrollLeft: number;
  /** Index of last frozen column index */
  lastFrozenColumnIndex?: number;
}

export interface FilterRendererProps<TRow, TFilterValue = unknown> {
  column: CalculatedColumn<TRow>;
  onChange?(event: AddFilterEvent<TRow>): void;
  /** TODO: remove */
  getValidFilterValues?(columnKey: keyof TRow): TFilterValue;
}

export interface SubRowDetails<TChildRow = unknown> {
  canExpand: boolean;
  field: string;
  expanded: boolean;
  children: TChildRow[];
  treeDepth: number;
  siblingIndex: number;
  numberSiblings: number;
  group?: boolean;
}

export interface SubRowOptions<TRow, TChildRow = unknown> {
  rowIdx: number;
  idx: number;
  rowData: TRow;
  expandArgs?: ExpandableOptions<TChildRow>;
}

export interface ExpandableOptions<TChildRow = unknown> {
  canExpand: boolean;
  field: string;
  expanded: boolean;
  children: TChildRow[];
  treeDepth: number;
  subRowDetails: SubRowDetails;
}

interface Action {
  text: ReactNode;
  callback(): void;
}

export interface CellActionButton {
  icon: ReactNode;
  actions?: Action[];
  callback?(): void;
}

export interface ColumnEventInfo<TRow> extends Position {
  rowId: unknown;
  column: CalculatedColumn<TRow>;
}

/** Cell组件支持的方法，仅包含setScrollLeft() */
export interface CellRenderer {
  setScrollLeft(scrollLeft: number): void;
}

/**
 * Row组件支持的事件
 */
export interface RowRenderer<TRow> {
  setScrollLeft(scrollLeft: number): void;
  getRowTop?(): number;
  getRowHeight?(): number;
  getDecoratedComponentInstance?(
    idx: number,
  ): { row: RowRenderer<TRow> & React.Component<RowRendererProps<TRow>> } | undefined;
}

export interface ScrollPosition {
  scrollLeft: number;
  scrollTop: number;
}

/**
 * InteractionMasks包含的属性类型，全是交互型事件，主要是关于单元格的事件
 */
export interface InteractionMasksMetaData<TRow> {
  onCheckCellIsEditable?(e: CheckCellIsEditableEvent<TRow>): boolean;
  onCellCopyPaste?(e: CellCopyPasteEvent<TRow>): void;
  onCellSelected?(position: Position): void;
  onCellDeSelected?(position: Position): void;
  onCellRangeSelectionStarted?(selectedRange: SelectedRange): void;
  onCellRangeSelectionUpdated?(selectedRange: SelectedRange): void;
  onCellRangeSelectionCompleted?(selectedRange: SelectedRange): void;
  onCommit(e: CommitEvent<TRow>): void;
  onDragHandleDoubleClick(data: Position & { rowData: TRow }): void;
  onGridRowsUpdated(
    cellKey: keyof TRow,
    toRow1: number,
    toRow2: number,
    data: { [key: string]: unknown }, // FIX ME: Use Pick<R, K>
    updateAction: UpdateActions,
    fromRow?: number,
  ): void;
}

export interface RowGroupMetaData {
  isGroup: boolean;
  treeDepth: number;
  isExpanded: boolean;
  columnGroupName: string;
  columnGroupDisplayName: string;
  getRowRenderer?(props: unknown, rowIdx: number): React.ReactElement;
}

export type RowSelection =
  | { indexes?: number[] }
  | { isSelectedKey?: string }
  | { keys?: { values: unknown[]; rowKey: string } };

export interface HeaderRowData<TRow> {
  rowType: HeaderRowType;
  height: number;
  filterable?: boolean;
  onFilterChange?(args: AddFilterEvent<TRow>): void;
  /** 用于实现分组表头 */
  columns?: any[];
}

export interface AddFilterEvent<TRow> {
  filterTerm: string;
  column: Column<TRow>;
}

export interface CommitEvent<TRow, TUpdatedValue = never> {
  cellKey: keyof TRow;
  rowIdx: number;
  updated: TUpdatedValue;
  key?: string;
}

export interface RowExpandToggleEvent {
  rowIdx: number;
  shouldExpand: boolean;
  columnGroupName: string;
  name: string;
}

export interface GridRowsUpdatedEvent<TRow, TUpdatedValue = never> {
  cellKey: keyof TRow;
  fromRow: number;
  toRow: number;
  fromRowId: unknown;
  toRowId: unknown;
  rowIds: unknown[];
  updated: TUpdatedValue;
  action: UpdateActions;
  fromRowData: TRow;
}

export interface CellCopyPasteEvent<TRow> {
  cellKey: keyof TRow;
  rowIdx: number;
  fromRow: number;
  toRow: number;
  value: unknown;
}

export interface CheckCellIsEditableEvent<TRow> extends Position {
  row: TRow;
  column: CalculatedColumn<TRow>;
}

export interface RowSelectionParams<TRow> {
  rowIdx: number;
  row: TRow;
}
