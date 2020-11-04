/* global Vue */

var apiURL = 'https://api.github.com/repos/vuejs/vue/commits?per_page=3&sha='

/**
 * Actual demo
 */

Vue.component('my-test', {
  template: '<div>{{test}}</div>',
  data () {
      return {
          test: 1212
      }
  }
})
var vm = new Vue({
  el: '#app',
  template: '<div id="app"><my-test><my-test/></div>'
})
