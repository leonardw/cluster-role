# cluster-role

A wrapper around the native Node 'cluster' built-in, that provides a convenient interface to start up
multiple workers by configuration. Workers can be configured to perform different roles; multiple instances
of the same role can be set; a worker of the same role can automatically respawn if one dies.

Features:
* Start workers of different roles, multiple instances per role, en masse by configuration
* Automatic bootstrapping of worker processes to start the required 'role'
* Configurable number of instances per role, or bound to CPU cores
* Configurable respawning of new worker process to replace deceased ones


## Installation

```sh
npm install cluster-role
``` 

## Usage

The following is taken from full demo code at [node-cluster-example](https://github.com/leonardw/node-cluster-example)

```js
var cluster = require('cluster-role');

if (cluster.isMaster) {
    // Start a group of workers running ./worker/webhttp.js,
    // of as many instances as there are CPU cores, and respawn
    // new ones if any dies.
    // Also start another group of 2 workers running
    // ./worker/adminhttp.js, and respawn if any dies.
    cluster.spawn([
        {
            "role": "webhttp",
            "instance": "cpu",
            "respawn": true
        },
        {
            "role": "adminhttp",
            "instance": 2,
            "respawn": true
        }
    ]);

    // Now start a single worker running ./extra/extrahttp.js,
    // do not respawn if it dies.
    cluster.spawn({
        "role": "extrahttp"
    }, './extra');
}
```

## API

#### .isMaster
True if the process is a master. This is a convenience to the underlying Node 'cluster' implementation

#### .isWorker
True if the process is a worker. This is a convenience to the underlying Node 'cluster' implementation

#### .spawn(config, [dir])
Start worker processes described by `config`. This may be a single role object, or an array of multiple role objects.
Each may have the following properties: 

* `role` : This should correspond to an executable JS file in `dir` where workers reside.
* `instance` (optional) : The number of worker instances to spawn, or `'cpu'` to denote the number of CPU cores.
Defaults to 1.
* `respawn` (optional) : Whether to respawn a new process when one dies. Defaults to `true`.

Additionally, a custom worker directory can be specified.
* `dir` (optional) : The name of a directory where all worker JS files reside. Defaults to a subdirectory named `worker`
under the same directory as the JS that initiated `spawn()`.




##License

(The MIT License)

Copyright (c) 2014 Leonard Wu <leonard.wu92@alumni.ic.ac.uk>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
