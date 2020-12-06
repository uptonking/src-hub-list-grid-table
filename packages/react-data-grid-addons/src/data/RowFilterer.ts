import { _utils } from '../../react-data-grid';

const { getMixedTypeValueRetriever } = _utils;

/** 过滤数据的工具函数  */
const filterRows: Function = (filters, rows = []) => {
  console.log('==filterRows-filters-param, ', filters);

  // 遍历各行，对每行检查是否包含过滤关键词
  return rows.filter(row => {
    // 此对象包含通过属性名获取属性值的方法
    const retriever = getMixedTypeValueRetriever(false);
    // 当前行是否应该包含到输出中
    let include = true;

    for (const columnKey in filters) {
      if (filters.hasOwnProperty(columnKey)) {
        const colFilter = filters[columnKey];

        // 若自定义过滤器函数存在，会调用自定义过滤器的filterValues()方法
        if (colFilter.filterValues && typeof colFilter.filterValues === 'function') {
          // console.log('colFilter, ', colFilter);
          include = colFilter.filterValues(row, colFilter, columnKey);
        } else if (typeof colFilter.filterTerm === 'string') {
          // 若过滤关键词存在，默认会执行这里

          const rowValue = retriever.getValue(row, columnKey);
          // 若当前行该过滤列的值存在且非空
          if (rowValue !== undefined && rowValue !== null) {
            // 若值中不包含过滤关键词，则该行就不该包含到输出中
            if (
              rowValue
                .toString()
                .toLowerCase()
                .indexOf(colFilter.filterTerm.toLowerCase()) === -1
            ) {
              include = false;
            }
          } else {
            include = false;
          }
        }
      }
    }
    return include;
  });
};

export default filterRows;
