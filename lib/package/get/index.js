const Storage = require('../storage')

module.exports.handler = function (event, context) {
  const name = decodeURIComponent(event.name)

  const storage = new Storage()

  return storage.findOne(name)
		.then(function (plugin) {
			return context.succeed({
				success: true,
				item: plugin
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
