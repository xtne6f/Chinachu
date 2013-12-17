(function() {
	
	var program = chinachu.getProgramById(request.param.id, data.recording);
	
	if (program === null) return response.error(404);
	
	if (!data.status.feature.streamer) return response.error(403);
	
	if (!program.pid) return response.error(503);
	
	if (program.tuner && program.tuner.isScrambling) return response.error(409);
	
	if (!fs.existsSync(program.recorded)) return response.error(410);
	
	switch (request.type) {
		// HTTP Live Streaming (Experimental)
		case 'txt'://for debug
		case 'm3u8':
			response.head(200);
			
			var current  = (program.end - program.start) / 1000;
			
			var d = {
				t    : request.query.t      || '5',//duration(seconds)
				s    : request.query.s      || '1024x576',//size(WxH)
				'c:v': request.query['c:v'] || 'libx264',//vcodec
				'c:a': request.query['c:a'] || 'libfdk_aac',//acodec
				'b:v': request.query['b:v'] || '1M',//bitrate
				'b:a': request.query['b:a'] || '96k'//ab
			};
			
			d.t = parseInt(d.t, 10);
			
			response.write('#EXTM3U\n');
			response.write('#EXT-X-TARGETDURATION:' + d.t + '\n');
			response.write('#EXT-X-MEDIA-SEQUENCE:' + Math.floor(current / d.t) + '\n');
			
			var target = request.query.prefix || '';
			target += 'watch.m2ts?nore=1&t=' + d.t + '&c:v=' + d['c:v'] + '&c:a=' + d['c:a'];
			target += '&b:v=' + d['b:v'] + '&s=' + d.s + '&b:a=' + d['b:a'];
			
			for (var i = 0; i < current; i += d.t) {
				if (current - i > 60) { continue; }
				response.write('#EXTINF:' + d.t + ',\n');
				response.write(target + '&ss=' + i + '\n');
			}
			
			response.end();
			return;
		
		case 'xspf':
			response.setHeader('content-disposition', 'attachment; filename="' + program.id + '.xspf"');
			response.head(200);
			
			var ext    = request.query.ext || 'm2ts';
			var prefix = request.query.prefix || '';
			
			var target = prefix + 'watch.' + ext  + url.parse(request.url).search;
			
			response.write('<?xml version="1.0" encoding="UTF-8"?>\n');
			response.write('<playlist version="1" xmlns="http://xspf.org/ns/0/">\n');
			response.write('<trackList>\n');
			response.write('<track>\n<location>' + target.replace(/&/g, '&amp;') + '</location>\n');
			response.write('<title>' + program.title + '</title>\n</track>\n');
			response.write('</trackList>\n');
			response.write('</playlist>\n');
			
			response.end();
			return;
		
		case 'm2ts':
		case 'f4v':
		case 'flv':
		case 'webm':
		case 'asf':
			response.head(200);
			
			util.log('[streamer] streaming: ' + program.recorded);
			
			var d = {
				ss   : request.query.ss     || null, //start(seconds)
				t    : request.query.t      || null,//duration(seconds)
				s    : request.query.s      || null,//size(WxH)
				f    : request.query.f      || null,//format
				'c:v': request.query['c:v'] || null,//vcodec
				'c:a': request.query['c:a'] || null,//acodec
				'b:v': request.query['b:v'] || null,//bitrate
				'b:a': request.query['b:a'] || null,//ab
				ar   : request.query.ar     || null,//ar(Hz)
				r    : request.query.r      || null//rate(fps)
			};
			
			switch (request.type) {
				case 'm2ts':
					d.f      = 'mpegts';
					break;
				case 'webm':
					d.f      = 'webm';
					d['c:v'] = d['c:v'] || 'libvpx';
					d['c:a'] = d['c:a'] || 'libvorbis';
					break;
				case 'flv':
					d.f      = 'flv';
					d['c:v'] = d['c:v'] || 'flv';
					d['c:a'] = d['c:a'] || 'libfdk_aac';
					break;
				case 'f4v':
					d.f      = 'flv';
					d['c:v'] = d['c:v'] || 'libx264';
					d['c:a'] = d['c:a'] || 'libfdk_aac';
					break;
				case 'asf':
					d.f      = 'asf';
					d['c:v'] = d['c:v'] || 'wmv2';
					d['c:a'] = d['c:a'] || 'wmav2';//or libfdk_aac ?
					break;
			}
			
			var args = [];
			
			if (!request.query.debug) args.push('-v', '0');
			
			if (d.ss) args.push('-ss', (parseInt(d.ss, 10) - 1) + '');
			
			args.push('-re', '-i', (!d.ss) ? 'pipe:0' : program.recorded);
			args.push('-ss', '1');
			
			if (d.t) { args.push('-t', d.t); }
			
			args.push('-threads', 'auto');
			
			if (d['c:v']) args.push('-c:v', d['c:v']);
			if (d['c:a']) args.push('-c:a', d['c:a']);
			
			if (d.s)  args.push('-s', d.s);
			if (d.r)  args.push('-r', d.r);
			if (d.ar) args.push('-ar', d.ar);
			
			if (d['b:v']) args.push('-b:v', d['b:v']);
			if (d['b:a']) args.push('-b:a', d['b:a']);
			
			//if (format === 'flv')     { args.push('-vsync', '2'); }
			if (d['c:v'] === 'libx264') args.push('-preset', 'ultrafast');
			if (d['c:v'] === 'libvpx')  args.push('-deadline', 'realtime');
			
			args.push('-y', '-f', d.f, 'pipe:1');
			
			var fd = null;
			var readable = null;
			var fsize = 0;
			var rsize = 0;
			
			if (!d.ss) {
				fd = fs.openSync(program.recorded, 'r');
				fsize = fs.fstatSync(fd).size;
				rsize = Math.max(fsize - 4000000, 0);
				readable = fs.createReadStream(program.recorded, { start: rsize });
			}
			
			var isPaused = false;
			var isBlocked = false;
			
			// 送出制御
			var togglePause = function() {
				if (isPaused) {
					if (!isBlocked && rsize < fsize - 4000000) {
						if (readable) readable.resume();
						isPaused = false;
					}
				} else {
					if (isBlocked || rsize > fsize - 2000000) {
						if (readable) readable.pause();
						isPaused = true;
					}
				}
			}
			
			var watchFileSize = function() {
				if (fd) {
					fs.fstat(fd, function(err, stats) {
						if (!err) {
							fsize = stats.size;
							togglePause();
							setTimeout(watchFileSize, 500);
						}
					});
				}
			};
			watchFileSize();
			
			var writable = null;
			var avconv = null;
			
			var onEnd = function() {
				writable = null;
				if (avconv) {
					avconv.kill('SIGKILL');
					avconv = null;
				}
				if (readable) {
					readable.close();
					readable = null;
				}
				if (fd) {
					fs.close(fd);
					fd = null;
				}
				setTimeout(function() {
					if (response) {
						response.end();
						response = null;
					}
				}, 1000);
			}
			
			if (readable) {
				readable.on('data', function(chunk) {
					rsize += chunk.length;
					if (writable) {
						isBlocked = !writable.write(chunk);
						togglePause();
						if (isBlocked) {
							writable.once('drain', function() {
								isBlocked = false;
								togglePause();
							});
						}
					}
				});
				
				readable.on('end', function() {
					readable = null;
					onEnd();
				});
			}
			
			request.on('close', onEnd);
			
			if ((!d.ss) && (d['c:v'] === 'copy') && (d['c:a'] === 'copy') && (d.f === 'mpegts')) {
				writable = response;
			} else {
				avconv = child_process.spawn('avconv', args);
				children.push(avconv);// 安全対策
				
				if (!d.ss) {
					writable = avconv.stdin;
				}
				
				avconv.stdout.pipe(response);
				
				avconv.stderr.on('data', function(d) {
					util.log(d);
				});
				
				avconv.on('exit', function(code) {
					avconv = null;
					onEnd();
				});
			}
			
			return;
	}//<--switch

})();