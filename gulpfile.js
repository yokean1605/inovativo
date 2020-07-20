var gulp 		= require('gulp'), 
	browserSync = require('browser-sync').create(),
	uglify 		= require('gulp-uglify'), 
	rename 		= require('gulp-rename'), 
	pug 		= require('gulp-pug'),  
	sass 		= require('gulp-sass'), 
	cleancss 	= require('gulp-clean-css'), 
	clean 		= require('gulp-clean'),
	autoprefixer = require('gulp-autoprefixer'), 
	imagemin 	= require('gulp-imagemin'), 
	plumber 	= require('gulp-plumber'),
	pugpretty 	= require('gulp-pug-beautify'),
	sourcemaps  = require('gulp-sourcemaps'),
	htmlbeautify = require('gulp-html-beautify');
	notify       = require('gulp-notify');
	jshint		= require('gulp-jshint');
	runSequence = require('run-sequence');


// `devpath` - devpaths to base asset directories. With trailing slashes.
// - `devpath.source` - Path to the source files. Default: `dist/`
// - `devpath.dist` - Path to the build directory. Default: `dist/`
var devpath = {
	'sass': {
		'src': [
			'!assets/styles/_*.scss',
			'!assets/styles/**/_*.scss',
			'assets/styles/*.scss',
			'assets/styles/**/*.scss'
		],
		'dest': 'dist/css',
		'watch': 'assets/styles/**/**'
	},
	'pug': {
		'src': [
			'!application/_*.pug',
			'!application/**/_*.pug',
			'application/*.pug',
			'application/**/*.pug'
		],
		'dest': '',
		'watch':'application/**/**'
	},
	'javascript': {
		'src': [
			'assets/scripts/*.js',
			'assets/scripts/**/*.js'
		],
		'dest': 'dist/scripts',
		'bowcomp': [
			'node_modules/popper.js/dist/umd/popper.js',
			'node_modules/jquery/dist/jquery.js',
			'node_modules/jquery.easing/jquery.easing.js',
			'node_modules/bootstrap/dist/js/bootstrap.js'
		],
		'watch': 'assets/scripts/**'
	},
	'images': {
		'src': [
			'!assets/images/*.db',
			'assets/images/**'
		],
		'dest': 'dist/images',
		'watch': 'assets/images/**'
	},
	'fonts': {
		'src': [
			'assets/fonts/**'
		],
		'dest': 'dist/fonts'
	},
	'delete': {
		'dest': [
			'dist',
			'templates'
		]
	}
};

// Error checking; produce an error rather than crashing.
var onError = function(err) {
  console.log(err.toString());
  this.emit('end');
};

// clean css
gulp.task(':clean', function() {
    return gulp.src(
    	devpath.delete.dest,
    		{ read: false }
    	)
        .pipe(clean({ force: true })
    );
});

// Sass to css
gulp.task(':sass', function(){
	return gulp.src(devpath.sass.src)
	.pipe(sourcemaps.init())
	.pipe(sass().on('error', sass.logError))
	.pipe(autoprefixer({browsers: [
			'last 2 versions',
			'ie >= 10',
			'ie_mob >= 10',
			'ff >= 30',
			'chrome >= 34',
			'safari >= 7',
			'opera >= 23',
			'ios >= 7',
			'android >= 4.4',
			'bb >= 10'
		]}))
	.pipe(sourcemaps.write('./maps'))
	.pipe(gulp.dest(devpath.sass.dest))
	.pipe(rename({suffix: '.min'}))
	.pipe(cleancss({compatibility: 'ie8'}))
	.pipe(gulp.dest(devpath.sass.dest))
	.pipe(browserSync.stream({stream: true}));
});

// pug for html
gulp.task(':pug', function(){
	return gulp.src(devpath.pug.src)
		.pipe(plumber({errorHandler: onError}))
		.pipe(pug(
			{pretty: true})
		)
		.pipe(htmlbeautify(
			{ indentSize: 4 })
		)
		.pipe(rename(
			{extname: '.html'})
		)
		.pipe(gulp.dest(devpath.pug.dest))
		.pipe(notify({ message: 'Pug task complete'}))
		.pipe(browserSync.stream({stream: true}));
});

// compress javascript
gulp.task(':javascript', function(){
	return  gulp.src(devpath.javascript.src)
		.pipe(plumber({errorHandler: onError}))
		.pipe(gulp.dest(devpath.javascript.dest))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(gulp.dest(devpath.javascript.dest))
		.pipe(browserSync.stream({stream: true}));
});

// compress js from node_modules
// add dirictory vendor for directory javascript plugin
gulp.task(':vend', function(){
	return gulp.src(devpath.javascript.bowcomp)
		.pipe(plumber({errorHandler: onError}))
		.pipe(rename(function(path){
			console.log('path: ' + path.basename);
			path.dirname = 'vendor/' + path.basename;
		}))
		.pipe(gulp.dest(devpath.javascript.dest))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(gulp.dest(devpath.javascript.dest))
		.pipe(notify({ message: 'Vendor Js task complete'}));
});


// `gulp images` compression
gulp.task(':imgmin', function(){
	return gulp.src(devpath.images.src)
		.pipe(imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 5}),
			imagemin.svgo({
				plugins: [
					{removeViewBox: true},
					{cleanupIDs: false}
				]
			})
		]))
		.pipe(gulp.dest(devpath.images.dest));
});

// move font from directory assets/font to destination (dest)
gulp.task(':fonts', function(){
	return gulp.src(devpath.fonts.src)
		.pipe(gulp.dest(devpath.fonts.dest));
});


// task syncronisasi browser
gulp.task(':browser-sync', function() {
    browserSync.init({
    	server: {
            baseDir: "./"
        },
		port: 8989
    });
});

// Task Build
// create dist folder directory
gulp.task(':build', [':clean'], function() {
	runSequence(
	 ':sass',
	 ':pug',
	 ':fonts',
	 ':javascript',
	 ':vend',
	 ':imgmin'
	)
});

     
// task watch
gulp.task(':watch', [':browser-sync'], function(){
	gulp.watch(devpath.pug.watch, [':pug']);
	gulp.watch(devpath.javascript.watch, [':javascript']);
	gulp.watch(devpath.sass.watch, [':sass']);
	gulp.watch(devpath.images.watch, [':sass', ':pug', ':javascript', ':fonts', ':imgmin']);
	gulp.watch("./dist/*.template").on('change', browserSync.reload);
});


// task default 
gulp.task('default', [':clean'], function() {
  gulp.start(':build');
});