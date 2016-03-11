# streamview

a database view that consumes a streamable (write ahead) log.

## motivation

Previously, when I wanted a index or a view on to a leveldb,
I used [level-sublevel](https://github.com/dominictarr/level-sublevel).
sublevel worked by dividing the database into nested sections,
and since it's all one database, a write could be atomic across
multiple sections. So, to create an index, detect when a write is
about to occur (via `db.pre(hook)`) and insert the index also.

This worked pretty well for a time, but some problems started to arise

* a view/index cannot be async
* aggregate views, even a simple count was not possible.
* but worse: difficult to migrate a view

The last one is the biggest problem. If you where actually using this
to build software, you had to run some special batch-mode script to
regenerate the index, if you, say, fixed a bug in that index or added
a feature to it.

A `streamview` is a very different pattern to sublevel, but can also
be used to create views or indexes, and solves the above problems.
A `streamview` stores the point it was currently up to in the main log,
so that if the database crashes, it can recover without rereading the whole
database, on startup, it reads that value, then restreams the log from that point.
This async separation has several new benefits.

* since the view is rebuilt, updating it is just starting over.
* since it's separate, the view doesn't even need to be persisted in leveldb.
  room opens to experiment with different, simpler persistence mechanisms (i.e. memory or files ;)
* the view could even be implemented in another process in another language or on another machine.

But this does create one new difficulty:

* to perform a write to the main log, and then read a view consistently with that write, you have to wait until the view has processed that write.

So, whatever module implements a streamview needs to provide notifications about where it is currently up to.

## Api

Streamviews are very generic, so they don't really need to inherit from a common module,
just implement a common pattern.

### init (cb(err, since))

Initialize the streamview, reading where the current view is currently up to.
If the view code has changed, this should return to zero, so a rebuild occurs.

### write(cb)

Create a sink pull-stream (aka, writable) that puts data into this view.

to get a streamview running, initialize it, then connect it to the log.

``` js
var sv = YourStreamview(args...)

sv.init(function (err, since) {
  if(err) //disaster, fs is borked
  pull(
    mainlog.read({gt: since, live: true}),
    sv.write(function (err) {
      //the mainlog ended for some reason, and all of the view's
      //writes are flushed.
    })
  )
})
```

Normally, in production, you'd connect the view to the log as a live stream,
it's always going, waiting for the next item. However, in testing it's
useful to have a log stream that ends, with the view consistent, so that
you can test it.

## listen (onWrite(since)) => rm()

call `listen` with an `onWrite` function, and `onWrite`
will be called whenever a write has been processed, with the currently
most up to date sequence number. The streamview does not need to
callback for _every_ sequence number (although it may) but each
sequence _must_ be monotonically increasing. 

listen also returns a function `rm`, which removes that listener.

## read

What sort of read interface the streamview creates is totally an implementation detail.

## Example

This module is a very simple demonstration of the streamview idea,
and provides a steamview made from a reduce function.

you must provide a `get` and `set` function. Here is a simple example
that stores the current state in a file. Naturally since in this example,
the entire file is rewritten each time, it would not be suitable for when
the result of the reduce function grows large, but would be fine when it
stays approximately the same, as in a count or a sum.

``` js
var Reduce = require('streamview')
var fs = require('fs')
var filename = '/tmp/streamview-example'
//the simplest reduce is counter.
var sv = Reduce(function (a, b) {
  //be sure to handle the initial case.
  if(!a) a = 0
  return a + 1
},
//get current state
function (cb) {
  fs.readFile(filename, 'utf8', function (err, data) {
    if(err) cb(err)
    try {
      data = JSON.parse(data)
    } catch (err) {
      return cb(err)
    }
    return cb(null, data)
  })
},
//set current state
function (data, cb) {
  fs.writeFile(filename, JSON.stringify(data), cb)
})

```

## Links

* [my initial idea for this architecture](https://gist.github.com/dominictarr/2934a6aa17061a67d012)
* I got the name "stream view" from [the Octopus DB paper](https://infosys.uni-saarland.de/publications/DJ11.pdf)
* This is also known as [kappa architecture](http://milinda.pathirage.org/kappa-architecture.com/) especially when used in the context of "Big Data" (although in my opinion that is a really terrible name because naming it after a random greek letter does give any hints about what it might be)
* [streamview-links](https://github.com/dominictarr/streamview-links) is a far more interesting streamview.

## License

MIT








