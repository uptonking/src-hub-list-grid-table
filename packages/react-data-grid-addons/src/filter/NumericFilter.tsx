import React from 'react';
import { Column } from '../../react-data-grid';

/** 数字过滤规则，枚举 */
enum RuleType {
  Number = 1,
  Range = 2,
  GreaterThan = 3,
  LessThan = 4,
}

type Rule =
  | { type: RuleType.Range; begin: number; end: number }
  | { type: RuleType.GreaterThan | RuleType.LessThan | RuleType.Number; value: number };

interface ChangeEvent<R> {
  filterTerm: Rule[] | null;
  column: Column<R>;
  rawValue: string;
  filterValues: typeof filterValues;
}

interface NumericFilterProps<R> {
  column: Column<R>;
  onChange(event: ChangeEvent<R>): void;
}

/**
 * 表头下一列单元格的数值过滤器组件，核心是非受控input组件
 */
export default function NumericFilter<R>({ column, onChange }: NumericFilterProps<R>) {
  /** Validates the input，若按下的不是数字键，则执行就停止 */
  function handleKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
    const result = /[><,0-9-]/.test(event.key);
    if (result === false) {
      event.preventDefault();
    }
  }

  /** 输入数值过滤条件完成后，将过滤条件转换成离散值 */
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    const filters = getRules(value);
    console.log('Numeric-filter-rules, ', filters);

    // 调用传过来的onChange方法，可以添加或删除过滤词条
    onChange({
      filterTerm: filters.length > 0 ? filters : null,
      column,
      rawValue: value,
      filterValues,
    });
  }

  const inputKey = `header-filter-${column.key as keyof R}`;
  const columnStyle: React.CSSProperties = {
    float: 'left',
    marginRight: 5,
    maxWidth: '80%',
  };
  const badgeStyle: React.CSSProperties = {
    cursor: 'help',
  };

  const tooltipText = 'Input Methods: Range (x-y), Greater Than (>x), Less Than (<y)';

  return (
    <div>
      <div style={columnStyle}>
        <input
          key={inputKey}
          placeholder='e.g. 3,10-15,>20'
          className='form-control input-sm'
          onChange={handleChange}
          // onKeyPress={handleKeyPress}
        />
      </div>
      <div className='input-sm'>
        <span className='badge' style={badgeStyle} title={tooltipText}>
          ?
        </span>
      </div>
    </div>
  );
}

/**
 * 计算过滤后的值，RowFilterer会对每行数据都调用
 * @param row 行数据
 * @param columnFilter 过滤器集合
 * @param columnKey 过滤根据的字段
 */
function filterValues<R>(row: R, columnFilter: { filterTerm: { [key in string]: Rule } }, columnKey: keyof R) {
  //   if (columnFilter.filterTerm == null) {
  if (!columnFilter.filterTerm) {
    return true;
  }

  // implement default filter logic，实现默认的过滤逻辑
  const value = parseInt((row[columnKey] as unknown) as string, 10);
  for (const ruleKey in columnFilter.filterTerm) {
    const rule = columnFilter.filterTerm[ruleKey];

    switch (rule.type) {
      case RuleType.Number:
        if (value === rule.value) {
          return true;
        }
        break;
      case RuleType.GreaterThan:
        if (value >= rule.value) {
          return true;
        }
        break;
      case RuleType.LessThan:
        if (value <= rule.value) {
          return true;
        }
        break;
      case RuleType.Range:
        if (value >= rule.begin && value <= rule.end) {
          return true;
        }
        break;
      default:
        break;
    }
  }

  return false;
}

/**
 * 根据输入的过滤规则数字字符串，返回规则对象
 * @param value  输入的过滤规则
 */
export function getRules(value: string): Rule[] {
  if (value === '' || value.trim() === '') {
    return [];
  }

  // handle each value with comma
  // FIXME 处理以逗号开头的情况
  return value.split(',').map(
    (str): Rule => {
      // handle dash，若存在-符号，则返回区间规则对象
      const dashIdx = str.indexOf('-');
      if (dashIdx > 0) {
        const begin = parseInt(str.slice(0, dashIdx), 10);
        const end = parseInt(str.slice(dashIdx + 1), 10);
        return { type: RuleType.Range, begin, end };
      }

      // handle greater then，若存在>符号，则返回大于规则对象
      if (str.includes('>')) {
        const begin = parseInt(str.slice(str.indexOf('>') + 1), 10);
        return { type: RuleType.GreaterThan, value: begin };
      }

      // handle less then，若存在<符号，则返回小于规则对象
      if (str.includes('<')) {
        const end = parseInt(str.slice(str.indexOf('<') + 1), 10);
        return { type: RuleType.LessThan, value: end };
      }

      // handle normal values，默认处理指定值
      const numericValue = parseInt(str, 10);
      return { type: RuleType.Number, value: numericValue };
    },
  );
}
