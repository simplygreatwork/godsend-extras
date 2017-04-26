
Encryptor = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	mount: function() {
		
		this.connection.mount({
			id: 'store-put-encrypt',
			weight : -6,
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});

		this.connection.mount({
			id: 'store-put-decrypt',
			weight : -5,
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
	},
	
	unmount : function() {
		
		this.connection.unmount({
			id: 'store-put-encrypt'
		});
		this.connection.unmount({
			id: 'store-put-decrypt'
		});
	}
});
