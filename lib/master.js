var cluster = require('cluster'),
	path = require('path'),
	callsite = require('callsite');

var CPU_CORES = require('os').cpus().length;

var workerEnv = {},
	workerRole = {};

var roleListening = {},
	roleListenCallback = {};
function onListen(role, callbk) {
	roleListenCallback[role] = callbk;
}

cluster.on('online', function(worker) {
	var env = workerEnv[worker.id],
		role = env? env.NODE_WORKER_ROLE : '';
	console.info('Worker %d %s (PID %d) online', worker.id, role, worker.process.pid);
});

cluster.on('listening', function(worker, address) {
	var env = workerEnv[worker.id],
		role = env? env.NODE_WORKER_ROLE : '';
	console.info('Worker %d %s (PID %d) listening on %s:%d', worker.id, role, worker.process.pid, address.address, address.port);
	var callbk = roleListenCallback[role];
	if (callbk instanceof Function && !(role in roleListening)) {
		callbk(worker, address, env);
		roleListening[role] = 1;
	}
});

cluster.on('disconnect', function(worker) {
	var env = workerEnv[worker.id],
		role = env? env.NODE_WORKER_ROLE : '';
	console.warn('Worker %d %s (PID %d) disconnected', worker.id, role, worker.process.pid);
});

cluster.on('exit', function(worker, code, signal) {
	var env = workerEnv[worker.id],
		respawn = env && env.NODE_WORKER_ROLE_RESPAWN,
		role = env? env.NODE_WORKER_ROLE : '<unknown>';
	
	if (worker.suicide === true || code === 0) {
		console.warn('Worker %d %s (PID %d) suicide%s', worker.id, role, worker.process.pid, respawn?'. Respawning cancelled.':'');
		respawn = false;
	} else {
		console.warn('Worker %d %s (PID %d) died (%s)%s', worker.id, role, worker.process.pid, signal||code, respawn?'. Respawning...':'');
	}
	
	delete workerEnv[worker.id];
	var wr = workerRole[role];
	if (wr) {
		delete wr[worker.id];
	}
	
	if (respawn) {
		var phoenix = cluster.fork(env);
		workerEnv[phoenix.id] = env;
		
		var wr = workerRole[role];
		if (wr === undefined) {
			wr = {};
			workerRole[role] = wr;
		}
		wr[phoenix.id] = worker;
	}
});

var autoPort = 8000;
function autoAssignPort() {
	if (autoPort === process.env.PORT) {
		autoPort++;
	}
	return autoPort++;
}

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
			respawn = (prop.respawn === undefined)? false : !!prop.respawn,
			port = (prop.port === 'auto')? autoAssignPort() : prop.port;
		for (var i = 0; i < instance; i++) {
			var env = {
				NODE_WORKER_DIR: workerDir,
				NODE_WORKER_ROLE: prop.role,
				NODE_WORKER_ROLE_INSTANCE: instance,
				NODE_WORKER_ROLE_RESPAWN: respawn
			};
			
			if (port !== undefined) {
				env['PORT'] = port;
			}
			
			var worker = cluster.fork(env);
			workerEnv[worker.id] = env;
			
			var wr = workerRole[prop.role];
			if (wr === undefined) {
				wr = {};
				workerRole[prop.role] = wr;
			}
			wr[worker.id] = worker;
		}
	});
}

function send(role, msg) {
	var wr = workerRole[role];
	if (wr) {
		for (var workerId in wr) {
			wr[workerId].send(msg);
		}
	}
}

module.exports = {
	spawn: spawn,
	onListen: onListen,
	send: send,
	isMaster: cluster.isMaster,
	isWorker: cluster.isWorker
};
