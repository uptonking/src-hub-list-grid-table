import React from 'react';
import { ReactDataGrid } from '../../../incubator/react-data-grid/index';
import { Editors, Formatters } from '../../../incubator/react-data-grid-addons/index';

const { DropdownEditor } = Editors;
const { DropdownFormatter } = Formatters;

// options for IssueType dropdown editor
// these can either be an array of strings, or an object that matches the schema below.
const issueTypes = [
  { id: 'bug', value: 'bug', text: 'Bug', title: 'Bug' },
  { id: 'improvement', value: 'improvement', text: 'Improvement', title: 'Improvement' },
  { id: 'epic', value: 'epic', text: 'Epic', title: 'Epic' },
  { id: 'story', value: 'story', text: 'Story', title: 'Story' },
];
const IssueTypesEditor = <DropdownEditor options={issueTypes} />;
// const IssueTypesFormatter = <DropdownFormatter options={issueTypes} value='bug' />;

class Example extends React.Component<any, any> {
  _columns: any[];
  constructor(props, context) {
    super(props, context);
    this._columns = [
      {
        key: 'id',
        name: 'ID',
        width: 80,
      },
      {
        key: 'task',
        name: 'Title',
        editable: true,
      },
      {
        key: 'issueType',
        name: 'Issue Type',
        editor: IssueTypesEditor,
        // formatter: IssueTypesFormatter,
      },
    ];

    this.state = { rows: this.createRows(1000) };
  }

  createRows = numberOfRows => {
    const rows = [];
    for (let i = 1; i < numberOfRows; i++) {
      rows.push({
        id: i,
        task: `Task ${i}`,
        issueType: ['Bug', 'Improvement', 'Epic', 'Story'][Math.floor(Math.random() * 3 + 1)],
      });
    }

    return rows;
  };

  rowGetter = i => {
    return this.state.rows[i];
  };

  handleGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    console.log('====onGridRowsUpdated, ', updated);
    const rows = this.state.rows.slice();

    for (let i = fromRow; i <= toRow; i++) {
      const rowToUpdate = rows[i];
      //   const updatedRow = update(rowToUpdate, { $merge: updated });
      const updatedRow = { ...rowToUpdate, ...updated };

      rows[i] = updatedRow;
    }

    this.setState({ rows });
  };

  render() {
    return (
      <ReactDataGrid
        enableCellSelect
        columns={this._columns}
        rowGetter={this.rowGetter}
        rowsCount={this.state.rows.length}
        minHeight={500}
        onGridRowsUpdated={this.handleGridRowsUpdated}
      />
    );
  }
}

export default Example;
