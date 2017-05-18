
Validator = module.exports = Class.extend({		// this generic validator should warn and not fail
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.process(this.connection);
	},
	
	install: function() {
		
		
	},
	
	uninstall : function() {
		
		
	}
});
