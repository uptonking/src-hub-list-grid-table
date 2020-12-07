/* eslint-disable eqeqeq */
/* eslint-disable no-eq-null */
import React, { createElement, PureComponent, SyntheticEvent, ReactNode } from 'react';
import memoizeOne from 'memoize-one';
import { cancelTimeout, requestTimeout, TimeoutID } from './util/timer';
import { getRTLOffsetType } from './util/domHelpers';

export type ScrollToAlign = 'auto' | 'smart' | 'center' | 'start' | 'end';

type itemSize = number | ((index: number) => number);
// TODO Deprecate directions "horizontal" and "vertical"
type Direction = 'ltr' | 'rtl' | 'horizontal' | 'vertical';
type Layout = 'horizontal' | 'vertical';

type RenderComponentProps<T> = {
  data: T;
  index: number;
  isScrolling?: boolean;
  style: Record<string, any>;
};
type RenderComponent<T> = React.ComponentType<RenderComponentProps<T>>;

type ScrollDirection = 'forward' | 'backward';

type onItemsRenderedCallbackParamType = {
  overscanStartIndex: number;
  overscanStopIndex: number;
  visibleStartIndex: number;
  visibleStopIndex: number;
};
type onItemsRenderedCallback = ({
  overscanStartIndex,
  overscanStopIndex,
  visibleStartIndex,
  visibleStopIndex,
}: onItemsRenderedCallbackParamType) => void;

type onScrollCallbackParamType = {
  scrollDirection: ScrollDirection;
  scrollOffset: number;
  scrollUpdateWasRequested: boolean;
};
type onScrollCallback = ({
  scrollDirection,
  scrollOffset,
  scrollUpdateWasRequested,
}: onScrollCallbackParamType) => void;

type ScrollEvent = SyntheticEvent<HTMLDivElement>;
type ItemStyleCache = { [index: number]: Record<string, any> };

type OuterProps = {
  children: ReactNode;
  className: string | void;
  onScroll: (ScrollEvent) => void;
  style: any;
  // style: {
  //   [string]: mixed,
  // },
};

type InnerProps = {
  children: ReactNode;
  style: any;
  //   style: {
  //   [string]: mixed,
  // },
};

export type Props<T> = {
  /** 子节点是类组件或函数型组件 */
  children: RenderComponent<T>;
  /** 列表总宽度 */
  width: number | string;
  /** 列表总高度 */
  height: number | string;
  /** 列表总项数，一次只会渲染window中的部分列表项 */
  itemCount: number;
  /** 行高或列宽 */
  itemSize: itemSize;
  /** 会作为data prop传递给列表项，可在简单场景中替代react的context，可通过this.props.data[this.props.index]访问列表项数据 */
  itemData: T;
  /** 默认使用index作为各项的key，itemKey可指定列表各项的key，使用场景是列表项需要排序或修改， 或列表项组件包含状态 */
  itemKey?: (index: number, data: T) => any;
  /** 只会在item indices变化后才触发，isScrolling或data变化不会触发 */
  onItemsRendered?: onItemsRenderedCallback;
  /** 文字方向和水平滚动方向 */
  direction: Direction;
  /** 指定列表各项排列的方向，会在layout方向上计算window */
  layout: Layout;
  /** 会传到列表组件最外层div的样式名 */
  className?: string;
  /** 添加到最外层div的样式对象 */
  style?: Record<string, any>;
  /** 指向内部容器元素的ref */
  innerRef?: any;
  // innerElementType?: string | React.AbstractComponent<InnerProps, any>,
  /** 创建内部容器元素时应使用的元素类型，默认div */
  innerElementType?: string | any;
  /** deprecated for innerElementType  */
  innerTagName?: string;
  /** 会添加到外层容器元素的ref */
  outerRef?: any;
  // outerElementType?: string | React$AbstractComponent<OuterProps, any>,
  /** 创建外层容器元素时使用的类型，默认div */
  outerElementType?: string | any;
  /** depreacated for outerElementType */
  outerTagName?: string;
  /** 滚动位置发生变化时触发，如用户滚动或调用scrollTo方法时 */
  onScroll?: onScrollCallback;
  /** 初始滚动距离，对竖直型列表指scrollTop，对水平型列表指scrollLeft */
  initialScrollOffset?: number;
  /** 是否使用滚动占位符，Adds an additional isScrolling parameter to the children render function */
  useIsScrolling: boolean;
  /** 在可见区域外应该渲染的列表项数量，能防止闪烁或空白，默认值是2 */
  overscanCount: number;
};

