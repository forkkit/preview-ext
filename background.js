// listen for clicks on browser extension icon
chrome.browserAction.onClicked.addListener((tab) => {
	withPermission(tab, togglePreview);
});

// update the extension icon for any tab, when switching and updating
chrome.tabs.onCreated.addListener((tab) => {
	withPermission(tab, updateActiveTab);
});
chrome.tabs.onUpdated.addListener((tab) => {
	withPermission(tab, updateActiveTab);
});
chrome.tabs.onActivated.addListener((tab) => {
	withPermission(tab, updateActiveTab);
});

chrome.windows.onFocusChanged.addListener((tab) => {
	withPermission(tab, updateActiveTab);
});


// listen for request from the client script to toggle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.toggle) {
		togglePreview(sender.tab);
	}
});

function withPermission(tab, f) {
	if (tab.url !== undefined) {
		chrome.permissions.request({
			permissions: ['tabs'],
			origins: [tab.url]
		},(granted) => {
			if (granted) {
				chrome.tabs.sendMessage(tab.id, {state: true}, () => {
					if (chrome.runtime.lastError) {
						chrome.tabs.executeScript({
							file: "content.js"
						});
					} else {
						f(tab);
					}
				});
			}
		});
	}
};

function updateIcon(tab, previewing) {
	chrome.browserAction.setIcon({
		path: previewing ? {
			19: "/icons/black-bg.svg",
			38: "/icons/black-bg.svg"
		} : {
			19: "/icons/white-bg.svg",
			38: "/icons/white-bg.svg"
		},
		tabId: tab.id
	});
	chrome.browserAction.setTitle({
		title: previewing ? 'Hide Preview' : 'Show Preview',
		tabId: tab.id
	});
}

function togglePreview(tab) {
	// tell content to render preview
	chrome.tabs.sendMessage(tab.id, {preview: true}, (result) => {
		// if content responds with preview being active
		// clear the preview instead
		if (result && result.preview) {
			chrome.tabs.sendMessage(tab.id, {preview: false});
			updateIcon(tab, false);
		} else if (result && !result.preview) {
			updateIcon(tab, true);
		}
	});
}


function disableExtension(tab) {
	chrome.browserAction.disable(tab.id);
	chrome.browserAction.setTitle({
		title: 'No Preview Available',
		tabId: tab.id
	});
}

function updateActiveTab(tab) {
	chrome.tabs.sendMessage(tab.id, {state: true}, (result) => {
		if (chrome.runtime.lastError) {
			console.log(chrome.runtime.lastError.message);
			disableExtension(tab);
			console.log(`Could not detect previewable content.`);
		} else if (result && result.supported) {
			// when there is supported content we should enable action
			// and update the icon state, which also updates the tooltip
			chrome.browserAction.enable(tab.id);
			updateIcon(tab, result.preview);
		} else {
			disableExtension(tab);
			console.log(`No previewable content detected at '${tab.url}'`);
		}
	});
}

// listen for requests for markdown from the client script
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
