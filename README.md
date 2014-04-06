# cluster-role

A wrapper around the native Node 'cluster' built-in, that provides a convenient interface to start up
multiple workers by configuration. Workers can be configured to perform different roles; multiple instances
of the same role can be set; a worker of the same role can automatically respawn if one dies.


## Usage

```js
var cluster = require('cluster-role');
if (cluster.isMaster) {
    cluster.start({
        webhttp: {
            instance: "cpu",
            respawn: true
        },
        adminhttp: {
            instance: 2,
            respawn: true
        }
    });
}
```


##License

(The MIT License)

Copyright (c) 2014 Leonard Wu <leonard.wu92@alumni.ic.ac.uk>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.