type State = {
  /** 存放this */
  instance: any;
  /** list是否正在滚动 */
  isScrolling: boolean;
  /** list滚动方向，默认forward */
  scrollDirection: ScrollDirection;
  /** 滚动距离，与scrollTop相关 */
  scrollOffset: number;
  /** 是否是用代码控制滚动，若由用户控制滚动则为false，若由scrollTo/scrollToItem控制滚动则为true */
  scrollUpdateWasRequested: boolean;
};

type GetItemOffset = (props: Props<any>, index: number, instanceProps: any) => number;
type GetItemSize = (props: Props<any>, index: number, instanceProps: any) => number;
type GetEstimatedTotalSize = (props: Props<any>, instanceProps: any) => number;
type GetOffsetForIndexAndAlignment = (
  props: Props<any>,
  index: number,
  align: ScrollToAlign,
  scrollOffset: number,
  instanceProps: any,
) => number;
type GetStartIndexForOffset = (props: Props<any>, offset: number, instanceProps: any) => number;
type GetStopIndexForStartIndex = (
  props: Props<any>,
  startIndex: number,
  scrollOffset: number,
  instanceProps: any,
) => number;
type InitInstanceProps = (props: Props<any>, instance: any) => any;
type ValidateProps = (props: Props<any>) => void;

export type createListComponentParamType = {
  /** 计算列表项在window中的偏移量 */
  getItemOffset: GetItemOffset;
  /** 估算总高度/宽度 */
  getEstimatedTotalSize: GetEstimatedTotalSize;
  /** 计算列表项的高度/宽度 */
  getItemSize: GetItemSize;
  /** 计算指定索引号的偏移量 */
  getOffsetForIndexAndAlignment: GetOffsetForIndexAndAlignment;
  /** 根据当前偏移量计算起始索引号 */
  getStartIndexForOffset: GetStartIndexForOffset;
  /** 根据起始索引号计算终点索引号 */
  getStopIndexForStartIndex: GetStopIndexForStartIndex;
  /** 初始属性，默认空 */
  initInstanceProps: InitInstanceProps;
  /** 列表项高度或宽度变化后是否清除缓存 */
  shouldResetStyleCacheOnItemSizeChange: boolean;
  /** 自定义验证属性的方式 */
  validateProps: ValidateProps;
};

/** 全局变量，滚动去抖方式在操作停止后要等待的时间 */
const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;

/** 默认使用index作为列表各项的key */
const defaultItemKey = (index: number, data: any) => index;

// In DEV mode, this Set helps us only log a warning once per component instance.
// This avoids spamming the console every time a render happens.
let devWarningsDirection = null;
let devWarningsTagName = null;
if (process.env.NODE_ENV !== 'production') {
  if (typeof window !== 'undefined' && typeof (window as any).WeakSet !== 'undefined') {
    devWarningsDirection = new WeakSet();
    devWarningsTagName = new WeakSet();
  }
}

/**
 * 工具函数，返回一个代表List的class。
 * 常用模式是3层结构，整个list最外层是div，会设置position:relative，传入宽高到这里，overflow:auto;
 * 最里层的列表项也是div，会被传入style对象；
 * 中间层也是div，设置宽高，如高度100%，宽度itemSize*itemCount，由于最外层有overflow，所有只显示最外层设置的宽高。
 * @param 创建列表组件所需的参数都放在一个对象中，可设置9个属性作为参数
 */
