(() => {
	function getPad() {
		return document.querySelector('textarea#writer');
	}

	function getCaption() {
		return document.querySelector('textarea#caption-body');
	}

	function getPreview() {
		return document.querySelector('div#md-preview');
	}

	function status() {
		const pad = getPad();
		const caption = getCaption();
		const preview = getPreview();
		let platform = (pad !== null) ? 'writeas' : 'none';
		if (caption !== null) {
			platform = 'snapas';
		}
		let scroll = 0;
		if (platform === 'writeas' && preview !== null) {
			scroll = window.scrollY / preview.scrollHeight;
		}

		return {
			supported: pad !== 'none',
			platform: platform,
			preview: preview,
			active: document.body.contains(preview),
			scroll: scroll
		}
	}

	return status();
})();
