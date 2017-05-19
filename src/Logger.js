
var godsend = require('godsend');
var uuid = require('uuid');

Logger = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	install: function() {
		
		this.connection.mount({
			id: 'request-logger',
			weight : -100,
			on: function(request) {
				request.accept();
			}.bind(this),
			run: function(stream) {
				if (! stream.request.logged) {
					stream.request.logged = true;
					var pattern = stream.request.pattern;
					if (! godsend.Utility.matchesProperties(pattern, {
						topic: 'store',
						collection : 'log'
					})) {
						var message = 'Logging request pattern: ' + JSON.stringify(pattern);
						console.log(message);
						this.connection.send({
							pattern: {
								topic: 'store',
								action: 'put',
								collection : 'log'
							},
							data : {
								key : uuid.v4(),
								value : {
									message : message
								}
							},
							receive: function(result) {
								if (false) console.log('result: ' + JSON.stringify(result, null, 2));
							}.bind(this)
						});
					}
				}
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
	},
	
	uninstall : function() {
		
		this.connection.unmount({
			id: 'request-logger'
		});
	}
});
