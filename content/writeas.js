(() => {
	document.onkeyup = function(e){
		if (e.key === "Escape" && document.querySelector('div#md-preview') !== null) {
			sendToggleMessage();
		}
	};

	window.onpopstate = sendBackMessage;
	const pad = document.querySelector('textarea#writer');
	const content = pad.innerHTML;
	const font = pad.classList[0];

	async function renderPreview(body, font) {
		let result = await getPreviewBody(body)
			.then((res) => {
				return res.json();
			});

		const pad = document.querySelector('textarea#writer');
		const scroll = pad.scrollTop / pad.scrollHeight;
		const preview = previewElement(result.body, font);
		document.body.appendChild(preview);
		document.body.id = "post";
		window.scrollTo(0,(preview.offsetHeight*scroll) - 40);
		window.history.pushState({'preview': true},null,'#preview')
	};

	function getPreviewBody(content) {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage({
				type: 'markdown_request',
				data: {
					base_url: '',
					raw_body: content
				}
			}, (msgResponse) => {
				const [response, error] = msgResponse;
				if (response === null) {
					reject(error);
				} else {
					const body = response.body ? new Blob([response.body]) : undefined;
					resolve(new Response(body, {
						status: response.status,
						statusText: response.statusText,
					}));
				}
			});
		});
	}

	function sendToggleMessage() {
		chrome.runtime.sendMessage({
			type: 'toggle',
		});
	};

	function sendBackMessage() {
		chrome.runtime.sendMessage({
			type: 'back'
		});
	};


	function previewElement(body, font) {
		var previewOverlay = document.createElement("div");
		previewOverlay.id = "md-preview";
		previewOverlay.style.cssText = "position: absolute; top: 0; left: 0; z-index: 1000; width: 100%; min-height: 100%; background-color: #fff;";
		var previewModal = document.createElement("div");
		previewModal.style.cssText = "box-shadow: 0 0 16px #000; margin: 20px; padding: 20px;";
		previewOverlay.appendChild(previewModal);
		var previewModalClose = document.createElement("button");
		previewModalClose.id = "md-preview-close";
		previewModalClose.innerText = "Close";
		previewModalClose.title = "Close preview overlay and return to editing"
		previewModalClose.style.cssText = "font-size: 1.6em; position: absolute; z-index: 1010; top: 40px; right: 40px; padding: 2px 8px; font-weight: bold; background-color: #fff; border: 2px solid #989898; color: #989898;"
		previewModalClose.addEventListener('click', sendToggleMessage);
		previewModal.appendChild(previewModalClose);

		// create and assemble the header
		var previewHeader = document.createElement("header");
		var previewHeading = document.createElement("h1");
		previewHeading.id = "blog-title";
		var previewHeadingLink = document.createElement("a");
		previewHeadingLink.innerText = "Preview";
		previewHeading.appendChild(previewHeadingLink);
		previewHeader.appendChild(previewHeading);
		var previewHeaderNav = document.createElement("nav");
		var previewHeaderNavBack = document.createElement("a");
		previewHeaderNavBack.classList = ['xtra-feature'];
		previewHeaderNavBack.innerText = "Back to Edit";
		previewHeaderNavBack.style.cursor = "pointer";
		previewHeaderNavBack.addEventListener('click', sendToggleMessage);
		previewHeaderNav.appendChild(previewHeaderNavBack);
		previewHeader.appendChild(previewHeaderNav);
		// create and assemble preview article body
		var previewArticle = document.createElement("article");
		previewArticle.id ="post-body";
		previewArticle.classList = [font];
		previewArticle.innerHTML = body;

		// create and assemble preview footer
		var previewFooter = document.createElement("footer");
		var previewFooterHr = document.createElement("hr");
		previewFooter.appendChild(previewFooterHr);
		var previewFooterNav = document.createElement("nav");
		var previewFooterNavP = document.createElement("p");
		previewFooterNavP.style.cssText = "font-size: 0.9em;";
		previewFooterNavP.innerText = "previewed with ";
		previewFooterNav.appendChild(previewFooterNavP);
		var previewFooterNavLink = document.createElement("a");
		previewFooterNavLink.innerText = "view.as";
		previewFooterNavLink.style.cssText = "color: #999;";
		previewFooterNavP.appendChild(previewFooterNavLink);
		previewFooter.appendChild(previewFooterNav);

		// assemble the whole preview modal
		previewModal.appendChild(previewHeader);
		previewModal.appendChild(previewArticle);
		previewModal.appendChild(previewFooter);

		return previewOverlay;
	}

	renderPreview(content, font);
})();

