export function url(path, params) {
  let s = path
  let first = true

  for(let i in params) {
    s += first === true ? '?' : '&'
    s += i+'='+encodeURIComponent(params[i])
    first = false
  }

  return s
}
