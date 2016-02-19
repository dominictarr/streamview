var level = require('level')
var pull = require('pull-stream')
var Write = require('pull-write')
var pl = require('pull-level')

//sorted index.

module.exports = function (path, links, version) {

  var db = level(path)

  return {
    init: function (cb) {
      db.get('~meta~', function (err, value) {
        if(value)
          try { value = JSON.parse(value) }
          catch (err) { return cb(null, 0) }

        if(err) //first time this was run
          cb(null, 0)
          
        //if the view has changed, rebuild entire index.
        //else, read current version.
        else if(version && value.version !== version)
          level.destroy(path, function (err) {
            if(err) return cb(err)
            db = level(path)
            cb(null, 0)
          })
        else
          cb(null, value.since || 0)
      })
    },
    write: function (cb) {
      return pull(
        Write(function (batch, cb) {
          db.batch(batch, cb)
        }, function (batch, data) {
          if(!batch)
            batch = [{
              key: '~meta~',
              value: {version: version, since: data.ts},
              valueEncoding: 'json',
              type: 'put'
            }]
          function push(ary) {
            batch.push({key: ary.join('!'), value: ' ', type: 'put'})
          }
          links(data, function (link) {
            console.log('onLink', link)
//            push([">", link.source, link.rel, link.dest, data.key])
//            push(["<", link.dest, link.rel, link.source, data.key])
            
            push(["SDR", link.source, link.dest, link.rel, data.key])
            push(["DRS", link.dest, link.rel, link.source, data.key])
            push(["RDS", link.dest, link.rel, link.source, data.key])
          })
          batch[0].value.since = data.ts
          return batch
        }, 100, cb)
      )
    },
    read: function (opts) {
      return pl.read(db, opts)
    }
  }
}

