
let sort = {
  time: function(options) {
    return function timeSort(a, b) {
        let s = a.mtime - b.mtime

        return options.order == 'desc' ? s : -s
    }
  },
  name: function(options) {
    return function (a, b) {
      let s = a.name.charCodeAt(0) - b.name.charCodeAt(0)

      return options.order == 'desc' ? s : -s
    } 
  },
  size: function(options) {
    return function(a, b) {
      let s = a.size - b.size

      return options.order == 'desc' ? s : -s
    } 
  }
}

export {sort}
