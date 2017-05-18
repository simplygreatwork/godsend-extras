
var forge = require('node-forge');

Decryptor = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	mount: function(properties) {
		
		this.connection.mount({
			id: 'decrypt-object',
			route : properties.route || 'rebound',
			weight : -10,
			on: function(request) {
				request.accept({
					encryptable : true
				});
			}.bind(this),
			run: function(stream) {
				console.log('Decrypting object.');
				if (stream.connection.crypto) {
					var crypto = stream.connection.crypto[stream.request.username];
					var decipher = forge.cipher.createDecipher('AES-CTR', crypto.key);
					decipher.start({
						iv : crypto.iv
					});
					decipher.update(forge.util.createBuffer(forge.util.hexToBytes(stream.object.encrypted)));
					decipher.finish();
					var object = JSON.parse(decipher.output.toString());
					stream.push(object);
					stream.next();
				} else {
					stream.err({
						message : 'The data could not be decrypted.'
					});
					stream.next();
				}
			}.bind(this)
		});
	},
	
	unmount : function() {
		
		connection.unmount({
			id: 'decrypt-object'
		});
	}
});


