
const Path = require('path')
	, dutils = require('dmidz-utils')
	, Promise = require('bluebird')
;


function PluginSample( server, options ) {
	const me = this;
	me.server = server;
	me.options = dutils.mixin({//__ default options
		property : 777
		, routes : null
	}, options, true );

	if( me.options.routes ) me.server.route( me.options.routes );
}

PluginSample.prototype = {
	initialize : function(){
		//__ allow to insure async things could be prepared before considering registered by the server
		return new Promise(function( resolve, reject ){
			setTimeout( function(){ resolve(); }, 250 );
		});
	}
};

exports.register = function( server, options, next ){
	//_ warn if passing next directly to then, do not return anything from initialize promise
	new PluginSample( server, options ).initialize().then( next );
};

exports.register.attributes = { name: 'plugin-sample', version: '1.0.0' };

