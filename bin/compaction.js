#!/usr/bin/env node
var argv = require("yargs")
	.usage("Usage: $0 [options]")
	.string("h")
	.alias("h", "host")
	.describe("h", "Host to trigger compaction on")
	.default("h", "http://localhost:5986")
	.argv;

var nano = require("nano")(argv.h);

nano.db.list(function(err, list) {
	if (err) {
		throw new Error("Could not get database list", err);
	}
	
	list.forEach(compactIfShard);
});

function compactIfShard(name) {
	if (name.indexOf("shards") != 0) {
		return;
	}
	
	compact(name);
	viewCleanup(name);
}

function compact(name) {
	nano.db.compact(name, function(err, result) {
		if (err) {
			return console.log("Could not start compact on database:", name, err);
		}
		
		console.log("Compaction started on database:", name);
	});
}

function viewCleanup(name) {
	nano.request({
		path: name + "/_view_cleanup",
		method: "post"
	}, function(err, result) {
		if (err && err.statusCode == 404) {
			return console.log("No views to clean up on database:", name);
		}
		if (err) {
			return console.log("Could not start view cleanup on database:", name, err);
		}
		
		console.log("View cleanup started on database:", name);
	});
}
