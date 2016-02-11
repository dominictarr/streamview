

module.exports = function (sv) {
  var ready = false, expected = []
  sv.listen(function (key) {
    while(expected[0] <= key) expected.shift()
  })

  validateManifest(vs)

  return {
    init: function (cb) {
      sv.init(function (err) {
        if(!err) ready = true
        cb(err)
      })
    },
    write: function (cb) {
      //if init was not called, write should throw.
      if(!ready) {
        try {
          sv.write(cb)
        } catch (err) {
          throw err
        }
        throw new Error('init did not callback yet, so write *must* thow')
      }
      //wrap to check that each write is eventually emited as latest
      return pull(
        pull.through(function (e) {
          expected.push(e.key)
        }),
        sv.write(cb)
      )
    },
    listen: function (listener) {
      sv.listen(listener)
    },
    //properties that are only for the validator.
    expected: expected,
    validate: function () {
      if(expected.length)
        throw new Error('some expected values not acknowledged:'+JSON.stringify(expected))
    }
  }

}
