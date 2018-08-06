const log_conf = {
	"appenders": {
		"out": {
			"type": "console",
			"layout": {
				"type": "colored"
			}
		},
		"node_server": {
			"category": "node_server",
			"type": "dateFile",
			"filename": __dirname+"/logs/node.log",
			"pattern": "-yyyyMMdd",
			"layout": {
				"type": "basic"
			}
		},
        "node_queue": {
            "type": "dateFile",
            "filename": "./logs/queue.log",
            "pattern": "-yyyyMMdd",
            "layout": {
                "type": "basic"
            }
        }
	},
	"categories": {
		"default": {
			"appenders": ["out", "node_server", "node_queue"],
			"level": "DEBUG"
		}
	}
}
exports.log_conf = log_conf;
