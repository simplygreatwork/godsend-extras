
var forge = require('node-forge');

Encryptor = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	mount: function(properties) {
		
		this.connection.mount({
			id: 'encrypt-object',
			route : properties.route || 'rebound',
			weight : 10,
			on: function(request) {
				request.accept({
					encryptable : true
				});
			}.bind(this),
			run: function(stream) {
				console.log('Encrypting object.');
				var crypto = stream.connection.crypto[stream.request.username];
				var cipher = forge.cipher.createCipher('AES-CTR', crypto.key);
				cipher.start({
					iv : crypto.iv
				});
				var string = JSON.stringify(stream.object);
				cipher.update(forge.util.createBuffer(string));
				cipher.finish();
				stream.push({
					encrypted : cipher.output.toHex()
				});
				stream.next();
			}.bind(this)
		});
	},
	
	unmount : function() {
		
	}
});
