(function() {

	if (['wui', 'operator', 'scheduler'].indexOf(request.param.name) === -1) {
		return response.error(404);
	}
	
	var filename = './log/' + request.param.name;
	
	try {
		var fd = fs.openSync(filename, 'r');
	} catch (e) {
		response.head(204);
		response.end('');
		return;
	}
	
	response.head(200);
	
	response.write(new Array(1024).join(' '));
	
	var watcher = fs.watch(filename, function() { tail(false); });
	var timer = setInterval(function() { tail(false); }, 5000);
	
	var isReading = false;
	var offset;
	
	var tail = function(isFirst) {
		
		if (isReading) return;
		
		var size = fs.fstatSync(fd).size;
		if (isFirst) {
			offset = Math.max(size - 65536, 0);
		}
		var remain = size - offset;
		if (remain <= 0) return;
		
		isReading = true;
		fs.read(fd, new Buffer(remain), 0, remain, offset, function(err, bytesRead, buffer) {
			if (err) {
				watcher.close();
				clearInterval(timer);
				if (fd) {
					fs.close(fd);
					fd = null;
				}
				response.end();
				return;
			}
			
			var str = buffer.toString();
			if (isFirst) {
				var fr = str.length;
				for (var i = 0; i < 100 && fr >= 0; i++) {
					fr = str.lastIndexOf('\n', fr) - 1;
				}
				str = str.substring(fr + 2);
			}
			
			offset += remain;
			isReading = false;
			response.write(str);
		});
	};
	
	request.on('close', function() {
		watcher.close();
		clearInterval(timer);
		if (fd) {
			fs.close(fd);
			fd = null;
		}
	});
	
	tail(true);

})();