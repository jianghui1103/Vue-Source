/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

const mount = Vue.prototype.$mount
// 原型上绑定$mount 函数
Vue.prototype.$mount = function (
  el?: string | Element, // 表示挂载的元素 #app
  hydrating?: boolean // 暂时没用
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  // 首先判断是否在body 或html 的根节点上, 是不允许挂载在根节点上的
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }
  const options = this.$options
  // el template 解析成render 函数 
  // let vm = new Vue({
  //   el:"#app",
  //   template:"<div><p>我template出来的，年龄{{age}}</p></div>",
  //   data:{
  //     age:12
  //   },
  //   render:function(createElement){
  //      return createElement('h1', '我是render出来的HTML，年龄'+this.age);
  //   }
  // });

  // 解析 template/el 并且转换成render函数
  // 判断是否定义了render方法，没有render函数
  if (!options.render) {
    // let vm = new Vue({
    //   el:"#app",
    //   template:"<div><p>我template出来的，年龄{{age}}</p></div>",
    //   data:{
    //     age:12
    //   },
    // })
    let template = options.template
    // 有template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        // 错误
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    // 没有template 有el 
    // let vm = new Vue({
    //   el:"#app",
    // })
    } else if (el) {
      template = getOuterHTML(el)
    }
    // 上面代码执行后, 判断template是否为空, 不为空转换为render方法
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      // 将template/el 转换成render
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  // 将mount 绑定到Vue上 并且执行传入el(#app)
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */

function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
