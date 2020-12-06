import { Position } from '../common/types';

/** 事件处理函数类型 */
interface EventMap {
  SELECT_CELL(cell: Position, openEditor?: boolean): void;
  SELECT_START(selectedPosition: Position): void;
  SELECT_UPDATE(cellPosition: Position, isFromKeyboard?: boolean, callback?: () => void): void;
  SELECT_END(): void;
  DRAG_ENTER(overRowIdx: number): void;
  SCROLL_TO_COLUMN(idx: number): void;
}

type EventName = keyof EventMap;

/**
 * 事件处理相关对象，便于不同层次的组件传递数据，作用类似于redux。
 * 会在首次DidMount时在InteractionMasks组件中调用subscribe注册事件处理器，在具体事件处调用dispatch执行事件
 */
export default class EventBus {
  /** 用map字典存放事件名和对应的事件处理函数，作为事件订阅中心 */
  subscribers = new Map<EventName, Set<EventMap[EventName]>>();

  /**
   * 将事件名和事件处理函数加入subscribers字典
   * @param type 事件名名称，为字符串枚举
   * @param handler 事件处理函数
   */
  subscribe<T extends EventName>(type: T, handler: EventMap[T]) {
    // 若事件名不存在，则将事件名加入字典，同时事件名对应的处理函数集合设为空Set
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }

    // 将事件处理函数加入事件名对应的Set
    const handlers = this.subscribers.get(type);
    handlers.add(handler);

    // 返回一个方法，用于删除刚加入的事件处理函数
    return () => {
      handlers.delete(handler);
    };
  }

  /**
   * 调用事件名type对应的所有事件处理函数
   * @param type 事件名名称，为字符串枚举
   * @param args 调用事件处理函数时传入的参数
   */
  dispatch<T extends EventName>(type: T, ...args: Parameters<EventMap[T]>) {
    const handlers = this.subscribers.get(type);
    if (handlers) {
      // handler needed a type assertion to fix type bug
      handlers.forEach(handler => (handler as (...args: Parameters<EventMap[T]>) => void)(...args));
    }
  }
}
