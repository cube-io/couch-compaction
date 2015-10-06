couch-compaction
================

This is a tiny binary that triggers compaction on a couch database from cli.

> Compaction compresses the database file by removing unused sections created during updates.

(See: https://wiki.apache.org/couchdb/Compaction)

Installation
------------

Download the package:

    git clone git@github.com:cube-io/couch-compaction
    
Usage
-----

Go to the git repo and run:

    ./bin/compaction -h <couch db url>
