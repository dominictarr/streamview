
var tape = require('tape')

var Reduce = require('../reduce')
var Validate = require('../validate')
var pull = require('pull-stream')

function Range (start, end) {
  if(null == end) end = Infinity
  if(null == start) start = 0
  return function (abort, cb) {
    if(abort) cb(abort)
    else if (start > end) cb(true)
    else cb(null, start++)
  }
}

function toKV () {
  return pull.map(function (n) {
    return {key: n, value: 1}
  })
}

tape('ReduceStreamView works as counter (from zero)', function (t) {

  var written = false

  var sv = Reduce(function (acc, _) {
    return (acc || 0) + 1
  }, function (cb) {
    cb(null, {key: 0, value: 0})
  }, function (data, cb) {
    //ignore writes
    written = data.key
    cb()
  })

  sv.listen(function (key) {
    latest = key
  })

  sv.init(function (err, since) {
    if(err) throw err
    t.equal(since, 0)

    pull(
      Range(1, 100), toKV(),
      sv.write(function (err) {
        if(err) throw err
        t.equal(sv.api(), 100)
        t.ok(written)
        t.end()
      })
    )
  })

})


tape('ReduceStreamView works as counter (from 100)', function (t) {

  var sv = Reduce(function (acc, _) {
    return (acc || 0) + 1
  }, function (cb) {
    cb(null, {key: 100, value: 100})
  }, function (value, cb) {
    //ignore writes
    cb()
  })

  sv.listen(function (key) {
    latest = key
  })

  sv.init(function (err, since) {
    if(err) throw err
    t.equal(since, 100)

    pull(
      Range(since+1, since+100), toKV(),
      sv.write(function (err) {
        if(err) throw err
        t.equal(sv.api(), 200)
        t.end()
      })
    )
  })

})

tape('ReduceStreamView works as counter (start and recover)', function (t) {
  var value
  function get (cb) {
    cb(null, value)
  }
  function set (_value, cb) {
    value = _value
    cb()
  }
  var sv = Reduce(function (acc, _) {
    return (acc || 0) + 1
  }, get, set)

  var sv2 = Reduce(function (acc, _) {
    return (acc || 0) + 1
  }, get, set)

  sv.listen(function (key) {
    latest = key
  })

  sv.init(function (err, since) {
    if(err) throw err
    t.equal(since, null)

    pull(
      Range((since||0)+1, (since||0)+100), toKV(),
      sv.write(function (err) {
        if(err) throw err
        t.equal(sv.api(), 100)

        sv2.init(function (err, since) {
          if(err) throw err
          t.equal(since, 100, 'since: 100')
          pull(
            Range((since||0)+1, (since||0)+100), toKV(),
            sv2.write(function (err) {
              if(err) throw err
              t.equal(sv2.api(), 200, 'api(): 200')
              t.end()
            })
          )
        })

      })
    )
  })

})

