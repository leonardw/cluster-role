var cluster = require('cluster'),
	path = require('path'),
	callsite = require('callsite');

var CPU_CORES = require('os').cpus().length;

var workerEnv = null;

function start(workerConfig, workerDir) {
	if (!cluster.isMaster) {
		console.error('Terminated. Attempt to run Master in Worker mode.');
		process.exit(1);
	}
	
	// only run once
	if (workerEnv) {
		return;
	}
	
	workerEnv = {};

	var stack = callsite(),
		caller = stack[1].getFileName(),
		callerDir = path.dirname(caller);
	console.log('callerDir:', callerDir);
	
	var workerDir = callerDir + '/worker';
	console.log('workerDir:', workerDir);
	
	
	console.log('process.cwd:', process.cwd());
	console.log('__filename:', __filename);
	console.log('__dirname:', __dirname);
	
	var extargs = process.argv.slice(2);
	// purely cosmetic for now; this replaces fork(ENV) once issue is fixed
	// https://github.com/joyent/node/issues/4149
	extargs.push('--slave');

	// change default fork() behaviour
	cluster.setupMaster({
		exec : __dirname + '/worker',
		args : extargs
	});

	// fork worker processes
	for (var role in workerConfig) {
		var prop = workerConfig[role];
		var instance = (prop.instance === 'cpu')? CPU_CORES : prop.instance;
		for (var i = 0; i < instance; i++) {
			var env = {
				NODE_WORKER_DIR: workerDir,
				NODE_WORKER_ROLE: role,
				NODE_WORKER_ROLE_INSTANCE: instance,
				NODE_WORKER_ROLE_RESPAWN: prop.respawn
			};
			
			var worker = cluster.fork(env);
			workerEnv[worker.id] = env;
		}
	}

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
			var spawn = cluster.fork(env);
			workerEnv[spawn.id] = env;
		}
		showWorkers();
	});
	showWorkers();
	
}

function showWorkers() {
	console.log('workers:', workerEnv);
}

module.exports = {
	start: start,
	isMaster: cluster.isMaster,
	isWorker: cluster.isWorker
}
