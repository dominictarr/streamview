
var tape = require('tape')
var osenv = require('osenv')
var path = require('path')
var pull = require('pull-stream')
var Links = require('../links')
var rimraf = require('rimraf')

tape('simple', function (t) {
  var linksPath = path.join(osenv.tmpdir(), 'test_stream-view_links')
  rimraf.sync(linksPath)

  var links = Links(linksPath, function (data, onLink) {
    console.log('links for', data)
    for(var k in data.value)
      onLink({source: data.key, dest: data.value[k], rel: k})
  }, 1)

  links.init(function (err, since) {
    if(err) throw err
    t.notOk(since)
    pull(
      pull.values([
        {key: 'START', value: {read: 'READY'}, ts: 1},
        {key: 'READY', value: {
          read: 'START', error: "ERROR", end: "END"}, ts: 2},
        {key: 'ERROR', value: {}, ts: 3},
        {key: 'END', value: {error: 'END'}, ts: 4},
      ]),
      links.write(function (err) {
        if(err) throw err
        pull(
          links.read(),
          pull.collect(function (err, ary) {
            if(err) throw err
            console.log(ary)
            t.end()
          })
        )
      })
    )
  })
})
