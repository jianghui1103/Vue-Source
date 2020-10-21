# Vue 源码解析

## new Vue () 做了什么

在 new Vue 时候执行了 src/core/instance/index.js, 实例化 Vue 后,会执行 this.\_init 进行了初始化,\_init 通过 initMixin 封装了 vue 函数的原型

```
function Vue (options) {
  this._init(options) // 执行_init
}

initMixin(Vue)

export default Vue
```

### \_init 执行

```
// 初始化生命周期
initLifecycle(vm)
// 初始化事件
initEvents(vm)
// 初始化 render
initRender(vm)
// 执行 beforeCreate 生命周期函数
callHook(vm, 'beforeCreate')
// 初始化 vue 实例的 inject
initInjections(vm) // resolve injections before data/props
// 初始化组件的 props,methods,data,computed,watch
initState(vm)
// 初始化 vue 实例的 provide
initProvide(vm) // resolve provide after data/props
// 执行 created 生命周期函数
callHook(vm, 'created')

// 执行mount，将模型vdom挂在到真实dom上
vm.$mount(vm.$options.el)
```

## Vue 实例挂载的实现 render \$mount

\$mount 方法在很多文件都有定义, 主要分析 web 端, 文件位置/src/platforms/web/entry-runtime-with-compiler.js

1. 判断 el 是否存在，存在后返回找到的元素

```
el = el && query(el)
el: '#root', document.querySelector找到id为root的元素,并且返回赋值el
```

2. 判断了 el 是否绑定在 body 或 html 根节点上, 如果存在, 警告并且返回
3. 判断是否定义了 render 方法, 如果没有定义, 则将 el 或者 template 字符串转换为 render 方法

```
  // 如果没有定义render方法
  if (!options.render) {
    /**
    * let vm = new Vue({
    *  el:"#app",
    *  template:"<div><p>我template出来的，年龄{{age}}</p></div>",
    *  data:{
    *    age:12
    *  },
    * })
    */
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
```

# 渲染

1. \$mount 方法实际会调用定义在 src/core/instance/events.js 的 mountComponent 方法, 主要就是实例化了渲染 watcher 并调用了 updateComponent

2. Vue.js 利用 createElement 方法创建 VNode

## stateMixin

```
  // 在vue 上定义了 $data  并且把 this._data 赋值给$data
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  // 在vue 上定义了 $props  并且把 this._props 赋值给$props
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  // 在原型上绑定set方法 set方法用来出发响应式
  Vue.prototype.$set = set
  // 原型上绑定了delete方法 用来删除对象的属性，并且确定能够出发响应式
  Vue.prototype.$delete = del

  // 在原型上定义了watch api
  Vue.prototype.$watch = function (
    // expOrFn 监听的key, cb是监听回调, options是监听的所有选项
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    options = options || {}
    options.user = true
    // expOrFn 监听的key ， cb是监听回调, options是监听的所有选项
    const watcher = new Watcher(vm, expOrFn, cb, options)
    // 如果设置了immediate为true 那么就立即触发回调
    if (options.immediate) {
      cb.call(vm, watcher.value)
    }
  }
```

## eventsMixin

在 src/core/instance/events.js 中, 主要定义了$on, $once, $off, $emit 事件

## lifecycleMixin

在 src/core/instance/events.js 中, 主要定义了 \_update, $forceUpdate, $destroy

## renderMixin
