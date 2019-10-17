var currentTab;
function updateIcon(previewing) {
	chrome.browserAction.setIcon({
		path: previewing ? {
			19: "/icons/black-bg.svg",
			38: "/icons/black-bg.svg"
		} : {
			19: "/icons/white-bg.svg",
			38: "/icons/white-bg.svg"
		},
		tabId: currentTab.id
	});
	chrome.browserAction.setTitle({
		title: previewing ? 'Hide Preview' : 'Show Preview',
		tabId: currentTab.id
	});
}

function togglePreview() {
	// tell content to render preview
	chrome.tabs.sendMessage(currentTab.id, {preview: true}, (result) => {
		// if content responds with preview being active
		// clear the preview instead
		if (result && result.preview) {
			chrome.tabs.sendMessage(currentTab.id, {preview: false});
			updateIcon(false);
		} else if (result && !result.preview) {
			updateIcon(true);
		}
	});
}

// listen for clicks on browser extension icon
chrome.browserAction.onClicked.addListener(togglePreview);

function disableExtension() {
	// when the content script reports back that there
	// are no supported text areas we should disable action
	chrome.browserAction.disable(currentTab.id);
	chrome.browserAction.setTitle({
		title: 'No Preview Available',
		tabId: currentTab.id
	});
}

function updateActiveTab() {
	// don't try to inject the script on pages that
	// are not webpages, i.e. chrome:// or about://
	function isSupportedProtocol(urlString) {
		var supportedProtocols = ["https:", "http:", "file:"];
		var url = document.createElement('a');
		url.href = urlString;
		return supportedProtocols.indexOf(url.protocol) != -1;
	}

	chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
		if (tabs[0]) {
			currentTab = tabs[0];
			if (isSupportedProtocol(currentTab.url)) {
				// check state first, if error execute script?
				chrome.tabs.sendMessage(currentTab.id, {state: true}, (result) => {
					if (chrome.runtime.lastError) {
						console.log(chrome.runtime.lastError.message);
						disableExtension();
						console.log(`Could not detect previewable content.`);
					} else if (result && result.supported) {
						// when there is supported content we should enable action
						// and update the icon state, which also updates the tooltip
						chrome.browserAction.enable(currentTab.id);
						updateIcon(result.preview);
					} else {
						disableExtension();
						console.log(`No previewable content detected at '${currentTab.url}'`);
					}
				});
			} else {
				console.log(`Markdown Preview does not support the '${currentTab.url}' URL.`);
				disableExtension();
			}
		}
	});
}


// update the extension icon for any tab, when switching and updating
chrome.tabs.onCreated.addListener(updateActiveTab);
chrome.tabs.onUpdated.addListener(updateActiveTab);
chrome.tabs.onActivated.addListener(updateActiveTab);

chrome.windows.onFocusChanged.addListener(() => {
	updateActiveTab();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.endpoint && request.data) {
		var params = {
			body: JSON.stringify(request.data),
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		};
		fetch(request.endpoint, params).then(function(response) {
			return response.text().then(function(text) {
				sendResponse([{
					body: text,
					status: response.status,
					statusText: response.statusText,
				}, null]);
			});
		}, function(error) {
			sendResponse([null, error]);
		});
	}
	return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.toggle) {
		togglePreview();
	}
});
