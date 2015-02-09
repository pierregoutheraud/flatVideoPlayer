var gulp = require('gulp'),
	livereload = require('gulp-livereload'),
	compass = require('gulp-compass'),
	coffee = require('gulp-coffee'),
	plumber = require('gulp-plumber'),
	uglify = require('gulp-uglify'),
	minifyCss = require('gulp-minify-css'),
	filter = require('gulp-filter');

var jsFilter = filter('*.js');
var cssFilter = filter('*.css');

/* ---------
		Coffee
	 --------- */

gulp.task('coffee', function(){
	return gulp.src('coffee/*.coffee')
		.pipe(plumber())
		.pipe(coffee({
			bare: true,
			map: true
		}))
		.pipe(gulp.dest('dist'));
});

/* ---------
		Sass
	 --------- */

gulp.task('compass', function(){

	return gulp.src('sass/**/*.scss')
	.pipe(plumber())
	.pipe(compass({
		css: 'dist',
		sass: 'sass'
	}))
	.pipe(gulp.dest('dist'));

});

/* ---------
		Minify css
	 --------- */

gulp.task('css', ['compass'], function(){
	return	gulp.src('dist/*.css')
							.pipe(minifyCss())
							.pipe(gulp.dest('dist'));
});

/* ---------
		Minify js
	 --------- */

gulp.task('js', ['coffee'], function(){
	return	gulp.src('dist/*.js')
							.pipe(uglify())
							.pipe(gulp.dest('dist'));
});

/* ---------
		Default
	 --------- */
gulp.task('default', ['js', 'css'], function(){
});

/* ---------
		Watch
	 --------- */

gulp.task('watch', function(){
	var server = livereload();
	gulp.watch('coffee/*.coffee', ['coffee']).on('change', function(e){
		console.log('Le fichier ' + e.path + ' a ete modifie.');
	})
	gulp.watch('sass/**/*.scss', ['compass']).on('change', function(e){
		console.log('Le fichier ' + e.path + ' a ete modifie.');
	});
	gulp.watch(['*.html','dist/*.js','dist/*.css']).on('change', function(e){
		server.changed(e.path);
		console.log('Server reloaded.');
	})
});