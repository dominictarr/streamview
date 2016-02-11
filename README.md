# stream-view

streaming database views.

a StreamView takes a streamable log,
and computes (and possibly persists) a view on that data.
By storing the point at which the view is valid (probably
the sequence number or key of the last log entry it saw),
a StreamView can reconnect to the log at that point,
without rebuild the view.

This means a StreamView can be a distributed system,
which has many advantages:

* a StreamView can be async.
* a StreamView can be on another machine from the log,
  and catchup after a log connection fails
* a StreamView doesn't need to be durable, since a StreamView
  can catchup with the log after a restart,
  it's fine to have the a memory based view that is only persisted occasionally.
* a StreamView can be modified, and if a rebuild is necessary,
  that can be handled in the same way as a catchup.

Earlier I created [level-sublevel](https://github.com/dominictarr/level-sublevel),
as an easy way to create indexes on top of leveldb.
It was simple and worked well but is somewhat inflexible.
In level-sublevel views had to be sync (so you couldn't do io in them)
and they where difficult to upgrade.

However, since StreamViews are async, it means at after a write to the log,
there may be a period where a given view is not consistent. And often
we want to be able to write something and then read it back another way.
To achive this with a StreamView, if we write something then want to read it from a view,
we can just atomatically delay that read until after that particular view has processed that write.

Then you read your own writes and once a view read has succeeded for you,
another reader will be able to read that too.

## Links

* [my initial idea for this architecture](https://gist.github.com/dominictarr/2934a6aa17061a67d012)
* I got the name "stream view" from [the Octopus DB paper](https://infosys.uni-saarland.de/publications/DJ11.pdf)
* This is also known as [kappa architecture](http://milinda.pathirage.org/kappa-architecture.com/) especially when used in the context of "Big Data" (although in my opinion that is a really terrible name because naming it after a random greek letter does give any hints about what it might be)


## Status

Work in Progress.

## License

MIT


