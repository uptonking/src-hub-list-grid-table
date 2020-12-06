import React from 'react';
import { ReactDataGrid } from '../../../incubator/react-data-grid/index';
import { Toolbar, Data, Filters } from '../../../incubator/react-data-grid-addons/index';

const { NumericFilter } = Filters;
const Selectors = Data.Selectors;

class Example extends React.Component<{}, any> {
  _columns: any[];
  constructor(props, context) {
    super(props, context);
    this._columns = [
      {
        key: 'id',
        name: 'ID',
        width: 80,
        filterable: true,
        filterRenderer: NumericFilter,
      },
      {
        key: 'task',
        name: 'Title',
        filterable: true,
      },
      {
        key: 'priority',
        name: 'Priority',
        filterable: true,
        // filterRenderer: MultiSelectFilter,
      },
      {
        key: 'issueType',
        name: 'Issue Type',
        filterable: true,
        // filterRenderer: SingleSelectFilter,
      },
      {
        key: 'developer',
        name: 'Developer',
        filterable: true,
        // filterRenderer: AutoCompleteFilter,
      },
      {
        key: 'complete',
        name: '% Complete',
        filterable: true,
        filterRenderer: NumericFilter,
      },
      {
        key: 'startDate',
        name: 'Start Date',
        filterable: true,
      },
      {
        key: 'completeDate',
        name: 'Expected Complete',
        filterable: true,
      },
    ];

    this.state = { rows: this.createRows(1000), filters: {} };
  }

  getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toLocaleDateString();
  };

  createRows = numberOfRows => {
    const rows = [];
    for (let i = 0; i < numberOfRows; i++) {
      rows.push({
        id: i,
        task: `Task ${i}`,
        complete: Math.min(100, Math.round(Math.random() * 110)),
        priority: ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 3 + 1)],
        issueType: ['Bug', 'Improvement', 'Epic', 'Story'][Math.floor(Math.random() * 3 + 1)],
        developer: ['James', 'Tim', 'Daniel', 'Alan'][Math.floor(Math.random() * 3 + 1)],
        startDate: this.getRandomDate(new Date(2015, 3, 1), new Date()),
        completeDate: this.getRandomDate(new Date(), new Date(2016, 0, 1)),
      });
    }
    return rows;
  };

  /** 会先对源数据进行排序过滤分组计算，得到的数组作为最新的表格数据源 */
  rowGetter = index => {
    return Selectors.getRows(this.state)[index];
  };

  rowsCount = () => {
    return Selectors.getRows(this.state).length;
  };

  /** 在state中加减filter */
  handleFilterChange = filter => {
    const newFilters = { ...this.state.filters };
    // 若filter条件存在
    if (filter.filterTerm) {
      newFilters[filter.column.key] = filter;
    } else {
      delete newFilters[filter.column.key];
    }
    this.setState({ filters: newFilters });
  };

  /** 根据过滤器选择源数据id列中符合条件的 */
  getValidFilterValues = columnId => {
    console.log('getValidFilterValues, ', columnId);
    // 取出每行的id列
    const values = this.state.rows.map(r => r[columnId]);
    // 过滤选出id列符合条件的
    return values.filter((item, i, a) => {
      return i === a.indexOf(item);
    });
  };

  handleOnClearFilters = () => {
    this.setState({ filters: {} });
  };

  render() {
    return (
      <ReactDataGrid
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this.rowsCount()}
        minHeight={500}
        enableCellSelect={true}
        toolbar={<Toolbar enableFilter={true} />}
        onAddFilter={this.handleFilterChange}
        getValidFilterValues={this.getValidFilterValues}
        onClearFilters={this.handleOnClearFilters}
      />
    );
  }
}

export default Example;
