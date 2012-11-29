var adapters = [
    ['idb-1', 'http-1']
  ]
  , qunit = module;

if (typeof module !== undefined && module.exports) {
  this.Pouch = require('../src/pouch.js');
  this.LevelPouch = require('../src/adapters/pouch.leveldb.js');
  this.utils = require('./test.utils.js')
  this.ajax = Pouch.utils.ajax

  for (var k in this.utils) {
    global[k] = global[k] || this.utils[k];
  }
  adapters = [
    ['leveldb-1', 'http-1']
  ]
  qunit = QUnit.module;
}
else global = window

adapters.map(function(adapters) {

  qunit('second test for issue 221', {
    setup: function() {
      this.local = generateAdapterUrl(adapters[0]);
      this.remote = generateAdapterUrl(adapters[1]);
    }
  });

  var doc = { _id: '0', integer: 0 };

  asyncTest('Testing issue 221', function() {
    var self = this;
    // Create databases.
    initDBPair(this.local, this.remote, function(local, remote) {
      // Write a doc in CouchDB.
      remote.put(doc, {}, function(err, results) {
        doc._rev = results.rev;
        // Second doc so we get 2 revisions from replicate.
        remote.put(doc, {}, function(err, results) {
          doc._rev = results.rev;
          
          local.replicate.from(remote, function(err, results) {

            doc.integer = 1;
            // One more change
            remote.put(doc, {}, function(err, results) {
              // Testing if second replications fails now
              local.replicate.from(remote, function(err, results) {
                local.get(doc._id, function(err, results) {
                  ok(results.integer == 1, 'correct content stored after replication');
                  start();
                });
                
              })
            })
          });
        });
      });
    });
  });
});
