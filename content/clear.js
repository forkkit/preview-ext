(() => {
	const preview = document.querySelector('div#md-preview');
	const scroll = window.scrollY / preview.scrollHeight;
	preview.remove();
	const writer = document.querySelector('textarea#writer');
	const caption = document.querySelector('textarea#caption-body');

	if (writer) {
		// writeas
		document.body.id = 'pad';
		writer.scrollTo(0, (writer.scrollHeight*scroll) + 40);
	} else if (caption) {
		// snapas
		// document.body.scrollTo(0, (document.body.scrollHeight*scroll) + 40);
	}
	if (window.location.hash === "#preview") {
		window.history.back();
	};

})();
