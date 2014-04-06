var cluster = require('cluster'),
	path = require('path');

if (cluster.isMaster) {
	console.warn('Bootstrap for worker processes is being run in Master mode!');
}

var workerDir = process.env['NODE_WORKER_DIR'],
	workerRole = process.env['NODE_WORKER_ROLE'];

if (workerRole) {
	require(path.join(workerDir, workerRole));
}
