//a simple stream view that reduces all values into a single
//value. suitable for counts, sums, that produce a single value.

var Update = require('./update')
var Notify = require('./notify')
var pull = require('pull-stream')

module.exports = function ReduceStreamView (reduce, get, set) {
  var since = null, value = null, last = Date.now()
  var update = Update(set)
  var notify = Notify()
  return {
    init: function (cb) {
      get(function (err, data) {
        if(err) return cb(err)
        if(data) {
          value = data.value
          since = data.key
        }
        cb(null, since)
      })
    },
    write: function (cb) {
      var self = this
      return pull.drain(function (data) {
        if(data.sync) return
        since = data.key
        value = reduce(value, data.value, data.key)
        notify(data.key)
        update({key: data.key, value: value})
      }, function (err) {
        update.flush(cb)
      })
    },
    listen: notify.listen,
    manifest: 'sync',
    api: function () {
      return value
    }
  }
}

/*
{
  init: (cb),
//  latest: (listener)
  onLatest: listener, //set a listener
  write: Sink,
  manifest: ''||{}, //just one string incase it's just one method.
  api: () || {...}
}

var sv = StreamView(
  function set (value, cb) { db.put('count', value, cb) },
  function get (cb) { db.get('count', cb) }
)

sv.init(function (err, since) {
  pull(
    pl.read(db, {gte: since || null, values: false, keys: true, live: true}),
    sv.write()
  )
})

api = delayApi(sv.api, sv.mainfest, sv.latest)
*/

// stream-views are async, so just because the write callbacked doesn't mean
// that the view is consistent. so, we can either delay the write callback
// until all the views are ready, or we can delay our read from a specific
// view until that view is up to date. Sometimes it might not matter,
// and a stale view is fine.
//
// it would be pretty simple to delay any view api... if we have a manifest
// then we can defer the streams. Also, that means we get clients for free!
// that means we just need an api to track where a given stream-view is consistent to.

