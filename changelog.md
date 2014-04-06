# Change Log - cluster-role

### 0.1.0, 2014-04-06
* Fork no longer quits if called incorrectly in Worker process, only errors then do nothing
* `config` spec changed to array
* `spawn()` introduced to replace `start()`, and may be called multiple times
* `respawn` worker property now defaults to false
* Fixed various path resolution - should now also work on Windows
* Respects a custom worker directory that can be passed in
* Clearer `ps` output by using relative path for the worker bootstrap JS

### 0.0.1, 2014-04-05
First release