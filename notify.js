module.exports = function Notify () {
  var listeners = []
  function notify (value) {
    listeners.forEach(function (fn) { fn(value) })
  }
  notify.listen = function (fn) {
    listeners.push(fn)
    //returns function to remove this listener
    return function () {
      var i = listeners.indexOf(fn)
      if(~i) listeners.splice(i, 1)
    }
  }
  return notify
}

