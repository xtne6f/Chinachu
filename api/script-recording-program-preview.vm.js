(function() {
	
	var program = chinachu.getProgramById(request.param.id, data.recording);
	
	if (program === null) return response.error(404);
	
	if (!data.status.feature.previewer) return response.error(403);
	
	if (!program.pid) return response.error(503);
	
	if (program.tuner && program.tuner.isScrambling) return response.error(409);
	
	try {
		var fstats = fs.statSync(program.recorded);
	} catch (e) {
		return response.error(410);
	}
	if (!fstats.isFile() || fstats.size <= 0) return response.error(410);
	
	response.head(200);
	
	var width  = request.query.width  || '320';
	var height = request.query.height || '180';
	
	if (request.query.size && (request.query.size.match(/^[1-9][0-9]{0,3}x[1-9][0-9]{0,3}$/) !== null)) {
		width  = request.query.size.split('x')[0];
		height = request.query.size.split('x')[1];
	}
	
	var vcodec = 'mjpeg';
	
	if (request.query.type && (request.query.type === 'jpg')) { vcodec = 'mjpeg'; }
	if (request.query.type && (request.query.type === 'png')) { vcodec = 'png'; }
	if (request.type === 'jpg') { vcodec = 'mjpeg'; }
	if (request.type === 'png') { vcodec = 'png'; }
	if (request.type === 'txt') { vcodec = 'mjpeg'; }
	
	var fread = fs.createReadStream(program.recorded, { start: Math.max(fstats.size - 3200000, 0), end: fstats.size - 1 });
	
	var ffmpeg = child_process.exec(
		(
			'avconv -f mpegts -r 10 -i pipe:0 -ss 1.5 -r 10 -frames:v 1 -f image2 -codec:v ' + vcodec +
			' -an -s ' + width + 'x' + height + ' -map 0:0 -y pipe:1'
		)
		,
		{
			encoding: 'binary',
			maxBuffer: 3200000
		}
		,
		function(err, stdout, stderr) {
			if (err) {
				util.log(err);
				return response.error(503);
			}
			
			if (request.type === 'txt') {
				if (vcodec === 'mjpeg') {
					response.end('data:image/jpeg;base64,' + new Buffer(stdout, 'binary').toString('base64'));
				} else if (vcodec === 'png') {
					response.end('data:image/png;base64,' + new Buffer(stdout, 'binary').toString('base64'));
				}
			} else {
				response.end(stdout, 'binary');
			}
			clearTimeout(timeout);
		}
	);
	
	ffmpeg.stdin.on('error', function() {});
	fread.pipe(ffmpeg.stdin);
	
	var timeout = setTimeout(function() {
		ffmpeg.kill('SIGKILL');
	}, 3000);

})();