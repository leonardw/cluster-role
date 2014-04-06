var cluster = require('cluster'),
	path = require('path'),
	callsite = require('callsite');

var CPU_CORES = require('os').cpus().length;

var workerEnv = {};

cluster.on('online', function(worker) {
	console.info('Worker %d %s (PID %d) online', worker.id, workerEnv[worker.id].NODE_WORKER_ROLE, worker.process.pid);
});

cluster.on('listening', function(worker, address) {
	console.info('Worker %d %s (PID %d) listening on %s:%d', worker.id, workerEnv[worker.id].NODE_WORKER_ROLE, worker.process.pid, address.address, address.port);
});

cluster.on('disconnect', function(worker) {
	console.warn('Worker %d %s (PID %d) disconnected', worker.id, workerEnv[worker.id].NODE_WORKER_ROLE, worker.process.pid);
});

cluster.on('exit', function(worker, code, signal) {
	var env = workerEnv[worker.id],
		respawn = env && env.NODE_WORKER_ROLE_RESPAWN;
	
	console.warn('Worker %d %s (PID %d) died (%s)%s', worker.id, env.NODE_WORKER_ROLE, worker.process.pid, signal||code, respawn?'. Respawning...':'');
	
	delete workerEnv[worker.id];
	if (respawn) {
		var phoenix = cluster.fork(env);
		workerEnv[phoenix.id] = env;
	}
});

function spawn(config, dir) {
	if (!cluster.isMaster) {
		console.error('Unable to run Master in worker process.');
		return;
	}
	
	if (!Array.isArray(config)) {
		config = [config];
	}

	var stack = callsite(),
		caller = stack[1].getFileName(),
		callerDir = path.dirname(caller);
	
	var workerDir = (dir)? path.resolve(callerDir, dir) : path.join(callerDir, 'worker');
	
	var extargs = process.argv.slice(2);
	// purely cosmetic for now; this should replace env-based bootstrapping once issue 4149 is fixed
	// https://github.com/joyent/node/issues/4149
	extargs.push('--slave');
	
	var bootstrap = path.relative(process.cwd(), path.join(__dirname, 'worker'));
	
	// change default fork() behaviour
	cluster.setupMaster({
		exec : bootstrap,
		args : extargs
	});

	// fork worker processes
	config.forEach(function(prop) {
		var instance = (prop.instance === 'cpu')? CPU_CORES : (prop.instance || 1),
			respawn = (prop.respawn === undefined)? false : prop.respawn;
		for (var i = 0; i < instance; i++) {
			var env = {
				NODE_WORKER_DIR: workerDir,
				NODE_WORKER_ROLE: prop.role,
				NODE_WORKER_ROLE_INSTANCE: instance,
				NODE_WORKER_ROLE_RESPAWN: respawn
			};
			
			var worker = cluster.fork(env);
			workerEnv[worker.id] = env;
		}
	});
}

module.exports = {
	spawn: spawn,
	isMaster: cluster.isMaster,
	isWorker: cluster.isWorker
};
