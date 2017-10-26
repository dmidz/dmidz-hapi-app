
const Path = require('path')
	// , dutils = require( 'dmidz-utils')
	// , Promise = require('bluebird')
	, App = require( '../lib')
	, Lab = require('lab')
	, lab = exports.lab = Lab.script()
	, plugin_route_prefix = '/myprefix'
	;

lab.experiment('### dmidz-hapi-app', function(){
	let some_property = null;
	const app = new App( {
		settings : {
			app : {
				root : __dirname
				, dirs : {
					plugins : Path.join( __dirname, 'plugins')
				}
			}
		}
		, routes : [{
			method: 'GET'
			, path: '/'
			, config : {
				handler: function (request, reply) {
					return reply({ title: 'homepage', content:'Hello !' });
				}
			}
		}]
		, plugins : {
			'plugin-sample' : {
				custom : 1
				, options : {
					some_property : 999
				}
				, register_options : {
					routes : {
						prefix : plugin_route_prefix
					}
				}
				, onRegistered : function( server, app ){
					some_property = server.plugins['plugin-sample'].getSomeProperty();
					// server.plugins['plugin-sample'].obj.aaa = 333;
				}
			}
		}
	} );

	lab.test('initialize app', function( ){
		return app.initialize();
	});

	//_________ tests
	lab.test('check total of routes ( global & plugins)', function( done ){
		const routes = app.server.getAllRoutes();
		Lab.expect( routes ).to.be.an.array();
		Lab.expect( routes ).to.have.length( 2 );
		// Lab.expect( app.server.plugins['plugin-sample'].getSomeProperty() ).to.equal( 999 );
		Lab.expect( some_property ).to.equal( 999 );
		done();
	});

	lab.test('plugin route with prefix', function(){
		return app.server.inject( {
			url : plugin_route_prefix+'/hello'
			, method : 'get'
		} ).then( function( res ){
			Lab.expect( res.statusCode ).to.equal( 200 );
			Lab.expect( res.result ).to.be.an.object();
			Lab.expect( res.result.title ).to.be.equal('homepage');
		});
	});
});

