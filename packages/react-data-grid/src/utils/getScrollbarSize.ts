/** 滚动条的宽度 */
// let size: number | undefined;
let size: number;

/**
 * 工具方法，计算当前浏览器竖向滚动条的宽度，通过动态添加div显示滚动条来计算宽度，最后再删除div
 */
export default function getScrollbarSize(): number {
  // 首次调用size不存在
  if (size === undefined) {
    const outer = document.createElement('div');
    outer.style.width = '50px';
    outer.style.height = '50px';
    outer.style.position = 'absolute';
    outer.style.top = '-200px';
    outer.style.left = '-200px';

    const inner = document.createElement('div');
    inner.style.height = '100px';
    inner.style.width = '100%';

    outer.appendChild(inner);
    document.body.appendChild(outer);

    const outerWidth = outer.clientWidth;
    outer.style.overflowY = 'scroll';
    const innerWidth = inner.clientWidth;

    document.body.removeChild(outer);

    size = outerWidth - innerWidth;
  }

  return size;
}
