module.exports = function(grunt, modifyConfig) {

	grunt.task.registerTask('build', [ 'clean', 'build_bower_dep', 'build_js', 'build_css', 'build_assets', 'build_html', 'build_index' ]);
	grunt.task.registerTask('test', [ 'bower', 'karma' ]);
	grunt.task.registerTask('run', [ 'build', 'connect', 'watch' ]);
	grunt.task.registerTask('dist', [ 'build', 'uglify', 'cssmin', 'copy:assets_dist', 'includeSource:dist', 'wiredep:dist', 'cacheBust', 'htmlmin' ]);

	grunt.task.registerTask('build_bower_dep', [ 'bower', 'copy:bower' ]);
	grunt.task.registerTask('build_js', [ 'jshint', 'copy:js' ]);
	grunt.task.registerTask('build_css', [ 'less' ]);
	grunt.task.registerTask('build_assets', [ 'copy:assets' ]);
	grunt.task.registerTask('build_html', [ 'htmlangular' ]);
	grunt.task.registerTask('build_index', [ 'includeSource:build', 'wiredep:build' ]);

	var config = {
		pkg: grunt.file.readJSON('package.json'),
		bower: {
			// Install bower dependencies
			install: { options: { copy: false } }
		},
		karma: {
			// Run tests
			unit: { configFile: 'node_modules/gruntfile-convention-webapp/karma.conf.js' }
		},
		clean: {
			// Remove build and dist folders
			build: [ 'build', 'dist' ]
		},
		jshint: {
			// Validate JS files
			files: [ 'src/js/**/*.js']
		},
		htmlangular: {
			// Validate html files and angular templates
			build: { options: { reportpath: null, reportCheckstylePath: null }, files: [{ src: [ 'src/**/*.html' ], filter: noAssets }] }
		},
		copy: {
			// Copy files to build folder
			bower: { files: [ { expand: true, src: [ 'bower_components/**/*.*' ], dest: 'build', filter: onlyDepsFromWiredep() } ] },
			js: { files: [ { expand: true, cwd: 'src', src: [ 'js/**/*.js' ], dest: 'build' } ] },
			assets: { files: [ { expand: true, cwd: 'src', src: [ 'assets/**/*.*' ], dest: 'build' } ] },
			assets_dist: { files: [ { expand: true, cwd: 'build', src: [ 'assets/**/*.*' ], dest: 'dist' } ] }
		},
		less: {
			// Compile less files
			build: { files: { 'build/css/styles.css': 'src/less/styles.less' } }
		},
		includeSource: {
			// Add src style and script tags to index.html
			build: { options: { basePath: 'build' }, files: [ { expand: true, cwd: 'src', src: [ '**/*!(.tmpl).html' ], dest: 'build', filter: noAssets } ] },
			dist: { options: { basePath: 'dist' }, files: [ { expand: true, cwd: 'src', src: [ '**/*!(.tmpl).html' ], dest: 'dist', filter: noAssets } ] }
		},
		wiredep: {
			// Add bower style and script tags to index.html
			build: { src: 'build/**/*.html', ignorePath: /^\.\.\//, bower: {install: true} },
			dist: { src: 'dist/**/*.html', ignorePath: /^\.\.\//, bower: {install: true} }
		},
		watch: {
			// Watch for changes and update build folder
			js: { files: 'src/js/**/*.js', tasks: [ 'build_js', 'build_index' ] },
			css: { files: 'src/less/**/*.less', tasks: [ 'build_css', 'build_index' ] },
			html: { files: [{ src: 'src/**/*.html', filter: noAssets }], tasks: [ 'build_html', 'build_index' ] }
		},
		connect: {
			// Run http server
			server: { options: { base: 'build' } }
		},
		uglify: {
			// Move JS files from build to dist and minimize
			js: { files: { 'dist/js/<%= pkg.name %>.js': [ 'build/js/**/*.js'] } },
			bower: { files: [ { expand: true, cwd: 'build', src: 'bower_components/**/*.js', dest: 'dist' } ] }
		},
		cssmin: {
			// Move CSS files from build to dist and minimize
			css: { files: { 'dist/css/<%= pkg.name %>.css': [ 'build/css/**/*.css'] } },
			bower: { files: [ { expand: true, cwd: 'build', src: 'bower_components/**/*.css', dest: 'dist' } ] }
		},
		htmlmin: {
			// Move HTML files from build to dist and minimize
			options: { removeComments: true, collapseWhitespace: true },
			templates: { files: [ { expand: true, src: 'dist/**/*.html', filter: noAssets } ] }
		},
		cacheBust: {
			// Add checksum to JS and CSS files in dist folder and update index.html
			options: { encoding: 'utf8', algorithm: 'md5', deleteOriginals: true },
			assets: { files: [{ baseDir: 'dist', expand: true, cwd: 'dist', src: ['**/*.html'], filter: noAssets }] }
		}
	};

	if (modifyConfig) {
		modifyConfig(config);
	}

	grunt.initConfig(config);

    grunt.loadNpmTasks("grunt-bower-task");
    grunt.loadNpmTasks("grunt-cache-bust");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-htmlmin");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-html-angular-validate");
    grunt.loadNpmTasks("grunt-include-source");
    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-wiredep");

    function noAssets(file) {
    	return !file.match(/(src|build|dist)\/assets\//);
    }

	function onlyDepsFromWiredep() {
		var getRelativePath = function (file) { return file.replace(process.cwd() + '/', ''); };
		var wiredepFiles;
		return function (path) {
			if (!wiredepFiles) {
				wiredepFiles = [];
				var deps = require('wiredep')();
				for (var type in deps) {
					if (type !== 'packages') {
						deps[type].forEach(function (dep) {
							wiredepFiles.push(getRelativePath(dep));
						});
					}
				}
			}
			return wiredepFiles.indexOf(path) > -1;
		};
	}

};