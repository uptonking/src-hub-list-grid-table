import { _utils } from '../../react-data-grid';
import { createSelector } from './reselect';
import filterRows from './RowFilterer';
import sortRows from './RowSorter';
import groupRows from './RowGrouper';

const { isEmptyObject, isEmptyArray } = _utils;

const getFilters = state => state.filters;
const getInputRows = state => state.rows;
/** 对源数据执行过滤器的函数 */
const getFilteredRows = createSelector(
  // [getFilters, getInputRows],
  getFilters,
  getInputRows,
  (filters, rows = []) => {
    // console.log('getFilteredRows-filter, ', filters);
    // 若filters为空，则直接返回
    if (!filters || isEmptyObject(filters)) {
      return rows;
    }
    // 若filters不为空，则返回过滤后的数据作为新的源数据
    return filterRows(filters, rows);
  },
);

const getSortColumn = state => state.sortColumn;
const getSortDirection = state => state.sortDirection;
/** 对过滤后的数据执行排序的函数 */
const getSortedRows = createSelector(
  // [getFilteredRows, getSortColumn, getSortDirection],
  getFilteredRows,
  getSortColumn,
  getSortDirection,
  (rows, sortColumn, sortDirection) => {
    if (!sortDirection && !sortColumn) {
      return rows;
    }
    return sortRows(rows, sortColumn, sortDirection);
  },
);

const getGroupedColumns = state => state.groupBy;
const getExpandedRows = state => state.expandedRows;
/** 对过滤排序后的数据的执行分组的函数 */
const getFlattenedGroupedRows = createSelector(
  // [getSortedRows, getGroupedColumns, getExpandedRows],
  getSortedRows,
  getGroupedColumns,
  getExpandedRows,
  (rows, groupedColumns, expandedRows = {}) => {
    if (!groupedColumns || isEmptyObject(groupedColumns) || isEmptyArray(groupedColumns)) {
      return rows;
    }
    return groupRows(rows, groupedColumns, expandedRows);
  },
);

const getSelectedKeys = state => state.selectedKeys;
const getRowKey = state => state.rowKey;
const getSelectedRowsByKey = createSelector(
  // [getRowKey, getSelectedKeys, getInputRows],
  getRowKey,
  getSelectedKeys,
  getInputRows,
  (rowKey, selectedKeys, rows = []) => {
    return selectedKeys.map(k => {
      return rows.filter(r => {
        return r[rowKey] === k;
      })[0];
    });
  },
);

export { getFlattenedGroupedRows as getRows, getSelectedRowsByKey };
