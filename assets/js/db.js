var db = (function () {
  var DB_NAME = 'metro-news-db';
  var TABLE_NAME = 'news';

  var dbPromise = idb.open(DB_NAME, 1, function (db) {
    if (!db.objectStoreNames.contains(TABLE_NAME)) {
      var store = db.createObjectStore(TABLE_NAME, {
        keyPath: 'id',
      });
      store.createIndex('by-date', 'publishedAt');
    }
  });

  var getNews = function (id) {
    return dbPromise.then(function (db) {
      return db
        .transaction(TABLE_NAME, 'readwrite')
        .objectStore(TABLE_NAME)
        .get(id);
    });
  };

  var writeNews = function (data) {
    return dbPromise.then(function (db) {
      var tx = db
        .transaction(TABLE_NAME, 'readwrite')
        .objectStore(TABLE_NAME)
        .put(data);
      return tx.complete;
    });
  };

  var readAllNews = function () {
    return dbPromise.then(function (db) {
      return db
        .transaction(TABLE_NAME, 'readonly')
        .objectStore(TABLE_NAME)
        .getAll();
    });
  };

  var deleteNews = function (id) {
    return dbPromise.then(function (db) {
      var tx = db
        .transaction(TABLE_NAME, 'readwrite')
        .objectStore(TABLE_NAME)
        .delete(id);
      return tx.complete;
    });
  };

  var clearAll = function () {
    return dbPromise.then(function (db) {
      var tx = db
        .transaction(TABLE_NAME, 'readwrite')
        .objectStore(TABLE_NAME)
        .clear();
      return tx.complete;
    });
  };

  var getDbSize = function () {
    return dbPromise.then(function (db) {
      var tx = db.transaction(TABLE_NAME, 'readwrite');
      var store = tx.objectStore(TABLE_NAME);
      var byDateIndex = store.index('by-date');
      var countRequest = byDateIndex.count();
      return countRequest;
    });
  };

  var deleteStaleData = function () {
    return dbPromise.then(function (db) {
      var tx = db.transaction(TABLE_NAME, 'readwrite');
      var store = tx.objectStore(TABLE_NAME);

      store.index('by-date')
        .openCursor(null, 'prev')
        .then(function (cursor) {
          if (!cursor) {
            return;
          }
          return cursor.advance(19);
        }).then(function deleteRest(cursor) {
          if (!cursor) {
            return;
          }
          cursor.delete();
          return cursor.continue().then(deleteRest);
        });
    });
  };

  return {
    getNews: getNews,
    writeNews: writeNews,
    readAllNews: readAllNews,
    clearAll: clearAll,
    deleteNews: deleteNews,
    getDbSize: getDbSize,
    deleteStaleData: deleteStaleData
  };
})();
