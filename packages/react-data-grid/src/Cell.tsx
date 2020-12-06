import React from 'react';
import classNames from 'classnames';
import { SubRowOptions, ColumnEventInfo, CellRenderer, CellRendererProps } from './common/types';
import { isFrozen } from './utils/columnUtils';
import CellActions from './cell/CellActions';
import CellContent from './cell/CellContent';
import CellExpander from './cell/CellExpander';

function getSubRowOptions<R>({ rowIdx, idx, rowData, expandableOptions: expandArgs }: CellProps<R>): SubRowOptions<R> {
  return { rowIdx, idx, rowData, expandArgs };
}

export interface CellProps<R> extends CellRendererProps<R> {
  // TODO: Check if these props are required or not. These are most likely set by custom cell renderer
  className?: string;
  tooltip?: string | null;
  cellControls?: unknown;
}

/**
 * Cell单元格组件，包括CellActions,CellExpander,CellContent
 */
export default class Cell<R> extends React.PureComponent<CellProps<R>> implements CellRenderer {
  /** Cell默认初始值 */
  static defaultProps = {
    value: '',
  };

  /** ref-cell */
  cell = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.checkScroll();
  }

  componentDidUpdate(prevProps: CellProps<R>) {
    if (isFrozen(prevProps.column) && !isFrozen(this.props.column)) {
      this.removeScroll();
    }
  }

  handleCellClick = () => {
    // console.log('====Cell-handleCellClick');

    const { idx, rowIdx, cellMetaData } = this.props;
    cellMetaData.onCellClick({ idx, rowIdx });
  };

  handleCellDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // console.log('====Cell-handleCellDoubleClick');

    e.stopPropagation();
    const { idx, rowIdx, cellMetaData } = this.props;
    cellMetaData.onCellDoubleClick({ idx, rowIdx });
  };

  handleCellMouseDown = () => {
    // console.log('====Cell-handleCellMouseDown');

    const { idx, rowIdx, cellMetaData } = this.props;
    if (cellMetaData.onCellMouseDown) {
      cellMetaData.onCellMouseDown({ idx, rowIdx });
    }
  };

  /** 鼠标经过单元格时会触发的事件，一直在同一个单元格内则只出发一次 */
  handleCellMouseEnter = () => {
    // console.log('====Cell-handleCellMouseEnter');

    const { idx, rowIdx, cellMetaData } = this.props;
    if (cellMetaData.onCellMouseEnter) {
      cellMetaData.onCellMouseEnter({ idx, rowIdx });
    }
  };

  handleCellContextMenu = () => {
    const { idx, rowIdx, cellMetaData } = this.props;
    cellMetaData.onCellContextMenu({ idx, rowIdx });
  };

  handleCellExpand = () => {
    const { onCellExpand } = this.props.cellMetaData;
    if (onCellExpand) {
      onCellExpand(getSubRowOptions(this.props));
    }
  };

  handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  /** 获取单元格最重要的3个样式,width,height,left */
  getStyle(): React.CSSProperties {
    return {
      width: this.props.column.width,
      height: this.props.height,
      left: this.props.column.left,
    };
  }

  getCellClassName() {
    const { idx, column, lastFrozenColumnIndex, isRowSelected, tooltip, expandableOptions } = this.props;
    return classNames(column.cellClass, 'react-grid-Cell', this.props.className, {
      'react-grid-Cell--frozen': isFrozen(column),
      'rdg-last--frozen': lastFrozenColumnIndex === idx,
      'row-selected': isRowSelected,
      'has-tooltip': !!tooltip,
      'rdg-child-cell': expandableOptions && expandableOptions.subRowDetails && expandableOptions.treeDepth > 0,
    });
  }

  checkScroll() {
    const { scrollLeft, column } = this.props;
    const node = this.cell.current;
    if (isFrozen(column) && node && node.style.transform !== null && node.style.transform !== undefined) {
      this.setScrollLeft(scrollLeft);
    }
  }

  setScrollLeft(scrollLeft: number) {
    const node = this.cell.current;
    if (node) {
      node.style.transform = `translateX(${scrollLeft}px)`;
    }
  }

  removeScroll() {
    const node = this.cell.current;
    if (node) {
      node.style.transform = 'none';
    }
  }

  /** 创建一个对象并返回，该对象包含cell支持的所有事件处理函数作为属性 */
  getEvents() {
    const { column, cellMetaData, idx, rowIdx, rowData } = this.props;
    const columnEvents = column.events;

    // 包含cell支持的所有事件的对象
    const allEvents: { [key: string]: Function } = {
      onClick: this.handleCellClick,
      onMouseDown: this.handleCellMouseDown,
      onMouseEnter: this.handleCellMouseEnter,
      onDoubleClick: this.handleCellDoubleClick,
      onContextMenu: this.handleCellContextMenu,
      onDragOver: this.handleDragOver,
    };

    if (!columnEvents) {
      return allEvents;
    }

    for (const event in columnEvents) {
      const columnEventHandler = columnEvents[event];
      if (columnEventHandler) {
        const eventInfo: ColumnEventInfo<R> = {
          idx,
          rowIdx,
          column,
          rowId: rowData[cellMetaData.rowKey],
        };
        if (allEvents.hasOwnProperty(event)) {
          const existingEvent = allEvents[event];
          allEvents[event] = (e: Event) => {
            existingEvent(e);
            columnEventHandler(e, eventInfo);
          };
        } else {
          allEvents[event] = (e: Event) => {
            columnEventHandler(e, eventInfo);
          };
        }
      }
    }

    return allEvents;
  }

  render() {
    // console.log('====props4 Cell');
    // console.log(this.props);
    // console.log(this.state);

    const { column, children, expandableOptions, cellMetaData, rowData } = this.props;
    if (column.hidden) {
      return null;
    }

    const style = this.getStyle();
    // console.log('cell-style', style);
    const className = this.getCellClassName();
    const events = this.getEvents();
    const cellContent = children || <CellContent<R> {...this.props} />;
    const cellExpander = expandableOptions && expandableOptions.canExpand && (
      <CellExpander expanded={expandableOptions.expanded} onCellExpand={this.handleCellExpand} />
    );

    return (
      <div ref={this.cell} className={className} style={style} {...events}>
        <CellActions<R> column={column} rowData={rowData} cellMetaData={cellMetaData} />
        {cellExpander}
        {cellContent}
      </div>
    );
  }
}
