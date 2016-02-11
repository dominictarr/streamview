
// update a view of a single value.
// might be to a file or a single db record.

function isFunction (f) {
  return 'function' === typeof f
}


function andor (a, b, and) {
  return and ? a&&b : a||b
}

function UpdateByCountAndOrDelay (opts, write) {
  if(isFunction(opts)) write = opts, opts = {}
  var delay = opts.delay || 60*1000 //1 minute.
  var count = opts.count || 100, value

  var busy = false, c = 0, _c = 0, last = Date.now()
  var cb
  function drain (_value) {
      busy = true
      if(!_value) throw new Error('null write')
      console.log('write', _value)
      write(_value, function (err) {
        busy = false
        if(!err) {
          _c = c; last = Date.now()
        }
        if(cb) cb(err, _value)
      })
  }
  function update (_value) {
    value = _value
    if(!busy && (c++ > _c + count || last + delay < Date.now()))
      drain(value)
  }

  update.flush = function (_cb) {
    cb = _cb
    if(!value) cb()
    else if(!busy) drain(value)
    else {
      cb = function (err) {
        cb = _cb
        if(c !== _c) drain(value)
        else _cb()
      }
    }
  }

  return update

}

var Stats = require('statistics')

function UpdateByDutyCycle (duty, write) {
  var busy = false, writeTime, stats = Stats()
  return function (value) {
    if(busy) return
    var start = Date.now()
    write(value, function (_) {
      stats.value(Date.now() - start)
      busy = false
    })
  }
}

module.exports = UpdateByCountAndOrDelay

