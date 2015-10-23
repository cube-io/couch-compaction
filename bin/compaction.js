#!/usr/bin/env node
var argv = require("yargs")
	.usage("Usage: $0 [options]")
	.string("h")
	.alias("h", "host")
	.describe("h", "Host to trigger compaction on")
	.example("h", "http://localhost:5986")
	.argv;

if (!argv.h) {
	console.log("Usage: -h [database]");
	process.exit(1);
}

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
	compactViews(name);
	viewCleanup(name);
}

function compact(name, design) {
	nano.db.compact(name, design, function(err, result) {
		if (err) {
			if (design) {
				return console.log("Could not start compact on database:", name, "view:", design, err);
			}
			return console.log("Could not start compact on database:", name, err);
		}

		if (design) {
			return console.log("Compaction started on database:", name, "view:", design);
		}
		console.log("Compaction started on database:", name);
	});
}

function compactViews(name) {
	nano.request({
		db: name,
		path: "_all_docs",
		qs: {
			startkey: "_design/",
			endkey: "_design0"
		}
	}, function(err, result) {
		if (err) {
			return console.log("Could not get views on database:", name, err);
		}

		if (result.rows.length == 0) {
			return console.log("No views to perform compaction on for database:", name);
		}

		result.rows.forEach(function(view) {
			var design = view.id.replace("_design/", "");
			compact(name, design);
		});
	})
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
