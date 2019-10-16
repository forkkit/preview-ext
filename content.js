(function() {
	var pad = document.querySelector("textarea#writer");
	var previewOverlay = document.createElement("div");
	previewOverlay.id = "md-preview";
	previewOverlay.style.cssText = "position: absolute; top: 0; left: 0; z-index: 20; width: 100%; min-height: 100vh; background-color: #fff;";

	// create and assemble the header
	var previewHeader = document.createElement("header");
	var previewHeading = document.createElement("h1");
	previewHeading.id = "blog-title";
	var previewHeadingLink = document.createElement("a");
	previewHeadingLink.innerText = "Preview";
	previewHeading.appendChild(previewHeadingLink);
	previewHeader.appendChild(previewHeading);
	
	// create and assemble preview article body
	var previewArticle = document.createElement("article");
	previewArticle.id ="post-body";
	previewArticle.classList = ['norm'];

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

	// assemble the whole preview overlay
	previewOverlay.appendChild(previewHeader);
	previewOverlay.appendChild(previewArticle);
	previewOverlay.appendChild(previewFooter);

	async function showPreview() {
		var rawPost = getRawPost();
		var result = await getPostMarkdown(rawPost)
			.then((res) => {
				return res.json();
			});
		previewArticle.innerHTML = result.body;
		document.body.appendChild(previewOverlay);
		document.body.id = "post";
		pad.style.display = "none";
	}

	function getRawPost() {
		// TODO: add other possible, i.e. submit.as
		// writefreely pad
		// body#pad textarea#writer
		return pad.value;
	}

	function getPostMarkdown(rawpost) {
		const endpoint = "https://pencil.writefree.ly/api/generate/markdownify";
		var data = {
			base_url: '',
			raw_body: rawpost
		};
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage({endpoint, data}, messageResponse => {
				const [response, error] = messageResponse;
				if (response === null) {
					reject(error);
				} else {
					// Use undefined on a 204 - No Content
					const body = response.body ? new Blob([response.body]) : undefined;
					resolve(new Response(body, {
						status: response.status,
						statusText: response.statusText,
					}));
				}
			});
		});
	}

	function clearPreview() {
		document.body.id = "pad";
		pad.style.display = "block";
		document.body.removeChild(previewOverlay);
	}

	function isPreview() {
		return document.body.contains(previewOverlay);
	}

	function isSupported() {
		return (document.querySelector("textarea#writer") !== null);
	}

	// TODO: sender is never used
	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		if (msg.preview === true) {
			if (isPreview()) {
				sendResponse({preview: true});
			} else {
				// we send false because when this message was sent,
				// the preview was not active
				showPreview();
				sendResponse({preview: false});
			}
		} else if (msg.preview === false) {
			clearPreview();
			sendResponse({preview: false});
		} else if (msg.state === true) {
			sendResponse({supported: isSupported(), preview: isPreview()});
		} else {
			sendResponse({preview: false});
		}
	});
})();

