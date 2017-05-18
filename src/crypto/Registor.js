
var forge = require('node-forge');

Registor = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	mount: function(properties) {
		
		this.connection.mount({
			id: 'crypto-put-key',
			route : properties.route || 'rebound',
			on: function(request) {
				request.accept({
					topic : 'crypto',
					action: 'put-key'
				});
			}.bind(this),
			run: function(stream) {
				stream.connection.crypto = stream.connection.crypto || {};
				stream.connection.crypto[stream.request.username] = {
					key : stream.object.key,
					iv : stream.object.iv,
				};
				stream.push({
					message : 'The encryption key has been put.'
				});
				stream.next();
			}.bind(this)
		});
	},
	
	unmount : function() {
		
		connection.unmount({
			id: 'encryption-put-key'
		});
	}
});
