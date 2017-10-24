
const Path = require('path')
	// , dutils = require( 'dmidz-utils')
	// , Promise = require('bluebird')
	, App = require( '../lib')
	, Lab = require('lab')
	, lab = exports.lab = Lab.script()
	, plugin_route_prefix = '/myprefix'
	;

lab.experiment('dmidz-app', function(){

	const app = new App( {
		settings : {
			app : {
				root : __dirname
				, dirs : {
					plugins : Path.join( __dirname, 'plugins')
				}
			}
		}
		, routes : [{//_ home
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
					property : 999
					, routes : [{
						method: 'GET'
						, path: '/hello'
						, config : {
							handler: function (request, reply) {
								return reply({ title: 'homepage', content:'Hello !' });
							}
						}
					}]
				}
				, register_options : {
					routes : {
						prefix : plugin_route_prefix
					}
				}
				, onRegistered : function( server, app ){
					server.plugins['plugin-sample'].obj.aaa = 333;
				}
			}
		}
	} );

	lab.before(function( done ){


		app.initialize().then( function(){
			done();
		});

	});

	//_________ tests
	lab.test('initialize with no errors, having routes.', function( done ){
		const routes = app.server.getAllRoutes();
		Lab.expect( routes ).to.be.an.array();
		Lab.expect( routes ).to.have.length( 2 );
		// console.log('zzz', app.server.plugins );
		Lab.expect( app.server.plugins['plugin-sample'].obj.aaa ).to.equal( 333 );
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

