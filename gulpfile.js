var gulp = require('gulp'),
	gulpLivereload = require('gulp-livereload'),
	gulpCoffee = require('gulp-coffee'),
	gulpPlumber = require('gulp-plumber');

gulp.task('coffee', function(){
	return gulp.src('js/*.coffee')
		.pipe(gulpPlumber())
		.pipe(gulpCoffee({
			bare: true,
			map: true
		}))
		.pipe(gulp.dest('js'));
});

gulp.task('default', ['coffee'], function(){
	return true;
});

gulp.task('watch', function(){
	var server = gulpLivereload();
	gulp.watch('js/*.coffee', ['coffee']).on('change', function(e){
		console.log('Le fichier ' + e.path + ' a ete modifie.');
	})
	gulp.watch(['*.html','js/*.js','css/*.css']).on('change', function(e){
		server.changed(e.path);
		console.log('Server reloaded.');
	})
});