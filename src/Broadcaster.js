
Broadcaster = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	mount: function() {
		
		this.connection.mount({
			id: 'store-put-notify',						// issue: random cyclical toposort error when this is changed
			after: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'put-broadcast',
						collection: stream.request.pattern.collection
					},
					data: stream.object,
					receive: function(result) {
						stream.push(stream.object);
						stream.next();
					}.bind(this)
				});
			}.bind(this)
		});
	},
	
	unmount : function() {
		
		
	}
});
