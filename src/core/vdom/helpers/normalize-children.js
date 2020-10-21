/* @flow */

import VNode, { createTextVNode } from 'core/vdom/vnode'
import { isFalse, isTrue, isDef, isUndef, isPrimitive } from 'shared/util'

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.
//
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed:

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
// component函数式组件返回的是一个数组, 不是一个节点, 所以需要把children的数组打平, 让深度只有一层
export function simpleNormalizeChildren (children: any) {
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

// 这两个函数主要是对children规范化, children变成了一个类型为VNode的Array

// 2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
export function normalizeChildren (children: any): ?Array<VNode> {
  // children 只有一个节点的时候, 执行createTextVNode, 创建一个简单的文本节点
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}

function isTextNode (node): boolean {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

// children 要规范的子节点, nestedIndex表示嵌套的索引
function normalizeArrayChildren (children: any, nestedIndex?: string): Array<VNode> {
  const res = []
  let i, c, lastIndex, last
  // 遍历子节点
  for (i = 0; i < children.length; i++) {
    // c 为子节点
    c = children[i]
    // c如果为undefined 或者 为boolean类型 就跳过
    if (isUndef(c) || typeof c === 'boolean') continue

    lastIndex = res.length - 1
    last = res[lastIndex]
    //  nested
    // 如果子节点是数组
    if (Array.isArray(c)) {
      // 如果子节点元素大于0
      if (c.length > 0) {
        // 递归调用
        c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`)
        // merge adjacent text nodes
        // 如果第一个节点和最后一个节点都是文本节点，就合并
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]: any).text)
          c.shift()
        }
        // 合并res和子节点
        res.push.apply(res, c)
      }
      // 子节点是基本类型
    } else if (isPrimitive(c)) {
      // 最后一个元素是文本类型
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        // 合并相邻文本节点
        res[lastIndex] = createTextVNode(last.text + c)
      } else if (c !== '') {
        // convert primitive to vnode
        // 将原始子节点转换成为vnode
        res.push(createTextVNode(c))
      }
    } else {
      // 如果第一个节点和最后一个节点都是文本节点，就合并
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text)
      } else {
        // default key for nested array children (likely generated by v-for)
        // v-for组成的
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = `__vlist${nestedIndex}_${i}__`
        }
        res.push(c)
      }
    }
  }
  return res
}
