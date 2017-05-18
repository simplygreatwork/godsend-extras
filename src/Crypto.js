
var forge = require('node-forge');

Crypto = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		if (properties.config === undefined) {
			this.config = {
				'crypto-put-key' : {},
				'encrypt-object' : {},
				'decrypt-object' : {}
			};
		}
		Object.assign(this, properties);
	},
	
	install: function() {
		
		this.mount({
			id: 'crypto-put-key',
			route : 'rebound',
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
		
		this.mount({
			id: 'encrypt-object',
			route : 'rebound',
			weight : 10,
			on: function(request) {
				request.accept({
					encryptable : true
				});
			}.bind(this),
			run: function(stream) {
				console.log('Encrypting object.');
				var crypto = this.crypto || stream.connection.crypto[stream.request.username];
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
		
		this.mount({
			id: 'decrypt-object',
			route : 'rebound',
			weight : -10,
			on: function(request) {
				request.accept({
					encryptable : true
				});
			}.bind(this),
			run: function(stream) {
				console.log('Decrypting object.');
				var crypto = this.crypto || stream.connection.crypto[stream.request.username];
				if (crypto) {
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
	
	mount : function(properties) {
		
		if (this.config[properties.id]) {
			this.connection.mount(Object.assign(properties, this.config[properties.id]));
		}
	},
	
	uninstall : function() {
		
		this.unmount({
			id: 'crypto-put-key',
			route : 'rebound'
		});
		this.unmount({
			id: 'encrypt-object',
			route : 'rebound'
		});
		this.unmount({
			id: 'decrypt-object',
			route : 'rebound'
		});
	},
	
	unmount : function() {
		
		if (this.config[properties.id]) {
			this.connection.unmount(Object.assign(properties, this.config[properties.id]));
		}
	}
});
