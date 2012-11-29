var adapters = [
    ['idb-1', 'http-1']
  ]
  , qunit = module;

if (typeof module !== undefined && module.exports) {
  this.Pouch = require('../src/pouch.js');
  this.LevelPouch = require('../src/adapters/pouch.leveldb.js');
  this.utils = require('./test.utils.js');

  for (var k in this.utils) {
    global[k] = global[k] || this.utils[k];
  }
  adapters = [
    ['leveldb-1', 'http-1']
  ]
  qunit = QUnit.module;
}

adapters.map(function(adapters) {

  qunit('test for issue 221', {
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
        // Update the doc.
        doc._rev = results.rev;
        doc.integer = 1;
        remote.put(doc, {}, function(err, results) {
          // Compact the db.
          Pouch.utils.ajax({
            url: self.remote + '/_compact',
            type: 'POST',
            contentType: 'application/json',
            success: function(data, status, jqXHR) {
              // Wait until compaction has affected the doc.
              var checkDoc = function() {
                Pouch.utils.ajax({
                  url: self.remote + '/' + doc._id + '?revs_info=true',
                  dataType: 'json',
                  success: function(data, status, jqXHR) {
                    var correctRev = data._revs_info[0];
                    if (data._revs_info[1].status == 'missing') {
                      clearInterval(interval);
                      // Replicate to PouchDB.
                      local.replicate.from(remote, function(err, results) {
                        // Check the PouchDB doc.
                        local.get(doc._id, function(err, results) {
                          ok(results._rev == correctRev, 'correct rev stored after replication');
                          ok(results.integer == 1, 'correct content stored after replication');
                          start();
                        });
                      });
                    }
                  }
                });
              };
              console.log('setting');
              var interval = setInterval(checkDoc, 100);
            }
          });
        });
      });
    });
  });
});
