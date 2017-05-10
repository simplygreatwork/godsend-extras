
var level = require('level');
var levelws = require('level-ws');

Store = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.database = level('database')
		this.database = levelws(this.database);
	},
	
	mount: function() {
		
		this.connection.mount({
			id: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				stream.request.writeStream = stream.request.writeStream || this.database.createWriteStream();
				var object = {
					key : stream.object.key,
					value : JSON.stringify(stream.object.value)
				};
				stream.request.writeStream.write(object);
				stream.push({
					put : stream.object
				});
				stream.next();
			}.bind(this),
			ending : function(stream) {
				if (stream.request.writeStream) stream.request.writeStream.end();
				stream.next();
			}
		});
		
		this.connection.mount({					// translate the query for simplified processing
			id: 'store-get-optimize-query',
			before : 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({					// get every and pass on for filtering
			id: 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({					// begin by supporting where:{id:'xxxx'}
			id: 'store-get-where',
			after : 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({					// needs to collect all then sort
			id: 'store-get-sort',
			after : 'store-get-where',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-get-range',				// e.g. range is the same as limit:10 {0-9}
			after : 'store-get-sort',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				var range = {
					begin : 0,
					end : 9
				};
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({					// only return specific fields: include or exclude
			id: 'store-get-fields',
			after : 'store-get-range',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
	},
	
	unmount : function() {
		
		
	}
});
