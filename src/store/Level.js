
var level = require('level');
var levelws = require('level-ws');

Store = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.database = level('database')
		this.database = levelws(this.database);
	},
	
	install: function() {
		
		var service = new(require('./Common'))({
			connection : this.connection
		});
		service.install();
		
		this.connection.mount({
			id: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				stream.request.writable = stream.request.writable || this.database.createWriteStream();
				var object = {
					key : [stream.request.pattern.collection, stream.object.key].join('\x00'),
					value : JSON.stringify(stream.object.value)
				};
				stream.request.writable.write(object);
				stream.push({
					put : stream.object
				});
				stream.next();
			}.bind(this),
			ending : function(stream) {
				if (stream.request.writable) stream.request.writable.end();
				stream.next();
			}
		});
		
		this.connection.mount({
			id: 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				if (! stream.request.readable) {
					stream.request.readable = this.database.createReadStream({
						gt : [stream.request.pattern.collection, stream.object.key].join('\x00') + '\x00',
						lt : [stream.request.pattern.collection, stream.object.key].join('\x00') + '\xFF'
					});
					stream.request.readable
					.on('data', function(data) {
						data.key = data.key.split('\x00').splice(1).join('\x00');
						data.value = JSON.parse(data.value);
						stream.push(data);
					})
					.on('error', function (error) {
						console.error('Level readstream error: ', error);
					})
					.on('close', function() {
						if (false) console.log('Level readstream closed.');
					})
					.on('end', function() {
						if (false) console.log('Level readstream ended.');
						stream.push(new END());
						stream.next();
						if (false) stream.request.readable.close();
					});
				}
			}.bind(this)
		});
		
	},
	
	uninstall : function() {
		
		
	}
});
