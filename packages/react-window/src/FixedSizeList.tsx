import { createListComponent, Props, ScrollToAlign, createListComponentParamType } from './createListComponent';

/** 创建FixedSizeList组件使用的参数对象，有9个属性 */
const fixedSizeListParam: createListComponentParamType = {
  getItemOffset: ({ itemSize }: Props<any>, index: number): number => index * (itemSize as number),

  getItemSize: ({ itemSize }: Props<any>, index: number): number => itemSize as number,

  getEstimatedTotalSize: ({ itemCount, itemSize }: Props<any>) => (itemSize as number) * itemCount,

  getOffsetForIndexAndAlignment: (
    { direction, height, itemCount, itemSize, layout, width }: Props<any>,
    index: number,
    align: ScrollToAlign,
    scrollOffset: number,
  ): number => {
    // TODO Deprecate direction "horizontal"
    const isHorizontal = direction === 'horizontal' || layout === 'horizontal';
    const size: number = (isHorizontal ? width : height) as number;
    // 计算最后一项的偏移量
    const lastItemOffset = Math.max(0, itemCount * (itemSize as number) - size);
    const maxOffset = Math.min(lastItemOffset, index * (itemSize as number));
    const minOffset = Math.max(0, index * (itemSize as number) - size + (itemSize as number));

    if (align === 'smart') {
      if (scrollOffset >= minOffset - size && scrollOffset <= maxOffset + size) {
        align = 'auto';
      } else {
        align = 'center';
      }
    }

    switch (align) {
      case 'start':
        return maxOffset;
      case 'end':
        return minOffset;
      case 'center': {
        // "Centered" offset is usually the average of the min and max.
        // But near the edges of the list, this doesn't hold true.
        const middleOffset = Math.round(minOffset + (maxOffset - minOffset) / 2);
        if (middleOffset < Math.ceil(size / 2)) {
          return 0; // near the beginning
        } else if (middleOffset > lastItemOffset + Math.floor(size / 2)) {
          return lastItemOffset; // near the end
        } else {
          return middleOffset;
        }
      }
      case 'auto':
      default:
        if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
          return scrollOffset;
        } else if (scrollOffset < minOffset) {
          return minOffset;
        } else {
          return maxOffset;
        }
    }
  },

  getStartIndexForOffset: ({ itemCount, itemSize }: Props<any>, offset: number): number =>
    Math.max(0, Math.min(itemCount - 1, Math.floor(offset / (itemSize as number)))),

  getStopIndexForStartIndex: (
    { direction, height, itemCount, itemSize, layout, width }: Props<any>,
    startIndex: number,
    scrollOffset: number,
  ): number => {
    // TODO Deprecate direction "horizontal"
    const isHorizontal = direction === 'horizontal' || layout === 'horizontal';
    // 计算window中开头列表项距离列表第一项的偏移量
    const offset = startIndex * (itemSize as number);
    // 获取window的高度或宽度
    const size = (isHorizontal ? width : height) as number;
    // 计算window中从开头到末尾可见列表项的数量
    const numVisibleItems = Math.ceil((size + scrollOffset - offset) / (itemSize as number));
    return Math.max(
      0,
      Math.min(
        itemCount - 1,
        startIndex + numVisibleItems - 1, // -1 is because stop index is inclusive
      ),
    );
  },

  initInstanceProps: (props: Props<any>): any => {
    // Noop
  },

  shouldResetStyleCacheOnItemSizeChange: true,

  validateProps: ({ itemSize }: Props<any>): void => {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof itemSize !== 'number') {
        throw Error(
          'An invalid "itemSize" prop has been specified. ' +
            'Value should be a number. ' +
            `"${itemSize === null ? 'null' : typeof itemSize}" was specified.`,
        );
      }
    }
  },
};

const FixedSizeList = createListComponent(fixedSizeListParam);

export default FixedSizeList;