export function createListComponent({
  getItemOffset,
  getEstimatedTotalSize,
  getItemSize,
  getOffsetForIndexAndAlignment,
  getStartIndexForOffset,
  getStopIndexForStartIndex,
  initInstanceProps,
  shouldResetStyleCacheOnItemSizeChange,
  validateProps,
}: createListComponentParamType) {
  // 返回一个react组件class
  return class ListClass<T> extends PureComponent<Props<T>, State> {
    _instanceProps: any = initInstanceProps(this.props, this);
    _outerRef?: HTMLDivElement;
    _resetIsScrollingTimeoutId: TimeoutID | null = null;

    /** 默认初始值 */
    static defaultProps = {
      layout: 'vertical',
      direction: 'ltr',
      itemData: undefined,
      overscanCount: 2,
      useIsScrolling: false,
    };

    state: State = {
      instance: this,
      isScrolling: false,
      scrollDirection: 'forward',
      scrollOffset: typeof this.props.initialScrollOffset === 'number' ? this.props.initialScrollOffset : 0,
      scrollUpdateWasRequested: false,
    };

    // Always use explicit constructor for React components.
    // It produces less code after transpilation. (#26)
    // eslint-disable-next-line no-useless-constructor
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    // constructor(props: Props<T>) {
    //   super(props);
    // }

    /** 始终返回null，说明本组件的state与props的关系不在这里维护 */
    static getDerivedStateFromProps(
      // nextProps: Props<T>,
      nextProps: Props<any>,
      prevState: State,
    ): State | null {
      console.log('==== List getDerivedStateFromProps');
      // console.log(nextProps);
      // console.log(prevState);

      // 只进行基本的参数类型验证，包括deprecated提示
      validateSharedProps(nextProps, prevState);
      // 使用传入的方法自定义验证参数的方式
      validateProps(nextProps);

      return null;
    }

    componentDidMount() {
      console.log('==== List componentDidMount');

      const { direction, initialScrollOffset, layout } = this.props;

      // 若初始偏移量非0，且_outerRef非空
      if (typeof initialScrollOffset === 'number' && this._outerRef != null) {
        // const outerRef = ((this._outerRef: any): HTMLElement);
        const outerRef = this._outerRef;
        // TODO Deprecate direction "horizontal"
        if (direction === 'horizontal' || layout === 'horizontal') {
          outerRef.scrollLeft = initialScrollOffset;
        } else {
          outerRef.scrollTop = initialScrollOffset;
        }
      }

      //
      this._callPropsCallbacks();
    }

    componentDidUpdate() {
      console.log('==== List componentDidUpdate');

      const { direction, layout } = this.props;
      const { scrollOffset, scrollUpdateWasRequested } = this.state;

      //
      if (scrollUpdateWasRequested && this._outerRef != null) {
        // const outerRef = ((this._outerRef: any): HTMLElement);
        const outerRef = this._outerRef;

        // TODO Deprecate direction "horizontal"
        if (direction === 'horizontal' || layout === 'horizontal') {
          if (direction === 'rtl') {
            // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
            // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
            // So we need to determine which browser behavior we're dealing with, and mimic it.
            switch (getRTLOffsetType()) {
              case 'negative':
                outerRef.scrollLeft = -scrollOffset;
                break;
              case 'positive-ascending':
                outerRef.scrollLeft = scrollOffset;
                break;
              default:
                // eslint-disable-next-line no-case-declarations
                const { clientWidth, scrollWidth } = outerRef;
                outerRef.scrollLeft = scrollWidth - clientWidth - scrollOffset;
                break;
            }
          } else {
            outerRef.scrollLeft = scrollOffset;
          }
        } else {
          outerRef.scrollTop = scrollOffset;
        }
      }

      this._callPropsCallbacks();
    }

    componentWillUnmount() {
      if (this._resetIsScrollingTimeoutId !== null) {
        cancelTimeout(this._resetIsScrollingTimeoutId);
      }
    }

    render() {
      console.log('====props4 ListClass');
      console.log(this.props);
      console.log(this.state);

      const {
        // children是函数组件或类组件
        children,
        className,
        direction,
        height,
        innerRef,
        innerElementType,
        innerTagName,
        itemCount,
        itemData,
        // 设置列表项的默认key为index，是个函数
        itemKey = defaultItemKey,
        layout,
        outerElementType,
        outerTagName,
        style,
        useIsScrolling,
        width,
      } = this.props;
      const { isScrolling } = this.state;

      // TODO Deprecate direction "horizontal"
      const isHorizontal = direction === 'horizontal' || layout === 'horizontal';

      // 会作为属性直接给最外层div添加滚动事件监听器
      const onScroll = isHorizontal ? this._onScrollHorizontal : this._onScrollVertical;

      // 每次render都会重新计算window中列表项的起止索引号，不包含overscanCount
      const [startIndex, stopIndex] = this._getRangeToRender();

      const items = [];
      if (itemCount > 0) {
        // 遍历起止索引号的列表项数据，对每项数据创建一个react组件
        for (let index = startIndex; index <= stopIndex; index++) {
          items.push(
            createElement(children, {
              data: itemData,
              key: itemKey(index, itemData),
              index,
              isScrolling: useIsScrolling ? isScrolling : undefined,
              style: this._getItemStyle(index),
            }),
          );
        }
      }

      // 在当前window列表项创建后估算总项数
      // Read this value AFTER items have been created,
      // So their actual sizes (if variable) are taken into consideration.
      const estimatedTotalSize = getEstimatedTotalSize(this.props, this._instanceProps);

      return createElement(
        // 创建的list最外层标签默认是div
        outerElementType || outerTagName || 'div',
        // 最外层div默认相对定位，overflow为auto
        {
          onScroll,
          className,
          ref: this._outerRefSetter,
          style: {
            position: 'relative',
            height,
            width,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            willChange: 'transform',
            direction,
            ...style,
          },
        },
        // 中间层的children默认也是div，设置了高度或宽度为100%
        createElement(innerElementType || innerTagName || 'div', {
          // 动态创建列表项数据对应的dom
          children: items,
          ref: innerRef,
          style: {
            height: isHorizontal ? '100%' : estimatedTotalSize,
            width: isHorizontal ? estimatedTotalSize : '100%',
            pointerEvents: isScrolling ? 'none' : undefined,
          },
        }),
      );
    }

    /**
     * 滚动到指定行/列，注意direction
     * @param scrollOffset 距离左边或上边
     */
    scrollTo(scrollOffset: number): void {
      scrollOffset = Math.max(0, scrollOffset);

      this.setState(prevState => {
        if (prevState.scrollOffset === scrollOffset) {
          return null;
        }
        return {
          scrollDirection: prevState.scrollOffset < scrollOffset ? 'forward' : 'backward',
          scrollOffset: scrollOffset,
          scrollUpdateWasRequested: true,
        };
      }, this._resetIsScrollingDebounced);
    }

    /**
     * 滚动到指定列表项
     * @param index 列表项索引
     * @param align  滚动后的对齐方式
     */
    scrollToItem(index: number, align: ScrollToAlign = 'auto'): void {
      const { itemCount } = this.props;
      const { scrollOffset } = this.state;

      index = Math.max(0, Math.min(index, itemCount - 1));

      this.scrollTo(getOffsetForIndexAndAlignment(this.props, index, align, scrollOffset, this._instanceProps));
    }

    _callOnItemsRendered = memoizeOne(
      (overscanStartIndex: number, overscanStopIndex: number, visibleStartIndex: number, visibleStopIndex: number) =>
        // ((this.props.onItemsRendered: any): onItemsRenderedCallback)({
        // (this.props.onItemsRendered as any).onItemsRenderedCallback({
        this.props.onItemsRendered({
          overscanStartIndex,
          overscanStopIndex,
          visibleStartIndex,
          visibleStopIndex,
        }),
    );

    _callOnScroll = memoizeOne(
      (scrollDirection: ScrollDirection, scrollOffset: number, scrollUpdateWasRequested: boolean) =>
        // ((this.props.onScroll: any): onScrollCallback)({
        this.props.onScroll({
          scrollDirection,
          scrollOffset,
          scrollUpdateWasRequested,
        }),
    );

    /**
     * 若this.props中存在onItemsRendered和onScroll，则调用相应方法
     */
    _callPropsCallbacks() {
      console.log('this.props.onItemsRendered, ', this.props.onItemsRendered);
      // onItemsRendered默认为空
      if (typeof this.props.onItemsRendered === 'function') {
        const { itemCount } = this.props;
        if (itemCount > 0) {
          const [overscanStartIndex, overscanStopIndex, visibleStartIndex, visibleStopIndex] = this._getRangeToRender();
          this._callOnItemsRendered(overscanStartIndex, overscanStopIndex, visibleStartIndex, visibleStopIndex);
        }
      }

      console.log('this.props.onScroll, ', this.props.onScroll);
      // scrollDirection默认为空
      if (typeof this.props.onScroll === 'function') {
        const { scrollDirection, scrollOffset, scrollUpdateWasRequested } = this.state;
        this._callOnScroll(scrollDirection, scrollOffset, scrollUpdateWasRequested);
      }
    }

    // Lazily create and cache item styles while scrolling,
    // So that pure component sCU will prevent re-renders.
    // We maintain this cache, and pass a style prop rather than index,
    // So that List can clear cached styles and force item re-render if necessary.
    // _getItemStyle: (index: number) => Object;
    _getItemStyle = (index: number): Record<string, any> => {
      const { direction, itemSize, layout } = this.props;

      const itemStyleCache = this._getItemStyleCache(
        shouldResetStyleCacheOnItemSizeChange && itemSize,
        shouldResetStyleCacheOnItemSizeChange && layout,
        shouldResetStyleCacheOnItemSizeChange && direction,
      );

      let style;
      if (itemStyleCache.hasOwnProperty(index)) {
        style = itemStyleCache[index];
      } else {
        const offset = getItemOffset(this.props, index, this._instanceProps);
        const size = getItemSize(this.props, index, this._instanceProps);

        // TODO Deprecate direction "horizontal"
        const isHorizontal = direction === 'horizontal' || layout === 'horizontal';

        itemStyleCache[index] = style = {
          position: 'absolute',
          [direction === 'rtl' ? 'right' : 'left']: isHorizontal ? offset : 0,
          top: !isHorizontal ? offset : 0,
          height: !isHorizontal ? size : '100%',
          width: isHorizontal ? size : '100%',
        };
      }

      return style;
    };

    // _getItemStyleCache: (_: any, __: any, ___: any) => ItemStyleCache;
    _getItemStyleCache = memoizeOne((_: any, __: any, ___: any) => ({}));

    /**
     * 计算当前window要渲染的列表项起止索引号
     */
    _getRangeToRender(): [number, number, number, number] {
      const { itemCount, overscanCount } = this.props;
      const { isScrolling, scrollDirection, scrollOffset } = this.state;

      // 若列表无数据
      if (itemCount === 0) {
        return [0, 0, 0, 0];
      }

      // 计算起始索引号
      const startIndex = getStartIndexForOffset(this.props, scrollOffset, this._instanceProps);
      // 计算终止索引号
      const stopIndex = getStopIndexForStartIndex(this.props, startIndex, scrollOffset, this._instanceProps);

      console.log('startIndex-stopIndex, ', startIndex, ' - ', stopIndex);

      // 在各方向不可见区域都多渲染1~overscanCount个列表项，便于tab键导航和防闪烁空白
      // Overscan by one item in each direction so that tab/focus works.
      // If there isn't at least one extra item, tab loops back around.
      const overscanBackward = !isScrolling || scrollDirection === 'backward' ? Math.max(1, overscanCount) : 1;
      const overscanForward = !isScrolling || scrollDirection === 'forward' ? Math.max(1, overscanCount) : 1;

      return [
        Math.max(0, startIndex - overscanBackward),
        Math.max(0, Math.min(itemCount - 1, stopIndex + overscanForward)),
        startIndex,
        stopIndex,
      ];
    }

    _onScrollHorizontal = (event: ScrollEvent): void => {
      const { clientWidth, scrollLeft, scrollWidth } = event.currentTarget;
      this.setState(prevState => {
        if (prevState.scrollOffset === scrollLeft) {
          // Scroll position may have been updated by cDM/cDU,
          // In which case we don't need to trigger another render,
          // And we don't want to update state.isScrolling.
          return null;
        }

        const { direction } = this.props;

        let scrollOffset = scrollLeft;
        if (direction === 'rtl') {
          // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
          // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
          // It's also easier for this component if we convert offsets to the same format as they would be in for ltr.
          // So the simplest solution is to determine which browser behavior we're dealing with, and convert based on it.
          switch (getRTLOffsetType()) {
            case 'negative':
              scrollOffset = -scrollLeft;
              break;
            case 'positive-descending':
              scrollOffset = scrollWidth - clientWidth - scrollLeft;
              break;
          }
        }

        // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
        scrollOffset = Math.max(0, Math.min(scrollOffset, scrollWidth - clientWidth));

        return {
          isScrolling: true,
          scrollDirection: prevState.scrollOffset < scrollLeft ? 'forward' : 'backward',
          scrollOffset,
          scrollUpdateWasRequested: false,
        };
      }, this._resetIsScrollingDebounced);
    };

    /**
     * 竖直滚动的事件监听器，会被赋值给最外层div的onScroll属性
     */
    _onScrollVertical = (event: ScrollEvent): void => {
      const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
      // 若滚动位置无变化，则返回
      this.setState(prevState => {
        if (prevState.scrollOffset === scrollTop) {
          // Scroll position may have been updated by cDM/cDU,
          // In which case we don't need to trigger another render,
          // And we don't want to update state.isScrolling.
          return null;
        }

        // 根据滚动后的位置计算本次滚动的距离
        // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
        const scrollOffset = Math.max(0, Math.min(scrollTop, scrollHeight - clientHeight));
        console.log('_onScrollVertical-scrollOffset, ', scrollOffset);

        return {
          isScrolling: true,
          scrollDirection: prevState.scrollOffset < scrollOffset ? 'forward' : 'backward',
          scrollOffset,
          scrollUpdateWasRequested: false,
        };
      }, this._resetIsScrollingDebounced);
    };

    _outerRefSetter = (ref: any): void => {
      const { outerRef } = this.props;

      // this._outerRef = ((ref: any): HTMLDivElement);
      this._outerRef = ref;

      if (typeof outerRef === 'function') {
        outerRef(ref);
      } else if (outerRef != null && typeof outerRef === 'object' && outerRef.hasOwnProperty('current')) {
        outerRef.current = ref;
      }
    };

    _resetIsScrollingDebounced = () => {
      if (this._resetIsScrollingTimeoutId !== null) {
        cancelTimeout(this._resetIsScrollingTimeoutId);
      }

      this._resetIsScrollingTimeoutId = requestTimeout(this._resetIsScrolling, IS_SCROLLING_DEBOUNCE_INTERVAL);
    };

    _resetIsScrolling = () => {
      this._resetIsScrollingTimeoutId = null;

      this.setState({ isScrolling: false }, () => {
        // Clear style cache after state update has been committed.
        // This way we don't break pure sCU for items that don't use isScrolling param.
        // this._getItemStyleCache(-1, null);
        this._getItemStyleCache(-1, null, undefined);
      });
    };
  };
}

