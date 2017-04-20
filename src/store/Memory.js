
Store = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	mount: function() {
		
		this.connection.process({
			id: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				stream.next();
			}.bind(this)
		});
		
		this.connection.process({
			id: 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				stream.next();
			}.bind(this)
		});
		
		this.connection.process({
			id: 'store-recent',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'recent'
				});
			}.bind(this),
			run: function(stream) {
				stream.next();
			}.bind(this)
		});
		
		this.connection.process({
			id: 'store-find',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'find'
				});
			}.bind(this),
			run: function(stream) {
				stream.next();
			}.bind(this)
		});
	},
	
	unmount : function() {
		
		
	}
});
