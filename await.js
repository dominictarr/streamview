function Await () {
  var cbs = [], ready = false

  function await (cb) {
    if(ready) cb()
    else cbs.push(cb)
  }

  await.ready = function () {
    ready = true
    while(cbs.length) cbs.shift()()
  }

  return await
}




