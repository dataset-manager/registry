const semver = require('semver')
const GitHubApi = require('github')
const Storage = require('../storage')

function checkIfCollaborator (github, data) {
  return new Promise(function (resolve, reject) {
    github.repos.checkCollaborator(data, function (err, res) {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}

function getCurrentUser (github) {
  return new Promise(function (resolve, reject) {
    github.users.get(function (err, res) {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}

module.exports.handler = function (event, context) {
  const name = decodeURIComponent(event.name)
  var pkg
  try {
    pkg = JSON.parse(event.body)
  } catch (error) {
    return context.succeed({
      success: false,
      error
    })
  }

  const storage = new Storage()

  const github = new GitHubApi()
  github.authenticate({
    type: 'oauth',
    token: pkg.githubToken
  })

  return Promise.all([
		getCurrentUser(github),
  	storage.findOne(name)
	]).then(function (res) {
		const user = res[0]
		const data = res[1]
    const action = 'create'
    if (data) {
      action = 'update'
      if (data.author.id !== user.id) {
        return context.succeed({
          success: false,
          error: new Error('A plugin with the same name has already been published.')
        })
      }
      if (data.versions && data.versions.some(v => semver.gte(v.tag, pkg.tag))) {
        return context.succeed({
          success: false,
          error: new Error('A version with a higher tag was already published.')
        })
      }
    }

    const versions = (data || {}).versions || []
    versions.push({
      tag: pkg.tag,
      datURL: pkg.datURL,
      publishedAt: new Date()
    })

    return storage[action](name, {
      name,
      keywords: pkg.keywords,
      description: pkg.description,
			dependencies: pkg.dependencies,
			author: {
				id: user.id,
				username: user.username
			}
      versions,
      lastPublishedAt: new Date()
    })
  })
  .then(function () {
    return context.succeed({
      success: true
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
