module.exports = function Notify () {
  var listeners = []
  function notify (value) {
    listeners.forEach(function (fn) { fn(value) })
  }
  notify.listen = function (fn) {
    listeners.push(fn)
  }
  return notify
}

