const Storage = require('../storage')

module.exports.handler = function (event, context) {
  const q = decodeURIComponent(event.q)

  const storage = new Storage()

  return storage.find(q)
  .then(function (datasets) {
    return context.succeed({
      success: true,
      items: datasets.hits.hits.map(function (hit) {
        return hit._source
      })
    })
  })
  .catch(function (error) {
    console.log(error)
    return context.succeed({
      success: false,
      error: error.message || error
    })
  })
}
