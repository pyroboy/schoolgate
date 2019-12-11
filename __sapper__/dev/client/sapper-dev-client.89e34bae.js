let source;

function check() {
	if (typeof module === 'undefined') return;

	if (module.hot.status() === 'idle') {
		module.hot.check(true).then(modules => {
			console.log(`[SAPPER] applied HMR update`);
		});
	}
}

function connect(port) {
	if (source || !window.EventSource) return;

	source = new EventSource(`http://${window.location.hostname}:${port}/__sapper__`);

	window.source = source;

	source.onopen = function(event) {
		console.log(`[SAPPER] dev client connected`);
	};

	source.onerror = function(error) {
		console.error(error);
	};

	source.onmessage = function(event) {
		const data = JSON.parse(event.data);
		if (!data) return; // just a heartbeat

		if (data.action === 'reload') {
			window.location.reload();
		}

		if (data.status === 'completed') {
			check();
		}
	};
}

export { connect };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FwcGVyLWRldi1jbGllbnQuODllMzRiYWUuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9zYXBwZXIvc2FwcGVyLWRldi1jbGllbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsibGV0IHNvdXJjZTtcblxuZnVuY3Rpb24gY2hlY2soKSB7XG5cdGlmICh0eXBlb2YgbW9kdWxlID09PSAndW5kZWZpbmVkJykgcmV0dXJuO1xuXG5cdGlmIChtb2R1bGUuaG90LnN0YXR1cygpID09PSAnaWRsZScpIHtcblx0XHRtb2R1bGUuaG90LmNoZWNrKHRydWUpLnRoZW4obW9kdWxlcyA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhgW1NBUFBFUl0gYXBwbGllZCBITVIgdXBkYXRlYCk7XG5cdFx0fSk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbm5lY3QocG9ydCkge1xuXHRpZiAoc291cmNlIHx8ICF3aW5kb3cuRXZlbnRTb3VyY2UpIHJldHVybjtcblxuXHRzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoYGh0dHA6Ly8ke3dpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZX06JHtwb3J0fS9fX3NhcHBlcl9fYCk7XG5cblx0d2luZG93LnNvdXJjZSA9IHNvdXJjZTtcblxuXHRzb3VyY2Uub25vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRjb25zb2xlLmxvZyhgW1NBUFBFUl0gZGV2IGNsaWVudCBjb25uZWN0ZWRgKTtcblx0fTtcblxuXHRzb3VyY2Uub25lcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdH07XG5cblx0c291cmNlLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0Y29uc3QgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG5cdFx0aWYgKCFkYXRhKSByZXR1cm47IC8vIGp1c3QgYSBoZWFydGJlYXRcblxuXHRcdGlmIChkYXRhLmFjdGlvbiA9PT0gJ3JlbG9hZCcpIHtcblx0XHRcdHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcblx0XHR9XG5cblx0XHRpZiAoZGF0YS5zdGF0dXMgPT09ICdjb21wbGV0ZWQnKSB7XG5cdFx0XHRjaGVjaygpO1xuXHRcdH1cblx0fTtcbn0iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxNQUFNLENBQUM7O0FBRVgsU0FBUyxLQUFLLEdBQUc7Q0FDaEIsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUUsT0FBTzs7Q0FFMUMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFLLE1BQU0sRUFBRTtFQUNuQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJO0dBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7R0FDM0MsQ0FBQyxDQUFDO0VBQ0g7Q0FDRDs7QUFFRCxBQUFPLFNBQVMsT0FBTyxDQUFDLElBQUksRUFBRTtDQUM3QixJQUFJLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsT0FBTzs7Q0FFMUMsTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQzs7Q0FFbEYsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7O0NBRXZCLE1BQU0sQ0FBQyxNQUFNLEdBQUcsU0FBUyxLQUFLLEVBQUU7RUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQztFQUM3QyxDQUFDOztDQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxLQUFLLEVBQUU7RUFDaEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztFQUNyQixDQUFDOztDQUVGLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxLQUFLLEVBQUU7RUFDbEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDcEMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPOztFQUVsQixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO0dBQzdCLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7R0FDekI7O0VBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLFdBQVcsRUFBRTtHQUNoQyxLQUFLLEVBQUUsQ0FBQztHQUNSO0VBQ0QsQ0FBQzs7Ozs7In0=
