
// This service is here mainly as an example and as a test.
// All it does is reverse the characters in the JSON string of each passed object.
// See the service, Crypto.js, for a more practical example of encrypting and decrypting data.

Coder = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		if (properties.config === undefined) {
			this.config = {
				'encode' : {},
				'decode' : {}
			};
		}
		Object.assign(this, properties);
	},
	
	install: function() {
		
		this.mount({
			route : 'rebound',
			id: 'decode',
			weight : -10,
			on: function(request) {
				request.accept({
					encode : true
				});
			}.bind(this),
			run: function(stream) {
				var string = stream.object.encoded.split('').reverse().join('');
				var object = JSON.parse(string);
				stream.push(object);
				stream.next();
			}.bind(this)
		});
		
		this.mount({
			route : 'rebound',
			id: 'encode',
			weight : 10,
			on: function(request) {
				request.accept({
					encode : true
				});
			}.bind(this),
			run: function(stream) {
				stream.push({
					encoded : JSON.stringify(stream.object).split('').reverse().join('')
				});
				stream.next();
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
			id: 'encode',
			route : 'rebound'
		});
		this.unmount({
			id: 'decode',
			route : 'rebound'
		});
	},
	
	unmount : function(properties) {
		
		if (this.config[properties.id]) {
			this.connection.unmount(Object.assign(properties, this.config[properties.id]));
		}
	}
});