// NOTE: I considered further wrapping individual items with a pure ListItem component.
// This would avoid ever calling the render function for the same index more than once,
// But it would also add the overhead of a lot of components/fibers.
// I assume people already do this (render function returning a class component),
// So my doing it would just unnecessarily double the wrappers.

// eslint-disable-next-line complexity
const validateSharedProps = (
  // { children, direction, height, layout, innerTagName, outerTagName, width }: Props<any>,
  // { instance }: State,
  { children, direction, height, layout, innerTagName = '', outerTagName = '', width },
  { instance },
): void => {
  // if (process.env.NODE_ENV !== 'production') {
  // if (innerTagName != null || outerTagName != null) {
  //   if (devWarningsTagName && !devWarningsTagName.has(instance)) {
  //     devWarningsTagName.add(instance);
  //     console.warn(
  //       'The innerTagName and outerTagName props have been deprecated. ' +
  //         'Please use the innerElementType and outerElementType props instead.',
  //     );
  //   }
  // }

  // TODO Deprecate direction "horizontal"
  const isHorizontal = direction === 'horizontal' || layout === 'horizontal';

  switch (direction) {
    case 'horizontal':
    case 'vertical':
      if (devWarningsDirection && !devWarningsDirection.has(instance)) {
        devWarningsDirection.add(instance);
        console.warn(
          'The direction prop should be either "ltr" (default) or "rtl". ' +
            'Please use the layout prop to specify "vertical" (default) or "horizontal" orientation.',
        );
      }
      break;
    case 'ltr':
    case 'rtl':
      // Valid values
      break;
    default:
      throw Error(
        'An invalid "direction" prop has been specified. ' +
          'Value should be either "ltr" or "rtl". ' +
          `"${direction}" was specified.`,
      );
  }

  switch (layout) {
    case 'horizontal':
    case 'vertical':
      // Valid values
      break;
    default:
      throw Error(
        'An invalid "layout" prop has been specified. ' +
          'Value should be either "horizontal" or "vertical". ' +
          `"${layout}" was specified.`,
      );
  }

  if (children == null) {
    throw Error(
      'An invalid "children" prop has been specified. ' +
        'Value should be a React component. ' +
        `"${children === null ? 'null' : typeof children}" was specified.`,
    );
  }

  if (isHorizontal && typeof width !== 'number') {
    throw Error(
      'An invalid "width" prop has been specified. ' +
        'Horizontal lists must specify a number for width. ' +
        `"${width === null ? 'null' : typeof width}" was specified.`,
    );
  } else if (!isHorizontal && typeof height !== 'number') {
    throw Error(
      'An invalid "height" prop has been specified. ' +
        'Vertical lists must specify a number for height. ' +
        `"${height === null ? 'null' : typeof height}" was specified.`,
    );
  }
  // }
};

export default createListComponent;
